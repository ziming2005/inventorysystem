/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { Grid, TileData, RoomType, ToolMode, InventoryItem, PlacedWall } from './types';
import { GRID_SIZE, LARGE_ROOM_SIZE, ROOMS } from './constants';
import IsoMap from './components/IsoMap';
import { isStructureType } from './components/IsoMapConstants';
import UIOverlay from './components/UIOverlay';
import TopToolbar from './components/TopToolbar';
import StartScreen from './components/StartScreen';
import InventoryModal from './components/InventoryModal';
import GlobalInventoryList from './components/GlobalInventoryList';
import ProfileModal, { UserProfile } from './components/ProfileModal';
import { supabase } from './services/supabaseClient';
import { fetchWorkspace, saveWorkspace } from './services/dataService';
import { signOut } from './services/authService';

// Helper to check if a room type is a large module
const isLargeRoomType = (type: ToolMode) => {
    return type === RoomType.WaitingRoom || 
           type === RoomType.ImagingSuite;
};

// Initialize grid with empty tiles
const createInitialGrid = (): Grid => {
  const grid: Grid = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    const row: TileData[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({ 
        x, 
        y, 
        roomType: RoomType.None,
        rotation: 0,
        placedWalls: []
      });
    }
    grid.push(row);
  }
  return grid;
};

// Cache hydration helpers - run once on module load
const getCachedWorkspace = (): { grid: Grid; worldColor: string; floorColor: string; userId: string | null } => {
  if (typeof window !== 'undefined') {
    try {
      const cached = window.localStorage.getItem('dcd-workspace-cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.grid) {
          return {
            grid: parsed.grid,
            worldColor: parsed.worldColor || '#bae6fd',
            floorColor: parsed.floorColor || '#e5e7eb',
            userId: parsed.userId || null
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse cached workspace on init', e);
    }
  }
  return {
    grid: createInitialGrid(),
    worldColor: '#bae6fd',
    floorColor: '#e5e7eb',
    userId: null
  };
};

const initialCachedState = getCachedWorkspace();

function App() {
  // --- App State ---
  const [user, setUser] = useState<User | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Initialize grid and colors from cache for instant hydration
  const [grid, setGrid] = useState<Grid>(initialCachedState.grid);
  
  // History State
  const [history, setHistory] = useState<Grid[]>([]);
  const [future, setFuture] = useState<Grid[]>([]);

  // Colors - initialize from cache
  const [worldColor, setWorldColor] = useState(initialCachedState.worldColor);
  const [floorColor, setFloorColor] = useState(initialCachedState.floorColor);

  // Tools & Selection
  const [activeTool, setActiveTool] = useState<ToolMode>('Select');
  const [selectedTilePos, setSelectedTilePos] = useState<{x: number, y: number} | null>(null);
  const [selectedSubTarget, setSelectedSubTarget] = useState<string | undefined>(undefined);
  const [brushSettings, setBrushSettings] = useState<Partial<TileData>>({ rotation: 0, hasInventory: false });

  // Inventory Modal State (Single Room)
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [editingInventoryTile, setEditingInventoryTile] = useState<{x: number, y: number} | null>(null);

  // Global Inventory List State
  const [showGlobalInventory, setShowGlobalInventory] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Refs for preventing duplicate loads
  const loadedUserIdRef = useRef<string | null>(initialCachedState.userId);
  const isLoadingRef = useRef(false);

  // Autosave refs
  const skipNextAutosaveRef = useRef(true);
  const autosaveTimerRef = useRef<number | null>(null);
  const autosaveInFlightRef = useRef(false);
  const lastSavedKeyRef = useRef<string | null>(null);
  const pendingAutosaveRef = useRef<{ key: string; payload: { userId: string; grid: Grid; worldColor: string; floorColor: string; inventory: InventoryItem[] } } | null>(null);

  const isReady = !!user && !workspaceLoading && !loadingSession;

  // --- Auth + Workspace bootstrapping ---
  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (mounted) {
          setUser(data.session?.user ?? null);
          setLoadingSession(false);
        }
      })
      .catch(() => {
        if (mounted) setLoadingSession(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const loadWorkspace = useCallback(async (userId: string, forceRemote = false) => {
    // Prevent concurrent loads
    if (isLoadingRef.current) return;

    // If already loaded for this user and not forcing remote, skip
    if (!forceRemote && loadedUserIdRef.current === userId) {
      return;
    }

    // Try cache first (unless forcing remote)
    if (!forceRemote && typeof window !== 'undefined') {
      try {
        const cached = window.localStorage.getItem('dcd-workspace-cache');
        if (cached) {
          const parsed = JSON.parse(cached) as { 
            userId: string; 
            grid: Grid; 
            worldColor?: string; 
            floorColor?: string 
          };
          if (parsed.userId === userId && parsed.grid) {
            skipNextAutosaveRef.current = true;
            setGrid(parsed.grid);
            if (parsed.worldColor) setWorldColor(parsed.worldColor);
            if (parsed.floorColor) setFloorColor(parsed.floorColor);
            loadedUserIdRef.current = userId;
            setStatusMessage('Loaded from cache');
            setTimeout(() => setStatusMessage(null), 1500);
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to parse cached workspace', err);
      }
    }

    // Fetch from remote
    isLoadingRef.current = true;
    setWorkspaceLoading(true);
    setStatusMessage('Loading your workspace...');

    try {
      const stored = await fetchWorkspace(userId);
      const nextGrid = stored?.grid ?? createInitialGrid();
      const nextWorld = stored?.worldColor ?? '#bae6fd';
      const nextFloor = stored?.floorColor ?? '#e5e7eb';

      skipNextAutosaveRef.current = true;
      setGrid(nextGrid);
      setWorldColor(nextWorld);
      setFloorColor(nextFloor);
      loadedUserIdRef.current = userId;

      // Cache for quick rehydration on return
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          'dcd-workspace-cache',
          JSON.stringify({ userId, grid: nextGrid, worldColor: nextWorld, floorColor: nextFloor })
        );
      }

      setStatusMessage(null);
    } catch (error) {
      console.error('Failed to load workspace', error);
      setStatusMessage('Failed to load workspace');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setWorkspaceLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!user) {
      // User logged out - reset everything
      setGrid(createInitialGrid());
      setIsEditMode(false);
      setWorldColor('#bae6fd');
      setFloorColor('#e5e7eb');
      setStatusMessage(null);
      setHistory([]);
      setFuture([]);
      setProfile(null);
      setProfileOpen(false);
      loadedUserIdRef.current = null;
      skipNextAutosaveRef.current = true;
      lastSavedKeyRef.current = null;
      pendingAutosaveRef.current = null;
      
      // Clear cache on logout
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('dcd-workspace-cache');
      }
      return;
    }

    // Only load if we haven't already loaded for this user
    if (loadedUserIdRef.current !== user.id) {
      loadWorkspace(user.id);
    }
  }, [user, loadWorkspace]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('email, full_name, company_name, phone, job_position, account_type')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.warn('Failed to load profile', error);
          return;
        }
        if (data) setProfile(data as UserProfile);
      });
  }, [user]);
  
  // --- History Logic ---
  const pushHistory = useCallback(() => {
      setHistory(prev => [...prev, grid]);
      setFuture([]);
  }, [grid]);

  const undo = useCallback(() => {
      if (history.length === 0) return;
      const previous = history[history.length - 1];
      setFuture(prev => [grid, ...prev]);
      setGrid(previous);
      setHistory(prev => prev.slice(0, -1));
  }, [history, grid]);

  const redo = useCallback(() => {
      if (future.length === 0) return;
      const next = future[0];
      setHistory(prev => [...prev, grid]);
      setGrid(next);
      setFuture(prev => prev.slice(1));
  }, [future, grid]);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          if (!isEditMode) return;
          if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
              e.preventDefault();
              undo();
          }
          if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
              e.preventDefault();
              redo();
          }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, isEditMode]);


  // --- Data Aggregation ---
  const aggregatedInventoryItems = useMemo(() => {
    const realItems: InventoryItem[] = [];
    grid.forEach(row => {
      row.forEach(tile => {
        if (tile.inventoryItems && tile.inventoryItems.length > 0) {
           const roomName = ROOMS[tile.roomType].name;
           const locationName = tile.label || roomName || `Room ${tile.x},${tile.y}`;
           
           tile.inventoryItems.forEach(item => {
               realItems.push({
                   ...item,
                   location: item.location || locationName,
                   tileX: tile.x,
                   tileY: tile.y 
               });
           });
        }
      });
    });
    
    return realItems;
  }, [grid]);

  const runAutosave = useCallback(async (payload: { userId: string; grid: Grid; worldColor: string; floorColor: string; inventory: InventoryItem[] }, key: string) => {
    if (autosaveInFlightRef.current) {
      pendingAutosaveRef.current = { key, payload };
      return;
    }

    autosaveInFlightRef.current = true;
    setIsSaving(true);
    try {
      await saveWorkspace(payload);
      lastSavedKeyRef.current = key;

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(
          'dcd-workspace-cache',
          JSON.stringify({ userId: payload.userId, grid: payload.grid, worldColor: payload.worldColor, floorColor: payload.floorColor })
        );
      }
    } catch (error) {
      console.error('Autosave failed', error);
      setStatusMessage('Autosave failed. Check console for details.');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      autosaveInFlightRef.current = false;
      setIsSaving(false);
      const pending = pendingAutosaveRef.current;
      pendingAutosaveRef.current = null;
      if (pending && pending.key !== lastSavedKeyRef.current) {
        runAutosave(pending.payload, pending.key);
      }
    }
  }, []);

  // Automatically sync to Supabase whenever the workspace changes (debounced).
  useEffect(() => {
    if (!user || !isReady) return;

    const payload = {
      userId: user.id,
      grid,
      worldColor,
      floorColor,
      inventory: aggregatedInventoryItems,
    };

    const key = JSON.stringify(payload);

    // Skip autosave right after hydration/load; treat current state as baseline.
    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      lastSavedKeyRef.current = key;
      return;
    }

    if (key === lastSavedKeyRef.current) return;

    // Keep cache updated even before the remote save completes.
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(
        'dcd-workspace-cache',
        JSON.stringify({ userId: user.id, grid, worldColor, floorColor })
      );
    }

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(() => {
      setStatusMessage('Autosaving...');
      runAutosave(payload, key).finally(() => {
        setTimeout(() => setStatusMessage(null), 1200);
      });
    }, 1200);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [user, isReady, grid, worldColor, floorColor, aggregatedInventoryItems, runAutosave]);


  // --- Interaction Logic ---

  const handleTileClick = (x: number, y: number, subTarget?: string) => {
    if (!isReady || !isEditMode) return;

    if (activeTool === 'Select') {
      // Handle Wall Selection specifically
      if (subTarget && subTarget.startsWith('wall')) {
          setSelectedTilePos({ x, y });
          setSelectedSubTarget(subTarget);
          return;
      }

      const tile = grid[y][x];
      // Clear wall selection if we clicked the floor/room
      setSelectedSubTarget(undefined);

      // For large rooms, select the top-left anchor to treat them as a group
      if (isLargeRoomType(tile.roomType)) {
          let anchorX = x;
          let anchorY = y;
          
          if (tile.variantX !== undefined && tile.variantY !== undefined) {
              anchorX = x - tile.variantX;
              anchorY = y - tile.variantY;
          } else {
              // Fallback logic for legacy tiles
              anchorX = Math.floor(x / LARGE_ROOM_SIZE) * LARGE_ROOM_SIZE;
              anchorY = Math.floor(y / LARGE_ROOM_SIZE) * LARGE_ROOM_SIZE;
          }
          // Ensure within bounds
          anchorX = Math.max(0, anchorX);
          anchorY = Math.max(0, anchorY);
          
          setSelectedTilePos({ x: anchorX, y: anchorY });
      } else {
          setSelectedTilePos({ x, y });
      }
    } else {
      // Paint / Edit Mode
      pushHistory();

      setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => [...row]);
        const currentTile = newGrid[y][x];

        // --- STRUCTURE TOOL (Walls, Doors, Windows) ---
        if (isStructureType(activeTool)) {
            const walls = currentTile.placedWalls ? [...currentTile.placedWalls] : [];
            let rotationToPlace = brushSettings.rotation || 0;

            // Enforce Perimeter-Only Walls for Large Modules
            if (isLargeRoomType(currentTile.roomType)) {
                 const vx = currentTile.variantX ?? 0;
                 const vy = currentTile.variantY ?? 0;
                 
                 let isPerimeter = false;
                 // Rot 0 (North): Valid only on top row
                 if (rotationToPlace === 0 && vy === 0) isPerimeter = true;
                 // Rot 1 (East): Valid only on right column
                 else if (rotationToPlace === 1 && vx === LARGE_ROOM_SIZE - 1) isPerimeter = true;
                 // Rot 2 (South): Valid only on bottom row
                 else if (rotationToPlace === 2 && vy === LARGE_ROOM_SIZE - 1) isPerimeter = true;
                 // Rot 3 (West): Valid only on left column
                 else if (rotationToPlace === 3 && vx === 0) isPerimeter = true;

                 if (!isPerimeter) {
                     return prevGrid;
                 }
            }

            const existingIdx = walls.findIndex(w => w.rotation === rotationToPlace);
            const newWallData: PlacedWall = { 
                type: activeTool as RoomType, 
                rotation: rotationToPlace,
                customColor: brushSettings.customColor 
            };

            if (existingIdx >= 0) {
                walls[existingIdx] = newWallData;
            } else {
                walls.push(newWallData);
            }

            newGrid[y][x] = { ...currentTile, placedWalls: walls };
            return newGrid;
        }

        // --- ERASE TOOL ---
        if (activeTool === RoomType.None) {
             // Precise Erasing logic for Walls
             if (subTarget && subTarget.startsWith('wall')) {
                 const parts = subTarget.split(':');
                 if (parts.length > 1) {
                     const wallIndex = parseInt(parts[1]);
                     if (!isNaN(wallIndex) && currentTile.placedWalls && currentTile.placedWalls[wallIndex]) {
                         const newWalls = [...currentTile.placedWalls];
                         newWalls.splice(wallIndex, 1);
                         newGrid[y][x] = { ...currentTile, placedWalls: newWalls };
                         return newGrid;
                     }
                 }
             }

             if (currentTile.roomType === RoomType.None) return prevGrid;

             // Erase Room
             const isLargeRoom = isLargeRoomType(currentTile.roomType);
             
             if (isLargeRoom) {
                 // Erase Large Block
                 let startX = x;
                 let startY = y;
                 if (currentTile.variantX !== undefined && currentTile.variantY !== undefined) {
                     startX = x - currentTile.variantX;
                     startY = y - currentTile.variantY;
                 } else {
                     startX = Math.floor(x / LARGE_ROOM_SIZE) * LARGE_ROOM_SIZE;
                     startY = Math.floor(y / LARGE_ROOM_SIZE) * LARGE_ROOM_SIZE;
                 }
                 const typeToErase = currentTile.roomType;

                 for (let dy = 0; dy < LARGE_ROOM_SIZE; dy++) {
                    for (let dx = 0; dx < LARGE_ROOM_SIZE; dx++) {
                        const tx = startX + dx;
                        const ty = startY + dy;
                        if (tx >= 0 && tx < GRID_SIZE && ty >= 0 && ty < GRID_SIZE) {
                            if (newGrid[ty][tx].roomType === typeToErase) {
                                // Full reset of tile content, but PRESERVE walls
                                const existingWalls = newGrid[ty][tx].placedWalls;
                                newGrid[ty][tx] = { 
                                    x: tx, y: ty,
                                    roomType: RoomType.None,
                                    rotation: 0,
                                    placedWalls: existingWalls 
                                };
                            }
                        }
                    }
                }
             } else {
                 // Standard Erase
                 newGrid[y][x] = { 
                     x, y, 
                     roomType: RoomType.None, 
                     rotation: 0,
                     placedWalls: currentTile.placedWalls // PRESERVE WALLS
                 };
             }
             return newGrid;
        }

        // --- ROOM TOOL ---
        if (isLargeRoomType(activeTool as RoomType)) {
            const offset = Math.floor(LARGE_ROOM_SIZE / 2);
            const startX = Math.max(0, Math.min(x - offset, GRID_SIZE - LARGE_ROOM_SIZE));
            const startY = Math.max(0, Math.min(y - offset, GRID_SIZE - LARGE_ROOM_SIZE));

            let isBlocked = false;
            for (let dy = 0; dy < LARGE_ROOM_SIZE; dy++) {
                for (let dx = 0; dx < LARGE_ROOM_SIZE; dx++) {
                    const tx = startX + dx;
                    const ty = startY + dy;
                    const tile = newGrid[ty][tx];
                    if (tile.roomType !== RoomType.None) {
                        isBlocked = true;
                        break;
                    }
                }
                if (isBlocked) break;
            }

            if (isBlocked) return prevGrid;

            for (let dy = 0; dy < LARGE_ROOM_SIZE; dy++) {
                for (let dx = 0; dx < LARGE_ROOM_SIZE; dx++) {
                    const tx = startX + dx;
                    const ty = startY + dy;
                    if (tx >= 0 && tx < GRID_SIZE && ty >= 0 && ty < GRID_SIZE) {
                         const oldTile = newGrid[ty][tx];
                         const isCenter = (dx === 2 && dy === 2);
                         newGrid[ty][tx] = { 
                            ...oldTile,
                            roomType: activeTool as RoomType,
                            rotation: brushSettings.rotation || 0,
                            label: isCenter ? brushSettings.label : undefined,
                            customColor: brushSettings.customColor,
                            variantX: dx,
                            variantY: dy,
                            hasInventory: isCenter ? (brushSettings.hasInventory || false) : false,
                            inventoryItems: undefined,
                            placedWalls: oldTile.placedWalls
                        };
                    }
                }
            }
        } else {
            const tile = newGrid[y][x];
            if (tile.roomType !== RoomType.None) return prevGrid;

            const oldTile = newGrid[y][x];
            newGrid[y][x] = { 
              ...oldTile,
              roomType: activeTool as RoomType,
              rotation: brushSettings.rotation || 0,
              label: brushSettings.label,
              customColor: brushSettings.customColor,
              variantX: undefined,
              variantY: undefined,
              hasInventory: brushSettings.hasInventory || false,
              inventoryItems: undefined,
              placedWalls: oldTile.placedWalls
            };
        }

        return newGrid;
      });
    }
  };

  const handleTileMove = (from: {x: number, y: number}, to: {x: number, y: number}, fromSubTarget?: string) => {
    if (!isReady || !isEditMode) return;
    if (from.x === to.x && from.y === to.y) return;

    // Use current state for validation logic setup
    const sourceTile = grid[from.y][from.x];

    // --- WALL MOVE ---
    if (fromSubTarget && fromSubTarget.startsWith('wall')) {
        const wallIndex = parseInt(fromSubTarget.split(':')[1]);
        if (isNaN(wallIndex)) return;
        
        const w = sourceTile.placedWalls?.[wallIndex];
        if (!w) return;

        const targetTile = grid[to.y][to.x];
        
        if (targetTile.placedWalls?.some(existing => existing.rotation === w.rotation)) {
            return; 
        }

        if (isLargeRoomType(targetTile.roomType)) {
             let vx = targetTile.variantX;
             let vy = targetTile.variantY;
             if (vx === undefined || vy === undefined) {
                 const anchorX = Math.floor(to.x / LARGE_ROOM_SIZE) * LARGE_ROOM_SIZE;
                 const anchorY = Math.floor(to.y / LARGE_ROOM_SIZE) * LARGE_ROOM_SIZE;
                 vx = to.x - anchorX;
                 vy = to.y - anchorY;
             }
             const rot = w.rotation;
             let isPerimeter = false;
             if (rot === 0 && vy === 0) isPerimeter = true;
             else if (rot === 1 && vx === LARGE_ROOM_SIZE - 1) isPerimeter = true;
             else if (rot === 2 && vy === LARGE_ROOM_SIZE - 1) isPerimeter = true;
             else if (rot === 3 && vx === 0) isPerimeter = true;

             if (!isPerimeter) return;
        }

        pushHistory();

        const newWallIndex = targetTile.placedWalls ? targetTile.placedWalls.length : 0;

        setGrid(prevGrid => {
            const newGrid = prevGrid.map(row => [...row]);
            const sTile = newGrid[from.y][from.x];
            if (!sTile.placedWalls || !sTile.placedWalls[wallIndex]) return prevGrid;
            const wallToMove = sTile.placedWalls[wallIndex];
            
            const newSourceWalls = [...sTile.placedWalls];
            newSourceWalls.splice(wallIndex, 1);
            newGrid[from.y][from.x] = { ...sTile, placedWalls: newSourceWalls };
            
            const tTile = newGrid[to.y][to.x];
            const newTargetWalls = tTile.placedWalls ? [...tTile.placedWalls] : [];
            newTargetWalls.push(wallToMove);
            newGrid[to.y][to.x] = { ...tTile, placedWalls: newTargetWalls };
            
            return newGrid;
        });

        setSelectedTilePos(to);
        setSelectedSubTarget(`wall:${newWallIndex}`);
        return;
    }

    // --- ROOM MOVE ---
    const isLargeRoom = isLargeRoomType(sourceTile.roomType);
    let targetAnchorPos = to;

    if (isLargeRoom) {
        let sourceAnchorX = from.x;
        let sourceAnchorY = from.y;
        if (sourceTile.variantX !== undefined && sourceTile.variantY !== undefined) {
             sourceAnchorX = from.x - sourceTile.variantX;
             sourceAnchorY = from.y - sourceTile.variantY;
        } else {
             sourceAnchorX = Math.floor(from.x / LARGE_ROOM_SIZE) * LARGE_ROOM_SIZE;
             sourceAnchorY = Math.floor(from.y / LARGE_ROOM_SIZE) * LARGE_ROOM_SIZE;
        }

        const offsetX = from.x - sourceAnchorX;
        const offsetY = from.y - sourceAnchorY;
        const targetAnchorX = to.x - offsetX;
        const targetAnchorY = to.y - offsetY;

        if (targetAnchorX < 0 || targetAnchorY < 0 || targetAnchorX + (LARGE_ROOM_SIZE-1) >= GRID_SIZE || targetAnchorY + (LARGE_ROOM_SIZE-1) >= GRID_SIZE) return;

        for (let dy = 0; dy < LARGE_ROOM_SIZE; dy++) {
            for (let dx = 0; dx < LARGE_ROOM_SIZE; dx++) {
                const tx = targetAnchorX + dx;
                const ty = targetAnchorY + dy;
                const isSelf = (tx >= sourceAnchorX && tx < sourceAnchorX + LARGE_ROOM_SIZE) && (ty >= sourceAnchorY && ty < sourceAnchorY + LARGE_ROOM_SIZE);
                if (!isSelf && (grid[ty][tx].roomType !== RoomType.None)) return;
            }
        }
        
        targetAnchorPos = { x: targetAnchorX, y: targetAnchorY };
    } else {
        if (grid[to.y][to.x].roomType !== RoomType.None) return;
    }

    pushHistory();

    setGrid(prevGrid => {
        if (isLargeRoom) {
            const newGrid = prevGrid.map(row => row.map(t => ({...t})));
            
            let sourceAnchorX = from.x;
            let sourceAnchorY = from.y;
            if (sourceTile.variantX !== undefined && sourceTile.variantY !== undefined) {
                 sourceAnchorX = from.x - sourceTile.variantX;
                 sourceAnchorY = from.y - sourceTile.variantY;
            } else {
                 sourceAnchorX = Math.floor(from.x / LARGE_ROOM_SIZE) * LARGE_ROOM_SIZE;
                 sourceAnchorY = Math.floor(from.y / LARGE_ROOM_SIZE) * LARGE_ROOM_SIZE;
            }

            const offsetX = from.x - sourceAnchorX;
            const offsetY = from.y - sourceAnchorY;
            const targetAnchorX = to.x - offsetX;
            const targetAnchorY = to.y - offsetY;

            // 1. Clear Old
            for (let dy = 0; dy < LARGE_ROOM_SIZE; dy++) {
                for (let dx = 0; dx < LARGE_ROOM_SIZE; dx++) {
                    const oldTile = newGrid[sourceAnchorY+dy][sourceAnchorX+dx];
                    newGrid[sourceAnchorY+dy][sourceAnchorX+dx] = { 
                        x: sourceAnchorX+dx, y: sourceAnchorY+dy, 
                        roomType: RoomType.None, rotation: 0, 
                        placedWalls: oldTile.placedWalls 
                    };
                }
            }
            // 2. Set New
            for (let dy = 0; dy < LARGE_ROOM_SIZE; dy++) {
                for (let dx = 0; dx < LARGE_ROOM_SIZE; dx++) {
                    const tx = targetAnchorX + dx;
                    const ty = targetAnchorY + dy;
                    const oldTarget = newGrid[ty][tx];
                    
                    const srcTile = prevGrid[sourceAnchorY+dy][sourceAnchorX+dx];

                    newGrid[ty][tx] = {
                        ...srcTile,
                        x: tx, y: ty,
                        variantX: dx, variantY: dy,
                        placedWalls: oldTarget.placedWalls
                    };
                }
            }
            return newGrid;

        } else {
            const newGrid = prevGrid.map(row => [...row]);
            const tileFrom = newGrid[from.y][from.x];
            const tileTo = newGrid[to.y][to.x];
            
            newGrid[to.y][to.x] = { 
                ...tileFrom, 
                x: to.x, y: to.y, 
                placedWalls: tileTo.placedWalls 
            };

            newGrid[from.y][from.x] = { 
                x: from.x, y: from.y, 
                roomType: RoomType.None, rotation: 0, 
                placedWalls: tileFrom.placedWalls 
            };
            
            return newGrid;
        }
    });

    setSelectedTilePos(targetAnchorPos);
    setSelectedSubTarget(undefined);
  };

  const updateSelectedTile = (updates: Partial<TileData>) => {
    if (!selectedTilePos) return;
    const { x, y } = selectedTilePos;
    const tile = grid[y][x];

    pushHistory();

    setGrid(prevGrid => {
      const newGrid = prevGrid.map(row => [...row]);
      if (isLargeRoomType(tile.roomType)) {
          let startX = x;
          let startY = y;
          if (tile.variantX !== undefined && tile.variantY !== undefined) {
               startX = x - tile.variantX;
               startY = y - tile.variantY;
          }
          for(let dy=0; dy<LARGE_ROOM_SIZE; dy++) {
              for(let dx=0; dx<LARGE_ROOM_SIZE; dx++) {
                  const tx = startX + dx;
                  const ty = startY + dy;
                  if (tx >= 0 && tx < GRID_SIZE && ty >= 0 && ty < GRID_SIZE) {
                       if (newGrid[ty][tx].roomType === tile.roomType) {
                            newGrid[ty][tx] = { ...newGrid[ty][tx], ...updates };
                       }
                  }
              }
          }
      } else {
          newGrid[y][x] = { ...newGrid[y][x], ...updates };
      }
      return newGrid;
    });
  };

  const handleInspectorUpdate = (updates: Partial<TileData>) => {
    if (!selectedTilePos) return;

    if (selectedSubTarget && selectedSubTarget.startsWith('wall')) {
        const wallIndex = parseInt(selectedSubTarget.split(':')[1]);
        if (isNaN(wallIndex)) return;

        pushHistory();

        setGrid(prevGrid => {
            const newGrid = prevGrid.map(row => [...row]);
            const tile = newGrid[selectedTilePos.y][selectedTilePos.x];
            
            if (tile.placedWalls && tile.placedWalls[wallIndex]) {
                const newWalls = [...tile.placedWalls];
                if (updates.rotation !== undefined) {
                     newWalls[wallIndex] = { ...newWalls[wallIndex], rotation: updates.rotation };
                }
                if (updates.customColor !== undefined) {
                     newWalls[wallIndex] = { ...newWalls[wallIndex], customColor: updates.customColor };
                }
                
                newGrid[selectedTilePos.y][selectedTilePos.x] = { ...tile, placedWalls: newWalls };
            }
            return newGrid;
        });
        return;
    }
    
    updateSelectedTile(updates);
  };

  // Inventory Handlers
  const handleInventoryClick = (x: number, y: number) => {
      setEditingInventoryTile({x, y});
      setInventoryModalOpen(true);
  };

  const handleSaveInventory = (items: InventoryItem[]) => {
      if (!editingInventoryTile) return;
      const { x, y } = editingInventoryTile;
      
      pushHistory();

      setGrid(prevGrid => {
        const newGrid = prevGrid.map(row => [...row]);
        newGrid[y][x] = { ...newGrid[y][x], inventoryItems: items };
        return newGrid;
      });
  };

  const handleSignOut = async () => {
    await signOut();
    setUser(null);
    setIsEditMode(false);
    setShowGlobalInventory(false);
    setProfileOpen(false);
    lastSavedKeyRef.current = null;
    pendingAutosaveRef.current = null;
    skipNextAutosaveRef.current = true;
  };

  let selectedTileData = selectedTilePos ? grid[selectedTilePos.y][selectedTilePos.x] : null;

  if (selectedTileData && selectedSubTarget && selectedSubTarget.startsWith('wall')) {
      const wallIndex = parseInt(selectedSubTarget.split(':')[1]);
      const walls = selectedTileData.placedWalls || [];
      if (walls[wallIndex]) {
          const wall = walls[wallIndex];
          selectedTileData = {
              ...selectedTileData,
              roomType: wall.type,
              rotation: wall.rotation,
              customColor: wall.customColor,
              label: undefined,
              hasInventory: false
          };
      }
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900 flex">
      <div className="absolute inset-0 z-0">
        <IsoMap 
          grid={grid} 
          onTileClick={handleTileClick} 
          onTileMove={handleTileMove}
          activeTool={activeTool}
          selectedTilePos={selectedTilePos}
          selectedSubTarget={selectedSubTarget}
          onInventoryClick={handleInventoryClick}
          brushSettings={brushSettings}
          worldColor={worldColor}
          floorColor={floorColor}
          readOnly={!isReady || !isEditMode}
        />
      </div>
      {loadingSession && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 text-white z-50">Checking session...</div>
      )}
      {!user && !loadingSession && <StartScreen onAuthenticated={() => setStatusMessage(null)} />}
      {isReady && (
        <>
	            <TopToolbar 
	                canUndo={history.length > 0}
	                canRedo={future.length > 0}
	                onUndo={undo}
	                onRedo={redo}
	                worldColor={worldColor}
	                onWorldColorChange={setWorldColor}
	                floorColor={floorColor}
	                onFloorColorChange={setFloorColor}
	                isEditMode={isEditMode}
	                onToggleEditMode={() => {
	                  if (isEditMode) {
	                      setActiveTool('Select');
	                      setSelectedTilePos(null);
	                      setSelectedSubTarget(undefined);
	                  }
	                  setIsEditMode(!isEditMode);
	                }}
	                onShowInventory={() => setShowGlobalInventory(true)}
	                saving={isSaving}
	                userEmail={user?.email}
	                onOpenProfile={() => setProfileOpen(true)}
	            />
            <UIOverlay
              activeTool={activeTool}
              onSelectTool={(t) => {
                  setActiveTool(t);
                  setBrushSettings({ rotation: 0, hasInventory: false, customColor: undefined, label: '' });
                  setSelectedTilePos(null);
                  setSelectedSubTarget(undefined);
              }}
              selectedTile={selectedTileData}
              onUpdateTile={handleInspectorUpdate}
              brushSettings={brushSettings}
              onUpdateBrushSettings={(s) => setBrushSettings(prev => ({...prev, ...s}))}
              isEditMode={isEditMode}
            />
        </>
      )}
      {editingInventoryTile && (
        <InventoryModal 
            isOpen={inventoryModalOpen}
            onClose={() => { setInventoryModalOpen(false); setEditingInventoryTile(null); }}
            onSave={handleSaveInventory}
            initialItems={grid[editingInventoryTile.y][editingInventoryTile.x].inventoryItems || []}
            title={`${ROOMS[grid[editingInventoryTile.y][editingInventoryTile.x].roomType].name} Inventory`}
        />
      )}
      <GlobalInventoryList 
          isOpen={showGlobalInventory}
          onClose={() => setShowGlobalInventory(false)}
          items={aggregatedInventoryItems}
      />
      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        profile={profile}
        userEmail={user?.email ?? null}
        onSignOut={handleSignOut}
      />
      {statusMessage && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/80 text-white px-4 py-2 rounded-full text-sm z-40 shadow-lg">
          {statusMessage}
        </div>
      )}
    </div>
  );
}

export default App;

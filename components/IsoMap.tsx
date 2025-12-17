/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, useCallback, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { MapControls, OrthographicCamera, Float } from '@react-three/drei';
import * as THREE from 'three';
import { Grid, RoomType, ToolMode, TileData } from '../types';
import { GRID_SIZE, LARGE_ROOM_SIZE, ROOMS } from '../constants';
import { TILE_SIZE, gridToWorld, isLargeRoomType, isStructureType } from './IsoMapConstants';
import GroundTile, { Cursor } from './GroundTile';
import ProceduralRoom from './ProceduralRoom';
import RoomFurniture from './RoomFurniture';

interface IsoMapProps {
  grid: Grid;
  onTileClick: (x: number, y: number, subTarget?: string) => void;
  onTileMove: (from: {x: number, y: number}, to: {x: number, y: number}, fromSubTarget?: string) => void;
  activeTool: ToolMode;
  selectedTilePos: {x: number, y: number} | null;
  selectedSubTarget?: string;
  onInventoryClick?: (x: number, y: number) => void;
  brushSettings: Partial<TileData>;
  worldColor: string;
  floorColor: string;
  readOnly?: boolean;
}

const IsoMap: React.FC<IsoMapProps> = ({ 
    grid, onTileClick, onTileMove, activeTool, selectedTilePos, 
    selectedSubTarget, onInventoryClick, brushSettings,
    worldColor, floorColor, readOnly
}) => {
  const [hoveredTile, setHoveredTile] = useState<{x: number, y: number, subTarget?: string} | null>(null);
  // Track subTarget in dragStart to know if we are dragging a wall
  const [dragStart, setDragStart] = useState<{x: number, y: number, subTarget?: string} | null>(null);
  const controlsRef = useRef<any>(null);

  const handleHover = useCallback((x: number, y: number, subTarget?: string) => {
      setHoveredTile({ x, y, subTarget });
  }, []);
  const handleLeave = useCallback(() => setHoveredTile(null), []);

  const handlePointerDown = useCallback((x: number, y: number, subTarget?: string) => {
    if (readOnly) return;
    if (activeTool === 'Select') setDragStart({ x, y, subTarget });
  }, [activeTool, readOnly]);

  const handlePointerUp = useCallback((x: number, y: number, subTarget?: string) => {
    if (readOnly) return;
    if (activeTool === 'Select' && dragStart) {
        if (dragStart.x === x && dragStart.y === y) {
             onTileClick(x, y, subTarget);
        } else {
             onTileMove(dragStart, { x, y }, dragStart.subTarget);
        }
    } else if (activeTool !== 'Select') {
        onTileClick(x, y, subTarget);
    }
    setDragStart(null);
  }, [activeTool, dragStart, onTileClick, onTileMove, readOnly]);

  const rotateView = (angle: number) => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;
    const { object: camera, target } = controls;
    const x = camera.position.x - target.x;
    const z = camera.position.z - target.z;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    const newX = x * cos - z * sin;
    const newZ = x * sin + z * cos;

    camera.position.x = target.x + newX;
    camera.position.z = target.z + newZ;
    controls.update();
  };

  const isSelectMode = activeTool === 'Select';
  const showPaintPreview = !readOnly && hoveredTile && !isSelectMode && activeTool !== RoomType.None;
  
  // Calculate drag status
  const isDragging = !!(dragStart && hoveredTile && (dragStart.x !== hoveredTile.x || dragStart.y !== hoveredTile.y));
  const dragSourceTile = dragStart ? grid[dragStart.y][dragStart.x] : null;

  // Calculate set of keys for tiles currently being dragged (to hide them/opacity)
  const draggedKeys = useMemo(() => {
    const keys = new Set<string>();
    if (readOnly || !isDragging || !dragStart || !dragSourceTile) return keys;

    // If dragging a wall, DO NOT hide the floor tile
    if (dragStart.subTarget && dragStart.subTarget.startsWith('wall')) return keys;

    if (isLargeRoomType(dragSourceTile.roomType)) {
        // Find anchor
        let anchorX = dragStart.x;
        let anchorY = dragStart.y;
        if (dragSourceTile.variantX !== undefined && dragSourceTile.variantY !== undefined) {
            anchorX = dragStart.x - dragSourceTile.variantX;
            anchorY = dragStart.y - dragSourceTile.variantY;
        } else {
             // Fallback
             anchorX = Math.floor(dragStart.x / LARGE_ROOM_SIZE) * LARGE_ROOM_SIZE;
             anchorY = Math.floor(dragStart.y / LARGE_ROOM_SIZE) * LARGE_ROOM_SIZE;
        }

        // Add all tiles
        for(let dy=0; dy<LARGE_ROOM_SIZE; dy++) {
            for(let dx=0; dx<LARGE_ROOM_SIZE; dx++) {
                keys.add(`${anchorX+dx}-${anchorY+dy}`);
            }
        }
    } else {
        keys.add(`${dragStart.x}-${dragStart.y}`);
    }
    return keys;
  }, [isDragging, dragStart, dragSourceTile, readOnly]);

  // Compute the set of selected tile keys for highlighting
  const selectedKeys = useMemo(() => {
    const keys = new Set<string>();
    if (!selectedTilePos) return keys;

    const { x, y } = selectedTilePos;
    // Safety check
    if (y < 0 || y >= GRID_SIZE || x < 0 || x >= GRID_SIZE) return keys;

    const tile = grid[y][x];
    
    // Check for large room types
    if (isLargeRoomType(tile.roomType)) {
        // Since handleTileClick normalizes to the top-left anchor, we just highlight the block from here.
        let anchorX = x;
        let anchorY = y;
        
        for(let dy=0; dy<LARGE_ROOM_SIZE; dy++) {
            for(let dx=0; dx<LARGE_ROOM_SIZE; dx++) {
                const tx = anchorX + dx;
                const ty = anchorY + dy;
                if (tx < GRID_SIZE && ty < GRID_SIZE && grid[ty][tx].roomType === tile.roomType) {
                    keys.add(`${tx}-${ty}`);
                }
            }
        }
    } else {
        keys.add(`${x}-${y}`);
    }
    return keys;
  }, [selectedTilePos, grid]);

  // Determine active tiles for preview (handle large block logic for painting)
  const previewTiles = useMemo(() => {
    if (readOnly || !hoveredTile) return [];
    
    // Dragging Preview
    if (isDragging && dragStart && dragSourceTile) {
        // If dragging a wall, we handle preview separately (in the render loop to pick specific wall model)
        // so return empty here to avoid showing a floor tile cursor
        if (dragStart.subTarget && dragStart.subTarget.startsWith('wall')) return [];

        if (isLargeRoomType(dragSourceTile.roomType)) {
             let anchorOffsetX = 0;
             let anchorOffsetY = 0;
             
             if (dragSourceTile.variantX !== undefined && dragSourceTile.variantY !== undefined) {
                 anchorOffsetX = dragSourceTile.variantX;
                 anchorOffsetY = dragSourceTile.variantY;
             } else {
                 const anchorX = Math.floor(dragStart.x / LARGE_ROOM_SIZE) * LARGE_ROOM_SIZE;
                 const anchorY = Math.floor(dragStart.y / LARGE_ROOM_SIZE) * LARGE_ROOM_SIZE;
                 anchorOffsetX = dragStart.x - anchorX;
                 anchorOffsetY = dragStart.y - anchorY;
             }

             const targetAnchorX = hoveredTile.x - anchorOffsetX;
             const targetAnchorY = hoveredTile.y - anchorOffsetY;
             
             const tiles = [];
             for(let dy=0; dy<LARGE_ROOM_SIZE; dy++) {
                for(let dx=0; dx<LARGE_ROOM_SIZE; dx++) {
                   const tx = targetAnchorX + dx;
                   const ty = targetAnchorY + dy;
                   if (tx >= 0 && tx < GRID_SIZE && ty >= 0 && ty < GRID_SIZE) {
                       const [wx, _, wz] = gridToWorld(tx, ty);
                       tiles.push({ x: tx, y: ty, wx, wz, variantX: dx, variantY: dy });
                   }
                }
             }
             return tiles;
        } else {
             const [wx, _, wz] = gridToWorld(hoveredTile.x, hoveredTile.y);
             return [{ x: hoveredTile.x, y: hoveredTile.y, wx, wz }];
        }
    }

    const target = grid[hoveredTile.y][hoveredTile.x];

    // Case 1: Painting Large Room
    if (activeTool !== 'Select' && isLargeRoomType(activeTool as RoomType)) {
        const offset = Math.floor(LARGE_ROOM_SIZE / 2);
        // Center brush on cursor and clamp
        const startX = Math.max(0, Math.min(hoveredTile.x - offset, GRID_SIZE - LARGE_ROOM_SIZE));
        const startY = Math.max(0, Math.min(hoveredTile.y - offset, GRID_SIZE - LARGE_ROOM_SIZE));

        const tiles = [];
        for(let dy=0; dy<LARGE_ROOM_SIZE; dy++) {
           for(let dx=0; dx<LARGE_ROOM_SIZE; dx++) {
              const tx = startX + dx;
              const ty = startY + dy;
              if (tx >= 0 && tx < GRID_SIZE && ty >= 0 && ty < GRID_SIZE) {
                  const [wx, _, wz] = gridToWorld(tx, ty);
                  tiles.push({ x: tx, y: ty, wx, wz, variantX: dx, variantY: dy });
              }
           }
        }
        return tiles;
    }

    // Case 2: Erasing
    if (activeTool === RoomType.None && !isSelectMode) {
         // Priority: Walls on specific tile
         // Only focus on the wall if we are explicitly hovering it
         if (hoveredTile.subTarget && hoveredTile.subTarget.startsWith('wall')) {
             const [wx, _, wz] = gridToWorld(hoveredTile.x, hoveredTile.y);
             return [{ x: hoveredTile.x, y: hoveredTile.y, wx, wz }];
         }

         // Otherwise (hovering floor/base), prioritize room erasure (Large Room Highlight)
         if (isLargeRoomType(target.roomType)) {
            let startX = hoveredTile.x;
            let startY = hoveredTile.y;
            if (target.variantX !== undefined && target.variantY !== undefined) {
                 startX = hoveredTile.x - target.variantX;
                 startY = hoveredTile.y - target.variantY;
            } else {
                 startX = Math.floor(hoveredTile.x / LARGE_ROOM_SIZE) * LARGE_ROOM_SIZE;
                 startY = Math.floor(hoveredTile.y / LARGE_ROOM_SIZE) * LARGE_ROOM_SIZE;
            }

            const targetType = target.roomType;
            const tiles = [];
            for(let dy=0; dy<LARGE_ROOM_SIZE; dy++) {
               for(let dx=0; dx<LARGE_ROOM_SIZE; dx++) {
                  const tx = startX + dx;
                  const ty = startY + dy;
                  if (tx >= 0 && tx < GRID_SIZE && ty >= 0 && ty < GRID_SIZE) {
                      // Only highlight matching types
                      if (grid[ty][tx].roomType === targetType) {
                          const [wx, _, wz] = gridToWorld(tx, ty);
                          tiles.push({ x: tx, y: ty, wx, wz });
                      }
                  }
               }
            }
            if (tiles.length > 0) return tiles;
         }
    }

    // Case 3: Select Mode
    if (isSelectMode) {
        // Priority for structures: if hovering a wall/door/window, hide the floor cursor
        if (hoveredTile.subTarget && hoveredTile.subTarget.startsWith('wall')) {
            return [];
        }

        // Highlight entire large room
        if (isLargeRoomType(target.roomType)) {
            let startX = hoveredTile.x;
            let startY = hoveredTile.y;
            if (target.variantX !== undefined && target.variantY !== undefined) {
                    startX = hoveredTile.x - target.variantX;
                    startY = hoveredTile.y - target.variantY;
            } else {
                    startX = Math.floor(hoveredTile.x / LARGE_ROOM_SIZE) * LARGE_ROOM_SIZE;
                    startY = Math.floor(hoveredTile.y / LARGE_ROOM_SIZE) * LARGE_ROOM_SIZE;
            }

            const targetType = target.roomType;
            const tiles = [];
            for(let dy=0; dy<LARGE_ROOM_SIZE; dy++) {
                for(let dx=0; dx<LARGE_ROOM_SIZE; dx++) {
                    const tx = startX + dx;
                    const ty = startY + dy;
                    if (tx >= 0 && tx < GRID_SIZE && ty >= 0 && ty < GRID_SIZE) {
                        // Only highlight matching types
                        if (grid[ty][tx].roomType === targetType) {
                            const [wx, _, wz] = gridToWorld(tx, ty);
                            tiles.push({ x: tx, y: ty, wx, wz });
                        }
                    }
                }
            }
            if (tiles.length > 0) return tiles;
        }
    }
    
    const [wx, _, wz] = gridToWorld(hoveredTile.x, hoveredTile.y);
    return [{ x: hoveredTile.x, y: hoveredTile.y, wx, wz }];
  }, [hoveredTile, activeTool, isSelectMode, grid, isDragging, dragStart, dragSourceTile, readOnly]);

  // Check valid placement for visual feedback (Painting)
  const isValidPlacement = useMemo(() => {
      if (!hoveredTile || isSelectMode || activeTool === RoomType.None) return true;
      const target = grid[hoveredTile.y][hoveredTile.x];
      
      // If tool is a structure (wall/door)
      if (isStructureType(activeTool)) {
          if (isLargeRoomType(target.roomType)) {
               const vx = target.variantX ?? 0;
               const vy = target.variantY ?? 0;
               const rot = brushSettings.rotation || 0;
               
               if (rot === 0 && vy !== 0) return false;
               if (rot === 1 && vx !== LARGE_ROOM_SIZE - 1) return false;
               if (rot === 2 && vy !== LARGE_ROOM_SIZE - 1) return false;
               if (rot === 3 && vx !== 0) return false;
          }
          return true;
      }
      return !previewTiles.some(t => {
          const tile = grid[t.y][t.x];
          return tile.roomType !== RoomType.None;
      });
  }, [hoveredTile, isSelectMode, activeTool, previewTiles, grid, brushSettings]);

  // Calculate validity of the current drag operation (Moving)
  const isDragValid = useMemo(() => {
    if (readOnly || !isDragging || !dragStart || !hoveredTile || !dragSourceTile) return true;

    // Moving a Wall/Structure?
    if (dragStart.subTarget && dragStart.subTarget.startsWith('wall')) {
        const parts = dragStart.subTarget.split(':');
        const wallIndex = parseInt(parts[1]);
        if (!isNaN(wallIndex) && dragSourceTile.placedWalls && dragSourceTile.placedWalls[wallIndex]) {
            const movingWall = dragSourceTile.placedWalls[wallIndex];
            const targetTile = grid[hoveredTile.y][hoveredTile.x];
            
            // 1. Check if target tile has a wall with the SAME rotation (Overwrite prevention)
            if (targetTile.placedWalls && targetTile.placedWalls.some(w => w.rotation === movingWall.rotation)) {
                return false; 
            }

            // 2. Check Perimeter Constraint for Large Rooms
            if (isLargeRoomType(targetTile.roomType)) {
                let vx = targetTile.variantX;
                let vy = targetTile.variantY;
                // Fallback calculation if undefined (should not happen for valid large rooms)
                if (vx === undefined || vy === undefined) {
                    const anchorX = Math.floor(hoveredTile.x / LARGE_ROOM_SIZE) * LARGE_ROOM_SIZE;
                    const anchorY = Math.floor(hoveredTile.y / LARGE_ROOM_SIZE) * LARGE_ROOM_SIZE;
                    vx = hoveredTile.x - anchorX;
                    vy = hoveredTile.y - anchorY;
                }

                const rot = movingWall.rotation;
                let isPerimeter = false;
                // Rot 0 (North): Valid only on top row
                if (rot === 0 && vy === 0) isPerimeter = true;
                // Rot 1 (East): Valid only on right column
                else if (rot === 1 && vx === LARGE_ROOM_SIZE - 1) isPerimeter = true;
                // Rot 2 (South): Valid only on bottom row
                else if (rot === 2 && vy === LARGE_ROOM_SIZE - 1) isPerimeter = true;
                // Rot 3 (West): Valid only on left column
                else if (rot === 3 && vx === 0) isPerimeter = true;

                if (!isPerimeter) return false;
            }
        }
        return true;
    }

    // Check bounds & collisions
    if (isLargeRoomType(dragSourceTile.roomType)) {
        // Large Room Logic
        let sourceAnchorX = dragStart.x;
        let sourceAnchorY = dragStart.y;
        if (dragSourceTile.variantX !== undefined && dragSourceTile.variantY !== undefined) {
             sourceAnchorX = dragStart.x - dragSourceTile.variantX;
             sourceAnchorY = dragStart.y - dragSourceTile.variantY;
        } else {
             sourceAnchorX = Math.floor(dragStart.x / LARGE_ROOM_SIZE) * LARGE_ROOM_SIZE;
             sourceAnchorY = Math.floor(dragStart.y / LARGE_ROOM_SIZE) * LARGE_ROOM_SIZE;
        }

        const offsetX = dragStart.x - sourceAnchorX;
        const offsetY = dragStart.y - sourceAnchorY;

        const targetAnchorX = hoveredTile.x - offsetX;
        const targetAnchorY = hoveredTile.y - offsetY;

        // Bounds check
        if (targetAnchorX < 0 || targetAnchorY < 0 || targetAnchorX + (LARGE_ROOM_SIZE - 1) >= GRID_SIZE || targetAnchorY + (LARGE_ROOM_SIZE - 1) >= GRID_SIZE) {
            return false;
        }

        // Collision check
        for (let dy = 0; dy < LARGE_ROOM_SIZE; dy++) {
            for (let dx = 0; dx < LARGE_ROOM_SIZE; dx++) {
                const tx = targetAnchorX + dx;
                const ty = targetAnchorY + dy;
                const isSelf = (tx >= sourceAnchorX && tx < sourceAnchorX + LARGE_ROOM_SIZE) && (ty >= sourceAnchorY && ty < sourceAnchorY + LARGE_ROOM_SIZE);
                if (!isSelf && (grid[ty][tx].roomType !== RoomType.None)) {
                    return false;
                }
            }
        }
        return true;
    } else {
        // Single Tile Logic
        if (hoveredTile.x === dragStart.x && hoveredTile.y === dragStart.y) return true;
        if (grid[hoveredTile.y][hoveredTile.x].roomType !== RoomType.None) {
            return false;
        }
        return true;
    }
  }, [isDragging, dragStart, hoveredTile, dragSourceTile, grid, readOnly]);


  return (
    <div className="absolute inset-0 touch-none" style={{ backgroundColor: worldColor }} onContextMenu={(e) => e.preventDefault()}>
      <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true }}>
        <OrthographicCamera makeDefault zoom={10} position={[20, 20, 20]} near={-100} far={200} />
        <MapControls 
          ref={controlsRef}
          enableRotate={true}
          enableZoom={true}
          minZoom={5}
          maxZoom={120}
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={0.1}
          target={[0, 0, 0]}
          mouseButtons={{ LEFT: -1 as any, MIDDLE: THREE.MOUSE.ROTATE, RIGHT: THREE.MOUSE.PAN }}
        />

        <ambientLight intensity={0.7} color="#ffffff" />
        <directionalLight
          castShadow
          position={[10, 20, 5]}
          intensity={1.5}
          color="#ffffff"
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
          shadow-camera-left={-100}
          shadow-camera-right={100}
          shadow-camera-top={100}
          shadow-camera-bottom={-100}
        />

        <group>
          {grid.map((row, y) =>
            row.map((tile, x) => {
              const [wx, _, wz] = gridToWorld(x, y);
              
              // Use the calculated set to determine selection state
              const isSelected = selectedKeys.has(`${x}-${y}`);
              const isBeingDragged = draggedKeys.has(`${x}-${y}`);
              const hasWalls = tile.placedWalls && tile.placedWalls.length > 0;
              
              const config = ROOMS[tile.roomType];
              const roomFloorColor = config.floorColor; 
              const furnitureColor = tile.customColor;
              
              // Filter out the wall being dragged so it doesn't show at the source
              let visiblePlacedWalls = tile.placedWalls;
              if (isDragging && dragStart && dragStart.x === x && dragStart.y === y && dragStart.subTarget?.startsWith('wall')) {
                  const wallIndex = parseInt(dragStart.subTarget.split(':')[1]);
                  if (!isNaN(wallIndex) && visiblePlacedWalls) {
                      visiblePlacedWalls = visiblePlacedWalls.filter((_, i) => i !== wallIndex);
                  }
              }

              return (
              <React.Fragment key={`${x}-${y}`}>
                <GroundTile 
                    type={tile.roomType} x={x} y={y} isSelected={isSelected}
                    onHover={(tx, ty) => handleHover(tx, ty)}
                    onLeave={handleLeave}
                    onPointerDown={(tx, ty) => handlePointerDown(tx, ty)}
                    onPointerUp={(tx, ty) => handlePointerUp(tx, ty)}
                    floorColor={floorColor}
                />
                <group position={[wx, 0, wz]}>
                    {/* Render procedural room if it has a room type OR if it has walls */}
                    {(tile.roomType !== RoomType.None || hasWalls) && (
                      <group scale={[TILE_SIZE, TILE_SIZE, TILE_SIZE]}>
                        <ProceduralRoom 
                            type={tile.roomType} floorColor={roomFloorColor} furnitureColor={furnitureColor}
                            rotation={tile.rotation} label={tile.label} opacity={isBeingDragged ? 0.3 : 1}
                            transparent={!!isBeingDragged} x={x} y={y} variantX={tile.variantX} variantY={tile.variantY}
                            hasInventory={tile.hasInventory}
                            onInventoryClick={onInventoryClick}
                            placedWalls={visiblePlacedWalls}
                            // Interaction handlers for sub-targets (wall/floor)
                            onPointerDown={(e, sub) => { 
                                if (e.button === 0) { // Only allow Left Click to start interaction/drag
                                    e.stopPropagation(); 
                                    handlePointerDown(x, y, sub);
                                }
                            }}
                            onPointerUp={(e, sub) => {
                                if (e.button === 0) { // Only allow Left Click to end interaction/drag
                                    e.stopPropagation();
                                    handlePointerUp(x, y, sub);
                                }
                            }}
                            onPointerEnter={(e, sub) => { e.stopPropagation(); handleHover(x, y, sub); }}
                            onPointerLeave={(e) => { e.stopPropagation(); handleLeave(); }}
                        />
                      </group>
                    )}
                </group>
              </React.Fragment>
            )})
          )}

          {!readOnly && (
            <group raycast={() => null}>
                {/* Paint Preview (3D Model) */}
                {showPaintPreview && previewTiles.map((tile: any, idx) => (
                <group key={idx} position={[tile.wx, 0, tile.wz]} scale={[TILE_SIZE, TILE_SIZE, TILE_SIZE]}>
                    <Float speed={5} rotationIntensity={0} floatIntensity={0.1} floatingRange={[0, 0.1]}>
                    <ProceduralRoom 
                        type={activeTool as RoomType} 
                        floorColor={isValidPlacement ? ROOMS[activeTool as RoomType].floorColor : '#ef4444'} 
                        furnitureColor={brushSettings.customColor}
                        rotation={brushSettings.rotation || 0} 
                        transparent opacity={0.6} x={tile.x} y={tile.y} variantX={tile.variantX} variantY={tile.variantY}
                    />
                    </Float>
                </group>
                ))}
                
                {/* Dragging Wall Preview - Ghost Wall */}
                {isDragging && dragStart?.subTarget?.startsWith('wall') && hoveredTile && (() => {
                     const sourceTile = grid[dragStart.y][dragStart.x];
                     const wallIndex = parseInt(dragStart.subTarget.split(':')[1]);
                     if (sourceTile.placedWalls && sourceTile.placedWalls[wallIndex]) {
                         const wall = sourceTile.placedWalls[wallIndex];
                         const [wx, _, wz] = gridToWorld(hoveredTile.x, hoveredTile.y);
                         const wallRotRad = -wall.rotation * (Math.PI / 2);
                         const isValid = isDragValid; // Use computed validity

                         return (
                            <group position={[wx, 0, wz]} scale={[TILE_SIZE, TILE_SIZE, TILE_SIZE]}>
                                 <group rotation={[0, wallRotRad, 0]}>
                                     <RoomFurniture 
                                         type={wall.type} 
                                         customColor={isValid ? wall.customColor : '#ef4444'}
                                         opacity={0.6}
                                         transparent
                                         x={hoveredTile.x} y={hoveredTile.y}
                                     />
                                 </group>
                            </group>
                         );
                     }
                     return null;
                })()}

                {/* Erase Wall Preview (Red Highlight on Wall) */}
                {hoveredTile && activeTool === RoomType.None && (() => {
                    const tile = grid[hoveredTile.y][hoveredTile.x];
                    if (hoveredTile.subTarget && hoveredTile.subTarget.startsWith('wall') && tile.placedWalls) {
                        const parts = hoveredTile.subTarget.split(':');
                        const wallIndex = parts.length > 1 ? parseInt(parts[1]) : -1;
                        if (wallIndex !== -1 && tile.placedWalls[wallIndex]) {
                            const wall = tile.placedWalls[wallIndex];
                            const [wx, _, wz] = gridToWorld(hoveredTile.x, hoveredTile.y);
                            const wallRotRad = -wall.rotation * (Math.PI / 2);
                            return (
                                <group key={`erase-wall-${wallIndex}`} position={[wx, 0, wz]} scale={[TILE_SIZE, TILE_SIZE, TILE_SIZE]}>
                                    <group rotation={[0, wallRotRad, 0]}>
                                            <RoomFurniture 
                                                type={wall.type}
                                                customColor="#ef4444" 
                                                opacity={0.8}
                                                transparent
                                                x={hoveredTile.x} 
                                                y={hoveredTile.y}
                                            />
                                    </group>
                                </group>
                            );
                        }
                    }
                    return null;
                })()}

                {/* Select Wall Preview (Blue Hover Highlight on Wall) */}
                {hoveredTile && activeTool === 'Select' && !isDragging && (() => {
                    const tile = grid[hoveredTile.y][hoveredTile.x];
                    if (hoveredTile.subTarget && hoveredTile.subTarget.startsWith('wall') && tile.placedWalls) {
                        const parts = hoveredTile.subTarget.split(':');
                        const wallIndex = parts.length > 1 ? parseInt(parts[1]) : -1;
                        if (wallIndex !== -1 && tile.placedWalls[wallIndex]) {
                            const wall = tile.placedWalls[wallIndex];
                            const [wx, _, wz] = gridToWorld(hoveredTile.x, hoveredTile.y);
                            const wallRotRad = -wall.rotation * (Math.PI / 2);
                            return (
                                <group key={`select-wall-${wallIndex}`} position={[wx, 0, wz]} scale={[TILE_SIZE, TILE_SIZE, TILE_SIZE]}>
                                    <group rotation={[0, wallRotRad, 0]}>
                                            <RoomFurniture 
                                                type={wall.type}
                                                customColor="#3b82f6" 
                                                opacity={0.6}
                                                transparent
                                                x={hoveredTile.x} 
                                                y={hoveredTile.y}
                                            />
                                    </group>
                                </group>
                            );
                        }
                    }
                    return null;
                })()}

                {/* Selected Wall Highlight (Persistent Blue Highlight on Wall) */}
                {selectedTilePos && selectedSubTarget && selectedSubTarget.startsWith('wall') && (() => {
                    const tile = grid[selectedTilePos.y][selectedTilePos.x];
                    const parts = selectedSubTarget.split(':');
                    const wallIndex = parts.length > 1 ? parseInt(parts[1]) : -1;
                    if (wallIndex !== -1 && tile.placedWalls && tile.placedWalls[wallIndex]) {
                            const wall = tile.placedWalls[wallIndex];
                            const [wx, _, wz] = gridToWorld(selectedTilePos.x, selectedTilePos.y);
                            const wallRotRad = -wall.rotation * (Math.PI / 2);
                            return (
                                <group key={`selected-wall-${wallIndex}`} position={[wx, 0, wz]} scale={[TILE_SIZE, TILE_SIZE, TILE_SIZE]}>
                                    <group rotation={[0, wallRotRad, 0]}>
                                        <RoomFurniture 
                                            type={wall.type}
                                            customColor="#2563eb" 
                                            opacity={0.6}
                                            transparent
                                            x={selectedTilePos.x} 
                                            y={selectedTilePos.y}
                                        />
                                    </group>
                                </group>
                            );
                    }
                    return null;
                })()}

                {/* Cursor Highlight */}
                {hoveredTile && previewTiles.map((tile: any, idx) => {
                    // HIDE base cursor if we are erasing walls specifically OR selecting walls specifically
                    // UNLESS we are dragging a wall (in which case we might want a tile cursor to show where it lands?
                    // actually if dragging wall, we show ghost wall, maybe cursor is redundant or helpful. Let's hide cursor if hovering wall.
                    if ((activeTool === RoomType.None || activeTool === 'Select') && hoveredTile.subTarget && hoveredTile.subTarget.startsWith('wall') && !isDragging) {
                        return null;
                    }
                    
                    return (
                        <Cursor key={idx} x={tile.x} y={tile.y} color={isDragging ? (isDragValid ? '#3b82f6' : '#ef4444') : (isSelectMode ? '#3b82f6' : (activeTool === RoomType.None ? '#ef4444' : (isValidPlacement ? '#ffffff' : '#ef4444')))} />
                    );
                })}
            </group>
          )}
        </group>
      </Canvas>
      
      <div className="absolute bottom-6 right-6 flex gap-2 pointer-events-auto">
         <button onClick={() => rotateView(Math.PI / 4)} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-700 shadow-md hover:bg-slate-50 active:scale-95 transition-all">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
         </button>
         <button onClick={() => rotateView(-Math.PI / 4)} className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-700 shadow-md hover:bg-slate-50 active:scale-95 transition-all">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
         </button>
      </div>
    </div>
  );
};

export default IsoMap;
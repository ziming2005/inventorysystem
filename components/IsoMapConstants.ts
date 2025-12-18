
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import * as THREE from 'three';
import { GRID_SIZE, LARGE_ROOM_SIZE } from '../constants';
import { RoomType, ToolMode } from '../types';

// --- Constants & Helpers ---
export const TILE_SIZE = 4; // Scale factor for tiles
export const WORLD_OFFSET = (GRID_SIZE * TILE_SIZE) / 2 - (TILE_SIZE / 2);

export const gridToWorld = (x: number, y: number) => 
  [x * TILE_SIZE - WORLD_OFFSET, 0, y * TILE_SIZE - WORLD_OFFSET] as [number, number, number];

// Helper to check if a room type is a large module
export const isLargeRoomType = (type: ToolMode) => {
    return type === RoomType.WaitingRoom ||
           type === RoomType.OperatorySuite || 
           type === RoomType.ImagingSuite;
};

// Helper to check if a type is a structure (Wall/Door/Window)
export const isStructureType = (type: RoomType | ToolMode) => {
    return type === RoomType.StraightWall || 
           type === RoomType.Door || 
           type === RoomType.Window;
};

// Helper for rotation mapping
// Maps the physical variant position (0 to SIZE-1) back to the logical design position based on rotation
export const getEffectiveVariant = (vx: number, vy: number, rot: number) => {
    // If no rotation, mapping is 1:1
    if (rot === 0) return { col: vx, row: vy };
    
    // Convert to centered coordinates for easier rotation math
    const centerOffset = Math.floor(LARGE_ROOM_SIZE / 2);
    const cx = vx - centerOffset;
    const cy = vy - centerOffset;
    let nx = cx;
    let ny = cy;
    
    // Apply inverse rotation to find the source tile for this position
    // Rotations are Clockwise (CW). Inverse is Counter-Clockwise (CCW).
    
    if (rot === 1) { // 90 CW -> Inverse is 90 CCW
        // x' = y, y' = -x
        nx = cy;
        ny = -cx;
    } else if (rot === 2) { // 180 -> Inverse is 180
        // x' = -x, y' = -y
        nx = -cx;
        ny = -cy;
    } else if (rot === 3) { // 270 CW -> Inverse is 90 CW
            // x' = -y, y' = x
        nx = -cy;
        ny = cx;
    }
    
    // Convert back to 0-based range
    return { col: nx + centerOffset, row: ny + centerOffset };
};

// --- Shared Geometries ---
export const boxGeo = new THREE.BoxGeometry(1, 1, 1);
export const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 16);
export const sphereGeo = new THREE.SphereGeometry(1, 16, 16);


/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

export enum RoomType {
  None = 'None',
  WaitingRoom = 'WaitingRoom',
  OperatorySuite = 'OperatorySuite',
  ImagingSuite = 'ImagingSuite',
  StraightWall = 'StraightWall',
  Door = 'Door',
  Window = 'Window',
}

export type ToolMode = RoomType | 'Select';

export type WallTexture = 'Drywall' | 'Brick' | 'Wood' | 'Metal' | 'Glass';

export interface RoomConfig {
  type: RoomType;
  name: string;
  description: string;
  color: string; // UI Color
  floorColor: string; // 3D Floor Color
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  // New Extended Fields
  brand?: string;
  sku?: string;
  uom?: string;
  unitPrice?: number;
  vendor?: string;
  category?: string;
  description?: string;
  location?: string;
  tileX?: number;
  tileY?: number;
}

export interface PlacedWall {
    type: RoomType;
    rotation: number; // 0 (N), 1 (E), 2 (S), 3 (W)
    customColor?: string;
}

export interface TileData {
  x: number;
  y: number;
  roomType: RoomType;
  rotation: number; // 0, 1, 2, 3 (x90 degrees)
  label?: string;
  customColor?: string;
  variantX?: number; // 0-4 for large rooms
  variantY?: number; // 0-4 for large rooms
  hasInventory?: boolean;
  inventoryItems?: InventoryItem[];
  // Attached Structures (Walls/Doors/Windows on the edges)
  placedWalls?: PlacedWall[];
}

export type Grid = TileData[][];

export interface ClinicAnalysis {
  score: number;
  feedback: string;
  suggestions: string[];
}

// Global JSX elements for Three.js (react-three-fiber)
declare global {
  namespace JSX {
    interface IntrinsicElements {
      ambientLight: any;
      boxGeometry: any;
      cylinderGeometry: any;
      directionalLight: any;
      group: any;
      mesh: any;
      meshBasicMaterial: any;
      meshStandardMaterial: any;
      planeGeometry: any;
      ringGeometry: any;
      sphereGeometry: any;
      circleGeometry: any;
      primitive: any;
      pointLight: any;
      // HTML Elements
      div: any;
      span: any;
      p: any;
      button: any;
      input: any;
      label: any;
      select: any;
      option: any;
      h1: any;
      h2: any;
      hr: any;
      svg: any;
      path: any;
      rect: any;
      circle: any;
      textarea: any;
      table: any;
      thead: any;
      tbody: any;
      tr: any;
      th: any;
      td: any;
    }
  }
}

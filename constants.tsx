
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { RoomConfig, RoomType } from './types';

// Map Settings
export const GRID_SIZE = 15;
export const LARGE_ROOM_SIZE = 5;

export const ROOMS: Record<RoomType, RoomConfig> = {
  [RoomType.None]: {
    type: RoomType.None,
    name: 'Clear',
    description: 'Empty space',
    color: '#ef4444',
    floorColor: '#e5e7eb', // gray-200
  },
  [RoomType.WaitingRoom]: {
    type: RoomType.WaitingRoom,
    name: 'Waiting Room',
    description: `Patient waiting area (${LARGE_ROOM_SIZE}x${LARGE_ROOM_SIZE})`,
    color: '#fbbf24', // amber-400
    floorColor: '#f3f4f6', // slate-100 (Grey Tile)
  },
  [RoomType.OperatorySuite]: {
    type: RoomType.OperatorySuite,
    name: 'Operatory',
    description: `Treatment room (${LARGE_ROOM_SIZE}x${LARGE_ROOM_SIZE})`,
    color: '#0ea5e9', // sky-500
    floorColor: '#f8fafc', // slate-50 (White/Clean Tile)
  },
  [RoomType.ImagingSuite]: {
    type: RoomType.ImagingSuite,
    name: 'Imaging Suite',
    description: `${LARGE_ROOM_SIZE}x${LARGE_ROOM_SIZE} Imaging Center`,
    color: '#6366f1', // indigo-500
    floorColor: '#e0e7ff', // indigo-100
  },
  [RoomType.StraightWall]: {
    type: RoomType.StraightWall,
    name: 'Straight Wall',
    description: 'Partition wall',
    color: '#64748b', // slate-500
    floorColor: '#e5e7eb',
  },
  [RoomType.Door]: {
    type: RoomType.Door,
    name: 'Door',
    description: 'Entry door',
    color: '#b45309', // amber-700
    floorColor: '#e5e7eb',
  },
  [RoomType.Window]: {
    type: RoomType.Window,
    name: 'Window',
    description: 'Glass window',
    color: '#38bdf8', // sky-400
    floorColor: '#e5e7eb',
  },
};

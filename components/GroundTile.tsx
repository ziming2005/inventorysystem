/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { Outlines } from '@react-three/drei';
import * as THREE from 'three';
import { RoomType } from '../types';
import { TILE_SIZE, gridToWorld } from './IsoMapConstants';

interface GroundTileProps {
    type: RoomType;
    x: number;
    y: number;
    isSelected: boolean;
    onHover: (x: number, y: number) => void;
    onLeave: () => void;
    onPointerDown: (x: number, y: number) => void;
    onPointerUp: (x: number, y: number) => void;
    floorColor?: string;
}

const GroundTile = React.memo(({ type, x, y, isSelected, onHover, onLeave, onPointerDown, onPointerUp, floorColor = '#e5e7eb' }: GroundTileProps) => {
  const [wx, _, wz] = gridToWorld(x, y);
  const thickness = 0.2;
  const centerY = -0.1 - thickness/2;

  return (
    <mesh 
        position={[wx, centerY, wz]} 
        receiveShadow 
        onPointerEnter={(e) => { e.stopPropagation(); onHover(x, y); }}
        onPointerOut={(e) => { e.stopPropagation(); onLeave(); }}
        onPointerDown={(e) => { if (e.button === 0) { e.stopPropagation(); onPointerDown(x, y); }}}
        onPointerUp={(e) => { if (e.button === 0) { e.stopPropagation(); onPointerUp(x, y); }}}
    >
      <boxGeometry args={[TILE_SIZE, thickness, TILE_SIZE]} />
      <meshStandardMaterial color={floorColor} />
      <Outlines thickness={isSelected ? 0.05 : 0.02} color={isSelected ? "#2563eb" : "#94a3b8"} />
    </mesh>
  );
});

export const Cursor = ({ x, y, color }: { x: number, y: number, color: string, key?: any }) => {
    const [wx, _, wz] = gridToWorld(x, y);
    return (
      <mesh position={[wx, 0.05, wz]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <planeGeometry args={[TILE_SIZE, TILE_SIZE]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} depthTest={false} />
        <Outlines thickness={0.05} color="white" />
      </mesh>
    );
};

export default GroundTile;
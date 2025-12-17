
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import * as THREE from 'three';
import { RoomType, WallTexture } from '../types';
import { boxGeo, cylinderGeo, sphereGeo, getEffectiveVariant } from './IsoMapConstants';

interface RoomFurnitureProps {
    type: RoomType;
    customColor?: string;
    texture?: WallTexture;
    opacity?: number;
    transparent?: boolean;
    x: number;
    y: number;
    variantX?: number;
    variantY?: number;
    rotation?: number;
}

const RoomFurniture = React.memo(({ type, customColor, texture, opacity = 1, transparent = false, x, y, variantX, variantY, rotation = 0 }: RoomFurnitureProps) => {
  const commonMatProps = { transparent, opacity, flatShading: true };
  const furnitureColor = "#f3f4f6"; // White furniture base
  const furnitureMat = new THREE.MeshStandardMaterial({ color: furnitureColor, ...commonMatProps });
  const accentMat = new THREE.MeshStandardMaterial({ color: "#9ca3af", ...commonMatProps });
  const darkMat = new THREE.MeshStandardMaterial({ color: "#374151", ...commonMatProps });
  const woodMat = new THREE.MeshStandardMaterial({ color: "#d4a373", ...commonMatProps, roughness: 0.8 }); // Wood material
  
  // Trim Material (Frames)
  const trimColor = "#f8fafc"; // Slate-50
  const trimMat = new THREE.MeshStandardMaterial({ color: trimColor, ...commonMatProps });

  // Helper to get material with custom color fallback
  const getColoredMat = (defaultColor: string) => {
    return new THREE.MeshStandardMaterial({ color: customColor || defaultColor, ...commonMatProps });
  };

  // Helper to get Textured Wall Material
  const getWallMaterial = (defaultColor: string) => {
      const tex = texture || 'Drywall';
      const color = customColor || (tex === 'Brick' ? '#b91c1c' : (tex === 'Wood' ? '#d4a373' : (tex === 'Metal' ? '#94a3b8' : defaultColor)));
      
      const props: any = { ...commonMatProps, color };

      switch(tex) {
          case 'Glass':
              props.opacity = Math.min(opacity, 0.4);
              props.transparent = true;
              props.roughness = 0;
              props.metalness = 0.9;
              if (!customColor) props.color = "#a5f3fc"; // Cyan tint default
              break;
          case 'Metal':
              props.roughness = 0.2;
              props.metalness = 0.8;
              break;
          case 'Wood':
              props.roughness = 0.8;
              props.metalness = 0;
              break;
          case 'Brick':
              props.roughness = 0.9;
              props.metalness = 0;
              break;
          case 'Drywall':
          default:
              props.roughness = 0.5;
              props.metalness = 0;
              break;
      }
      return new THREE.MeshStandardMaterial(props);
  };
  
  // EDGE OFFSET: Move walls to the exact edge (North/-Z) to align with grid boundary
  const edgeOffset = -0.5;

  switch (type) {
    case RoomType.WaitingRoom: {
      // MODERN 5x5 WAITING AREA
      const wx = variantX !== undefined ? variantX : x % 5;
      const wy = variantY !== undefined ? variantY : y % 5;

      const adjustedW = getEffectiveVariant(wx, wy, rotation);
      const col = adjustedW.col;
      const row = adjustedW.row;

      // Materials
      const seatFabricMat = new THREE.MeshStandardMaterial({ color: customColor || "#64748b", ...commonMatProps }); // Slate-500
      const rugMat = new THREE.MeshStandardMaterial({ color: "#e2e8f0", ...commonMatProps });
      const plantGreenMat = new THREE.MeshStandardMaterial({ color: "#22c55e", ...commonMatProps });
      const potMat = new THREE.MeshStandardMaterial({ color: "#ffffff", ...commonMatProps });

      // -- Sub-Components --

      const Armchair = ({ rotation }: { rotation: number }) => (
          <group rotation={[0, rotation, 0]}>
              {/* Legs */}
              <mesh geometry={boxGeo} material={woodMat} position={[-0.3, 0.1, -0.3]} scale={[0.08, 0.2, 0.08]} />
              <mesh geometry={boxGeo} material={woodMat} position={[0.3, 0.1, -0.3]} scale={[0.08, 0.2, 0.08]} />
              <mesh geometry={boxGeo} material={woodMat} position={[-0.3, 0.1, 0.3]} scale={[0.08, 0.2, 0.08]} />
              <mesh geometry={boxGeo} material={woodMat} position={[0.3, 0.1, 0.3]} scale={[0.08, 0.2, 0.08]} />
              {/* Seat */}
              <mesh geometry={boxGeo} material={seatFabricMat} position={[0, 0.35, 0]} scale={[0.8, 0.3, 0.8]} />
              {/* Back */}
              <mesh geometry={boxGeo} material={seatFabricMat} position={[0, 0.65, -0.3]} scale={[0.8, 0.6, 0.2]} />
              {/* Arms */}
              <mesh geometry={boxGeo} material={seatFabricMat} position={[-0.35, 0.5, 0]} scale={[0.1, 0.4, 0.8]} />
              <mesh geometry={boxGeo} material={seatFabricMat} position={[0.35, 0.5, 0]} scale={[0.1, 0.4, 0.8]} />
          </group>
      );

      // --- LAYOUT LOGIC ---

      // 1. Water Dispenser (Top Left Corner)
      if (col === 0 && row === 0) {
          return (
              <group position={[-0.2, 0, -0.2]}>
                  <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color:"#f8fafc", ...commonMatProps})} position={[0, 0.6, 0]} scale={[0.4, 1.2, 0.4]} />
                  <mesh geometry={cylinderGeo} material={new THREE.MeshStandardMaterial({color:"#3b82f6", transparent:true, opacity:0.6})} position={[0, 1.3, 0]} scale={[0.15, 0.4, 0.15]} />
                  <mesh geometry={boxGeo} material={darkMat} position={[0, 0.8, 0.21]} scale={[0.3, 0.05, 0.05]} />
                  <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color:"#ef4444"})} position={[0.08, 0.85, 0.21]} scale={[0.03, 0.03, 0.05]} />
                  <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color:"#3b82f6"})} position={[-0.08, 0.85, 0.21]} scale={[0.03, 0.03, 0.05]} />
              </group>
          );
      }

      // 2. Info Screen (Left Wall / Row 2)
      if (col === 0 && row === 2) {
          return (
              <group position={[-0.45, 1.4, 0]} rotation={[0, Math.PI/2, 0]}>
                  <mesh geometry={boxGeo} material={darkMat} scale={[1.4, 0.8, 0.05]} />
                  <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#0f172a", roughness: 0.2, ...commonMatProps})} position={[0, 0, 0.03]} scale={[1.3, 0.7, 0.01]} />
                  {/* Interface Graphics */}
                  <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#38bdf8", emissive:"#0ea5e9", emissiveIntensity:0.2})} position={[-0.3, 0.1, 0.04]} scale={[0.4, 0.3, 0.01]} />
                  <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#64748b"})} position={[0.3, 0.2, 0.04]} scale={[0.5, 0.05, 0.01]} />
                  <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#64748b"})} position={[0.3, 0.05, 0.04]} scale={[0.5, 0.05, 0.01]} />
                  <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#64748b"})} position={[0.3, -0.1, 0.04]} scale={[0.5, 0.05, 0.01]} />
              </group>
          );
      }

      // 3. Central Seating Zone (Shifted to Rows 0-2 for "Against Wall" look)
      if (col >= 1 && col <= 3 && row >= 0 && row <= 2) {
          return (
              <group>
                  {/* Rug Segment */}
                  <mesh geometry={boxGeo} material={rugMat} position={[0, 0.02, 0]} scale={[1, 0.04, 1]} />
                  
                  {/* Row 0: Sofa Facing South (Against Wall) */}
                  {row === 0 && (
                       <group>
                           {/* Base */}
                           <mesh geometry={boxGeo} material={darkMat} position={[0, 0.1, 0]} scale={[0.95, 0.1, 0.6]} />
                           {/* Cushion - Shifted back slightly */}
                           <mesh geometry={boxGeo} material={seatFabricMat} position={[0, 0.35, 0]} scale={[0.95, 0.4, 0.6]} />
                           {/* Backrest - Shifted to edge (-0.4) to be against wall */}
                           <mesh geometry={boxGeo} material={seatFabricMat} position={[0, 0.65, -0.4]} scale={[0.95, 0.6, 0.2]} />
                           {/* Arms for ends */}
                           {col === 1 && <mesh geometry={boxGeo} material={seatFabricMat} position={[-0.4, 0.5, 0]} scale={[0.15, 0.4, 0.6]} />}
                           {col === 3 && <mesh geometry={boxGeo} material={seatFabricMat} position={[0.4, 0.5, 0]} scale={[0.15, 0.4, 0.6]} />}
                       </group>
                  )}

                  {/* Row 1: Coffee Table */}
                  {row === 1 && col === 2 && (
                       <group>
                           <mesh geometry={boxGeo} material={woodMat} position={[0, 0.25, 0]} scale={[0.8, 0.05, 0.8]} />
                           <mesh geometry={boxGeo} material={darkMat} position={[-0.35, 0.12, -0.35]} scale={[0.05, 0.24, 0.05]} />
                           <mesh geometry={boxGeo} material={darkMat} position={[0.35, 0.12, -0.35]} scale={[0.05, 0.24, 0.05]} />
                           <mesh geometry={boxGeo} material={darkMat} position={[-0.35, 0.12, 0.35]} scale={[0.05, 0.24, 0.05]} />
                           <mesh geometry={boxGeo} material={darkMat} position={[0.35, 0.12, 0.35]} scale={[0.05, 0.24, 0.05]} />
                           {/* Magazine */}
                           <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color:"#ffffff"})} position={[0.1, 0.28, 0.1]} rotation={[0,0.2,0]} scale={[0.2, 0.02, 0.25]} />
                       </group>
                  )}

                  {/* Row 2: Armchairs Facing North */}
                  {row === 2 && (col === 1 || col === 3) && (
                      <Armchair rotation={Math.PI} />
                  )}
              </group>
          );
      }

      // 4. Kids Playground (3x2 Zone: Cols 2-4, Rows 3-4)
      const isKidsZone = (col >= 2 && row >= 3); 
      if (isKidsZone) {
          // Checkerboard Mat Logic
          // Tile Colors: Alternating soft Red and Blue puzzle mats
          const isCheckered = (col + row) % 2 === 0;
          const matColor = isCheckered ? "#fca5a5" : "#93c5fd"; 
          const matMat = new THREE.MeshStandardMaterial({ color: matColor, ...commonMatProps, roughness: 0.8 });
          
          return (
              <group>
                  {/* Zone Mat */}
                  <mesh geometry={boxGeo} material={matMat} position={[0, 0.02, 0]} scale={[1, 0.04, 1]} />
                  
                  {/* (2,3) & (2,4): Enhanced Slide */}
                  {col === 2 && row === 3 && (
                      // Slide Top / Platform
                      <group>
                          {/* Platform */}
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#fbbf24", ...commonMatProps})} position={[0, 0.6, 0]} scale={[0.8, 0.05, 0.8]} />
                          {/* Legs (Changed to Box for cleaner block look and removed top arch cylinders) */}
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#ef4444", ...commonMatProps})} position={[-0.35, 0.3, -0.35]} scale={[0.05, 0.6, 0.05]} />
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#ef4444", ...commonMatProps})} position={[0.35, 0.3, -0.35]} scale={[0.05, 0.6, 0.05]} />
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#ef4444", ...commonMatProps})} position={[-0.35, 0.3, 0.35]} scale={[0.05, 0.6, 0.05]} />
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#ef4444", ...commonMatProps})} position={[0.35, 0.3, 0.35]} scale={[0.05, 0.6, 0.05]} />
                          
                          {/* Ladder (Back / North Side) */}
                          <group position={[0, 0.3, -0.42]} rotation={[0.2, 0, 0]}>
                              <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#9ca3af", ...commonMatProps})} position={[-0.2, 0, 0]} scale={[0.05, 0.7, 0.05]} />
                              <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#9ca3af", ...commonMatProps})} position={[0.2, 0, 0]} scale={[0.05, 0.7, 0.05]} />
                              {/* Rungs */}
                              <mesh geometry={cylinderGeo} material={new THREE.MeshStandardMaterial({color: "#6b7280", ...commonMatProps})} position={[0, -0.2, 0]} rotation={[0,0,1.57]} scale={[0.03, 0.4, 0.03]} />
                              <mesh geometry={cylinderGeo} material={new THREE.MeshStandardMaterial({color: "#6b7280", ...commonMatProps})} position={[0, 0, 0]} rotation={[0,0,1.57]} scale={[0.03, 0.4, 0.03]} />
                              <mesh geometry={cylinderGeo} material={new THREE.MeshStandardMaterial({color: "#6b7280", ...commonMatProps})} position={[0, 0.2, 0]} rotation={[0,0,1.57]} scale={[0.03, 0.4, 0.03]} />
                          </group>

                          {/* Safety Railing Posts (Corners) - Replaces Solid Panels */}
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#ef4444", ...commonMatProps})} position={[-0.35, 0.85, -0.35]} scale={[0.05, 0.5, 0.05]} />
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#ef4444", ...commonMatProps})} position={[0.35, 0.85, -0.35]} scale={[0.05, 0.5, 0.05]} />
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#ef4444", ...commonMatProps})} position={[-0.35, 0.85, 0.35]} scale={[0.05, 0.5, 0.05]} />
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#ef4444", ...commonMatProps})} position={[0.35, 0.85, 0.35]} scale={[0.05, 0.5, 0.05]} />

                          {/* Horizontal Rails (Sides) */}
                          {/* Left Side Rails */}
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#ef4444", ...commonMatProps})} position={[-0.35, 1.05, 0]} scale={[0.05, 0.05, 0.7]} />
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#ef4444", ...commonMatProps})} position={[-0.35, 0.85, 0]} scale={[0.05, 0.05, 0.7]} />
                          
                          {/* Right Side Rails */}
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#ef4444", ...commonMatProps})} position={[0.35, 1.05, 0]} scale={[0.05, 0.05, 0.7]} />
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#ef4444", ...commonMatProps})} position={[0.35, 0.85, 0]} scale={[0.05, 0.05, 0.7]} />
                      </group>
                  )}
                  {col === 2 && row === 4 && (
                      // Slide Ramp (Bottom)
                      <group position={[0, 0, -0.5]}>
                          {/* Ramp connecting from (2,3) */}
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#f59e0b", ...commonMatProps})} position={[0, 0.3, 0.1]} rotation={[0.45, 0, 0]} scale={[0.6, 0.05, 1.3]} />
                          {/* Side guards for ramp */}
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#ef4444", ...commonMatProps})} position={[-0.32, 0.35, 0.1]} rotation={[0.45, 0, 0]} scale={[0.05, 0.15, 1.3]} />
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#ef4444", ...commonMatProps})} position={[0.32, 0.35, 0.1]} rotation={[0.45, 0, 0]} scale={[0.05, 0.15, 1.3]} />
                      </group>
                  )}

                  {/* (3,3): Random Blocks Group 1 */}
                  {col === 3 && row === 3 && (
                      <group>
                           <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#a855f7", ...commonMatProps})} position={[0.2, 0.12, 0.2]} rotation={[0, 0.3, 0]} scale={[0.25, 0.25, 0.25]} />
                           <mesh geometry={cylinderGeo} material={new THREE.MeshStandardMaterial({color: "#facc15", ...commonMatProps})} position={[-0.2, 0.1, -0.1]} scale={[0.2, 0.2, 0.2]} />
                      </group>
                  )}

                  {/* (3,4): Random Blocks Group 2 */}
                  {col === 3 && row === 4 && (
                      <group>
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#ef4444", ...commonMatProps})} position={[-0.2, 0.1, -0.2]} rotation={[0, 0.2, 0]} scale={[0.2, 0.2, 0.2]} />
                          <mesh geometry={cylinderGeo} material={new THREE.MeshStandardMaterial({color: "#3b82f6", ...commonMatProps})} position={[0.2, 0.1, 0.1]} rotation={[0, 0, 1.57]} scale={[0.15, 0.3, 0.15]} />
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#fbbf24", ...commonMatProps})} position={[0, 0.15, 0.3]} rotation={[0, 0.5, 0]} scale={[0.25, 0.25, 0.25]} />
                      </group>
                  )}

                  {/* (4,4): Stacked Tower (Keep existing) */}
                  {col === 4 && row === 4 && (() => {
                      const blockSize = 0.25;
                      const blockGeo = boxGeo;
                      return (
                          <group position={[0, 0, 0]}>
                                  {/* Bottom: Teal */}
                                  <mesh geometry={blockGeo} material={new THREE.MeshStandardMaterial({color: "#06b6d4", ...commonMatProps})} position={[0, blockSize/2, 0]} rotation={[0, 0.1, 0]} scale={[blockSize, blockSize, blockSize]} />
                                  {/* 2: Purple */}
                                  <mesh geometry={blockGeo} material={new THREE.MeshStandardMaterial({color: "#a855f7", ...commonMatProps})} position={[0, blockSize*1.5, 0]} rotation={[0, -0.2, 0]} scale={[blockSize, blockSize, blockSize]} />
                                  {/* 3: Orange */}
                                  <mesh geometry={blockGeo} material={new THREE.MeshStandardMaterial({color: "#f97316", ...commonMatProps})} position={[0, blockSize*2.5, 0]} rotation={[0, 0.15, 0]} scale={[blockSize, blockSize, blockSize]} />
                                  {/* 4: Blue */}
                                  <mesh geometry={blockGeo} material={new THREE.MeshStandardMaterial({color: "#3b82f6", ...commonMatProps})} position={[0, blockSize*3.5, 0]} rotation={[0, -0.05, 0]} scale={[blockSize, blockSize, blockSize]} />
                                  {/* Top: Red */}
                                  <mesh geometry={blockGeo} material={new THREE.MeshStandardMaterial({color: "#ef4444", ...commonMatProps})} position={[0, blockSize*4.5, 0]} rotation={[0, 0.3, 0]} scale={[blockSize, blockSize, blockSize]} />
                          </group>
                      );
                  })()}

                  {/* (4,3): Storage Rack */}
                  {col === 4 && row === 3 && (
                      <group rotation={[0, -Math.PI/2, 0]}>
                          {/* Rack Frame - Vertical Posts (Birch Wood) */}
                          <mesh geometry={boxGeo} material={woodMat} position={[-0.42, 0.45, -0.2]} scale={[0.05, 0.9, 0.05]} />
                          <mesh geometry={boxGeo} material={woodMat} position={[0.42, 0.45, -0.2]} scale={[0.05, 0.9, 0.05]} />
                          <mesh geometry={boxGeo} material={woodMat} position={[-0.42, 0.45, -0.45]} scale={[0.05, 0.9, 0.05]} />
                          <mesh geometry={boxGeo} material={woodMat} position={[0.42, 0.45, -0.45]} scale={[0.05, 0.9, 0.05]} />

                          {/* Shelves */}
                          <mesh geometry={boxGeo} material={woodMat} position={[0, 0.15, -0.325]} scale={[0.9, 0.04, 0.28]} />
                          <mesh geometry={boxGeo} material={woodMat} position={[0, 0.45, -0.325]} scale={[0.9, 0.04, 0.28]} />
                          <mesh geometry={boxGeo} material={woodMat} position={[0, 0.75, -0.325]} scale={[0.9, 0.04, 0.28]} />

                          {/* Bins on Shelves */}
                          {/* Bottom Shelf */}
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#ef4444", ...commonMatProps})} position={[-0.25, 0.26, -0.325]} scale={[0.25, 0.18, 0.25]} />
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#3b82f6", ...commonMatProps})} position={[0.25, 0.26, -0.325]} scale={[0.25, 0.18, 0.25]} />
                          
                          {/* Middle Shelf */}
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#22c55e", ...commonMatProps})} position={[-0.25, 0.56, -0.325]} scale={[0.25, 0.18, 0.25]} />
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#a855f7", ...commonMatProps})} position={[0.25, 0.56, -0.325]} scale={[0.25, 0.18, 0.25]} />

                          {/* Top Shelf */}
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#f97316", ...commonMatProps})} position={[-0.25, 0.86, -0.325]} scale={[0.25, 0.18, 0.25]} />
                          <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#06b6d4", ...commonMatProps})} position={[0.25, 0.86, -0.325]} scale={[0.25, 0.18, 0.25]} />
                      </group>
                  )}
              </group>
          );
      }
      
      // 5. Decor / Plants (Top Right)
      if (col === 4 && row === 0) {
           return (
               <group>
                   <mesh geometry={cylinderGeo} material={potMat} position={[0, 0.25, 0]} scale={[0.25, 0.5, 0.25]} />
                   <mesh geometry={sphereGeo} material={plantGreenMat} position={[0, 0.6, 0]} scale={[0.3, 0.4, 0.3]} />
                   <mesh geometry={sphereGeo} material={plantGreenMat} position={[0.1, 0.7, 0]} scale={[0.2, 0.3, 0.2]} />
                   <mesh geometry={sphereGeo} material={plantGreenMat} position={[-0.1, 0.65, 0.1]} scale={[0.25, 0.35, 0.25]} />
               </group>
           );
      }
      
      // 6. South-West Decor (Floor Lamp & Side Table)
      if (col === 0 && row === 4) {
           return (
               <group>
                   {/* Modern Floor Lamp - Scaled Down */}
                   <mesh geometry={cylinderGeo} material={darkMat} position={[-0.1, 0.03, -0.1]} scale={[0.2, 0.06, 0.2]} />
                   <mesh geometry={cylinderGeo} material={new THREE.MeshStandardMaterial({color: "#475569", ...commonMatProps})} position={[-0.1, 0.7, -0.1]} scale={[0.03, 1.3, 0.03]} />
                   <mesh geometry={cylinderGeo} material={new THREE.MeshStandardMaterial({color: "#fef9c3", emissive: "#fef08a", emissiveIntensity: 0.5, ...commonMatProps})} position={[-0.1, 1.35, -0.1]} scale={[0.28, 0.25, 0.28]} />
                   
                   {/* Side Table with Magazine */}
                   <mesh geometry={cylinderGeo} material={woodMat} position={[0.3, 0.25, 0.2]} scale={[0.05, 0.5, 0.05]} />
                   <mesh geometry={cylinderGeo} material={woodMat} position={[0.3, 0.02, 0.2]} scale={[0.25, 0.04, 0.25]} /> {/* Base */}
                   <mesh geometry={cylinderGeo} material={woodMat} position={[0.3, 0.5, 0.2]} scale={[0.3, 0.04, 0.3]} /> {/* Top */}
                   {/* Stack of Magazines */}
                   <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({color: "#ffffff", ...commonMatProps})} position={[0.3, 0.54, 0.2]} rotation={[0,0.5,0]} scale={[0.15, 0.04, 0.2]} />
               </group>
           );
      }

      return null;
    }

    case RoomType.ImagingSuite: {
       const ix = variantX !== undefined ? variantX : x % 5;
       const iy = variantY !== undefined ? variantY : y % 5;
       const adjusted = getEffectiveVariant(ix, iy, rotation);
       const col = adjusted.col;
       const row = adjusted.row;

       const machineColor = customColor || "#ffffff"; // White machine
       const machineMat = new THREE.MeshStandardMaterial({ color: machineColor, ...commonMatProps });
       const accentMat = new THREE.MeshStandardMaterial({ color: "#6366f1", ...commonMatProps }); // Indigo accent
       const darkMat = new THREE.MeshStandardMaterial({ color: "#1e293b", ...commonMatProps });

       // Center (2,2): The CBCT Machine
       if (col === 2 && row === 2) {
           return (
               <group>
                   <mesh geometry={cylinderGeo} material={machineMat} position={[0, 0.05, 0]} scale={[0.4, 0.1, 0.4]} />
                   <mesh geometry={boxGeo} material={machineMat} position={[0, 1.0, -0.3]} scale={[0.3, 2.0, 0.3]} />
                   {/* Arm */}
                   <group position={[0, 1.5, 0]}>
                       <mesh geometry={boxGeo} material={machineMat} position={[0, 0.4, 0.1]} scale={[0.3, 0.15, 1.0]} />
                       {/* C-Arm */}
                       <group position={[0, 0.3, 0.5]} rotation={[0, 0, 0.2]}>
                           <mesh geometry={boxGeo} material={accentMat} position={[0, 0, 0]} scale={[0.7, 0.1, 0.7]} />
                           <mesh geometry={boxGeo} material={accentMat} position={[0, -0.5, 0.3]} scale={[0.7, 1.0, 0.1]} />
                           <mesh geometry={boxGeo} material={accentMat} position={[0, -0.5, -0.3]} scale={[0.7, 1.0, 0.1]} />
                           <mesh geometry={boxGeo} material={darkMat} position={[0, -0.9, 0.3]} scale={[0.5, 0.2, 0.2]} />
                           <mesh geometry={cylinderGeo} material={darkMat} position={[0, -0.9, -0.3]} rotation={[1.57, 0, 0]} scale={[0.15, 0.2, 0.15]} />
                       </group>
                   </group>
               </group>
           );
       }

       // (4,2): Control Desk
       if (col === 4 && row === 2) {
           return (
               <group>
                   <mesh geometry={boxGeo} material={machineMat} position={[0, 0.4, 0]} scale={[0.8, 0.8, 0.8]} />
                   <mesh geometry={boxGeo} material={darkMat} position={[-0.2, 0.9, 0]} rotation={[0, -1.57, 0]} scale={[0.5, 0.3, 0.05]} />
                   <mesh geometry={boxGeo} material={darkMat} position={[0.2, 0.85, 0]} scale={[0.3, 0.02, 0.2]} />
               </group>
           );
       }

       // Row 0: Back Wall Shielding
       if (row === 0) {
            return (
                <mesh geometry={boxGeo} material={darkMat} position={[0, 0.5, -0.4]} scale={[1, 1, 0.2]} />
            );
       }

       return null;
    }

    case RoomType.StraightWall:
        // MODULAR PARTITION WALL - Seamless (No Posts, No Skirting)
        const wallMat = getWallMaterial("#94a3b8"); // Default Slate-400
        
        return (
            <group position={[0, 0, edgeOffset]}>
                {/* Main Wall Surface - Full Width */}
                <mesh geometry={boxGeo} material={wallMat} position={[0, 0.8, 0]} scale={[1.0, 1.6, 0.1]} />
            </group>
        );

    case RoomType.Door:
        // Seamless Door Wall
        const frameMat = getWallMaterial("#f1f5f9"); 
        const doorPanelColor = customColor || "#b45309";
        const doorPanelMat = new THREE.MeshStandardMaterial({ color: doorPanelColor, ...commonMatProps });
        const doorPostMat = new THREE.MeshStandardMaterial({ color: "#94a3b8", ...commonMatProps });

        return (
            <group position={[0, 0, edgeOffset]}>
                {/* Header Wall above door - Full Width */}
                <mesh geometry={boxGeo} material={frameMat} position={[0, 1.4, 0]} scale={[1.0, 0.4, 0.1]} />
                
                {/* Side Wall Fillers */}
                <mesh geometry={boxGeo} material={frameMat} position={[-0.4375, 0.6, 0]} scale={[0.125, 1.2, 0.1]} />
                <mesh geometry={boxGeo} material={frameMat} position={[0.4375, 0.6, 0]} scale={[0.125, 1.2, 0.1]} />

                {/* Door Frame/Jamb */}
                <group position={[0, 0.6, 0]}>
                     {/* Left Jamb/Casing */}
                     <mesh geometry={boxGeo} material={trimMat} position={[-0.35, 0, 0]} scale={[0.05, 1.2, 0.15]} />
                     {/* Right Jamb/Casing */}
                     <mesh geometry={boxGeo} material={trimMat} position={[0.35, 0, 0]} scale={[0.05, 1.2, 0.15]} />
                     {/* Top Jamb */}
                     <mesh geometry={boxGeo} material={trimMat} position={[0, 0.625, 0]} scale={[0.75, 0.05, 0.15]} />
                </group>
                
                {/* Door Leaf (Open 45 degrees) */}
                <group position={[-0.32, 0, 0]} rotation={[0, 0.6, 0]}>
                    <mesh geometry={boxGeo} material={doorPanelMat} position={[0.32, 0.6, 0]} scale={[0.64, 1.2, 0.05]} />
                    {/* Handle Lever */}
                    <group position={[0.55, 0.6, 0.04]}>
                        <mesh geometry={cylinderGeo} material={new THREE.MeshStandardMaterial({ color: "#eab308" })} rotation={[1.57, 0, 0]} scale={[0.02, 0.04, 0.02]} /> 
                        <mesh geometry={boxGeo} material={new THREE.MeshStandardMaterial({ color: "#eab308" })} position={[0.08, 0, 0.02]} scale={[0.12, 0.02, 0.02]} /> 
                    </group>
                </group>
            </group>
        );

    case RoomType.Window: {
        const winWallMat = getWallMaterial("#cbd5e1");
        const glassColor = "#38bdf8"; 
        const glassMat = new THREE.MeshStandardMaterial({ color: glassColor, ...commonMatProps, transparent: true, opacity: 0.4 });

        return (
            <group position={[0, 0, edgeOffset]}>
                {/* Lower Wall (Apron) - Full Width */}
                <mesh geometry={boxGeo} material={winWallMat} position={[0, 0.4, 0]} scale={[1.0, 0.8, 0.1]} />

                {/* Upper Wall (Header) - Full Width */}
                <mesh geometry={boxGeo} material={winWallMat} position={[0, 1.4, 0]} scale={[1.0, 0.4, 0.1]} />
                
                {/* Side Wall Fillers */}
                <mesh geometry={boxGeo} material={winWallMat} position={[-0.4625, 1.0, 0]} scale={[0.075, 0.4, 0.1]} />
                <mesh geometry={boxGeo} material={winWallMat} position={[0.4625, 1.0, 0]} scale={[0.075, 0.4, 0.1]} />

                {/* Window Frame & Glass */}
                <group position={[0, 1.05, 0]}>
                    {/* Glass Pane */}
                    <mesh geometry={boxGeo} material={glassMat} scale={[0.85, 0.45, 0.02]} />
                    
                    {/* Vertical Mullion */}
                    <mesh geometry={boxGeo} material={trimMat} scale={[0.03, 0.45, 0.04]} />
                    {/* Horizontal Mullion */}
                    <mesh geometry={boxGeo} material={trimMat} scale={[0.85, 0.03, 0.04]} />
                    
                    {/* Inner Frame */}
                    <mesh geometry={boxGeo} material={trimMat} position={[-0.41, 0, 0]} scale={[0.03, 0.45, 0.06]} />
                    <mesh geometry={boxGeo} material={trimMat} position={[0.41, 0, 0]} scale={[0.03, 0.45, 0.06]} />
                    <mesh geometry={boxGeo} material={trimMat} position={[0, 0.21, 0]} scale={[0.85, 0.03, 0.06]} />
                    <mesh geometry={boxGeo} material={trimMat} position={[0, -0.21, 0]} scale={[0.85, 0.03, 0.06]} />
                </group>
            </group>
        );
    }
    default:
      return null;
  }
});

export default RoomFurniture;

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Billboard, Text } from '@react-three/drei';
import * as THREE from 'three';
import { PlacedWall, RoomType } from '../types';
import RoomFurniture from './RoomFurniture';

interface ProceduralRoomProps {
    type: RoomType;
    floorColor: string;
    furnitureColor?: string;
    rotation: number;
    label?: string;
    opacity?: number;
    transparent?: boolean;
    x: number;
    y: number;
    variantX?: number;
    variantY?: number;
    hasInventory?: boolean;
    onInventoryClick?: (x: number, y: number) => void;
    // Attached Walls
    placedWalls?: PlacedWall[];
    // Interaction
    onPointerDown?: (e: any, subTarget: string) => void;
    onPointerUp?: (e: any, subTarget: string) => void;
    onPointerEnter?: (e: any, subTarget: string) => void;
    onPointerLeave?: (e: any) => void;
  }
  
const ProceduralRoom = React.memo(({ 
    type, floorColor, furnitureColor, rotation, label, opacity = 1, transparent = false, 
    x, y, variantX, variantY, hasInventory, onInventoryClick, placedWalls = [],
    onPointerDown, onPointerUp, onPointerEnter, onPointerLeave
}: ProceduralRoomProps) => {
    // Shadows removed as requested
    const commonProps = { castShadow: false, receiveShadow: false };
    const material = useMemo(() => new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.5, opacity, transparent }), [floorColor, opacity, transparent]);
    const rotationRad = -rotation * (Math.PI / 2);
    const floorHeight = 0.2;
    
    // Logic to prevent label duplication on large rooms (5x5)
    // Only show label if it's a single tile (no variant) or the center tile (2,2) of a large room
    const showLabel = label && (
        (variantX === undefined && variantY === undefined) || 
        (variantX === 2 && variantY === 2)
    );
  
    const showInventory = hasInventory && (
        (variantX === undefined && variantY === undefined) || 
        (variantX === 2 && variantY === 2)
    );
  
      const [inventoryHover, setInventoryHover] = useState(false);
      const invGroupRef = useRef<THREE.Group>(null);
      const targetScale = useRef(new THREE.Vector3(1, 1, 1));
  
      useFrame(() => {
      const g = invGroupRef.current;
      if (!g) return;
  
      const s = inventoryHover ? 1.15 : 1;
      targetScale.current.set(s, s, s);
      g.scale.lerp(targetScale.current, 0.15);
      });

    // Determine if the main room type is a Structure or Empty
    // If RoomType is None, we don't render floor.
    const hasFloor = type !== RoomType.None && 
                     type !== RoomType.StraightWall && 
                     type !== RoomType.Door && 
                     type !== RoomType.Window;
    
    return (
      <group>
          {hasFloor && (
            // Scale set to 1 to ensure full coverage and connection to adjacent tiles
            <mesh 
                {...commonProps} 
                material={material} 
                position={[0, 0, 0]} 
                scale={[1, floorHeight, 1]}
                onPointerDown={(e) => onPointerDown && onPointerDown(e, 'floor')}
                onPointerUp={(e) => onPointerUp && onPointerUp(e, 'floor')}
                onPointerEnter={(e) => onPointerEnter && onPointerEnter(e, 'floor')}
                onPointerLeave={onPointerLeave}
            >
                <boxGeometry args={[1, 1, 1]} />
            </mesh>
          )}
          
          {/* Main Room Furniture (if not None) */}
          {type !== RoomType.None && (
            <group 
                rotation={[0, rotationRad, 0]}
                onPointerDown={(e) => onPointerDown && onPointerDown(e, 'room')}
                onPointerUp={(e) => onPointerUp && onPointerUp(e, 'room')}
                onPointerEnter={(e) => onPointerEnter && onPointerEnter(e, 'room')}
                onPointerLeave={onPointerLeave}
            >
                <RoomFurniture 
                    type={type} 
                    customColor={furnitureColor} 
                    opacity={opacity} 
                    transparent={transparent} 
                    x={x} 
                    y={y} 
                    variantX={variantX} 
                    variantY={variantY} 
                    rotation={rotation}
                />
            </group>
          )}

          {/* Attached Walls */}
          {placedWalls.map((wall, idx) => {
              const wallRotRad = -wall.rotation * (Math.PI / 2);
              // Construct a unique subTarget ID for this wall instance
              const wallId = `wall:${idx}`;
              return (
                <group 
                    key={`wall-${idx}`} 
                    rotation={[0, wallRotRad, 0]}
                    onPointerDown={(e) => onPointerDown && onPointerDown(e, wallId)}
                    onPointerUp={(e) => onPointerUp && onPointerUp(e, wallId)}
                    onPointerEnter={(e) => onPointerEnter && onPointerEnter(e, wallId)}
                    onPointerLeave={onPointerLeave}
                >
                    <RoomFurniture 
                        type={wall.type}
                        customColor={wall.customColor}
                        opacity={opacity}
                        transparent={transparent}
                        x={x} y={y}
                        rotation={0} 
                    />
                </group>
              );
          })}

          {showLabel && (
              <Billboard follow>
                  <Text
                  position={[0, 2.3, 0]}
                  fontSize={0.45}
                  color="#1f2937"
                  anchorX="center"
                  anchorY="middle"
                  renderOrder={999}
                  material-depthTest={false}
                  material-depthWrite={false}
                  outlineWidth={0.02}
                  outlineColor="white"
                  >
                  {label}
                  </Text>
              </Billboard>
          )}
          {showInventory && (
              <Billboard follow>
                  <group
                  ref={invGroupRef}
                  position={[0, showLabel ? 3.2 : 2.3, 0]}
                  onPointerEnter={(e) => {
                      e.stopPropagation();
                      setInventoryHover(true);
                      document.body.style.cursor = 'pointer';
                  }}
                  onPointerLeave={(e) => {
                      e.stopPropagation();
                      setInventoryHover(false);
                      document.body.style.cursor = 'auto';
                  }}
                  onClick={(e) => {
                      e.stopPropagation();
                      if (onInventoryClick) onInventoryClick(x, y);
                  }}
                  >
                  {inventoryHover && (
                      <mesh position={[0, 0, -0.01]}>
                      <circleGeometry args={[0.35, 32]} />
                      <meshBasicMaterial
                          color="#fde68a"
                          transparent
                          opacity={0.35}
                          depthTest={false}
                      />
                      </mesh>
                  )}
  
                  <Text
                      fontSize={0.8}
                      color={inventoryHover ? '#b45309' : '#d97706'}
                      anchorX="center"
                      anchorY="middle"
                      renderOrder={999}
                      material-depthTest={false}
                      material-depthWrite={false}
                      outlineWidth={inventoryHover ? 0.04 : 0.03}
                      outlineColor="white"
                  >
                      📦
                  </Text>
                  </group>
              </Billboard>
          )}
      </group>
    );
  });

export default ProceduralRoom;
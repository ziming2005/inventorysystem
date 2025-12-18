
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { RoomType, TileData, ToolMode } from '../types';
import { ROOMS } from '../constants';

interface UIOverlayProps {
  activeTool: ToolMode;
  onSelectTool: (type: ToolMode) => void;
  selectedTile: TileData | null;
  onUpdateTile: (data: Partial<TileData>) => void;
  brushSettings: Partial<TileData>;
  onUpdateBrushSettings: (data: Partial<TileData>) => void;
  isEditMode: boolean;
}

// Icons
const CursorIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>;
const TrashIcon = () => <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

// Room Specific Icons
const getRoomIcon = (type: RoomType) => {
  const props = { className: "w-8 h-8", fill: "none", stroke: "currentColor", strokeWidth: 1.5, viewBox: "0 0 24 24" };
  switch (type) {
    case RoomType.WaitingRoom:
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>;
    case RoomType.OperatorySuite:
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>;
    case RoomType.ImagingSuite:
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" /></svg>;
    case RoomType.StraightWall:
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16" /></svg>;
    case RoomType.Door:
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7-2v18l-7-2V5zm0 0H6a2 2 0 00-2 2v10a2 2 0 002 2h7" /></svg>;
    case RoomType.Window:
      return <svg {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM4 12h16M12 4v16" /></svg>;
    default:
      return <svg {...props}><circle cx="12" cy="12" r="10" /></svg>;
  }
};

const roomTypes = [
  RoomType.WaitingRoom,
  RoomType.OperatorySuite,
  RoomType.ImagingSuite,
  RoomType.StraightWall,
  RoomType.Door,
  RoomType.Window,
];

// Reusable Inspector Controls for both "Selected Tile" and "Brush Settings"
interface InspectorControlsProps {
    type: RoomType;
    data: Partial<TileData>;
    onUpdate: (data: Partial<TileData>) => void;
    isPreview?: boolean;
    x?: number;
    y?: number;
}

const InspectorControls: React.FC<InspectorControlsProps> = ({ type, data, onUpdate, isPreview, x, y }) => {
    const config = ROOMS[type];
    const isStructure = type === RoomType.StraightWall || type === RoomType.Door || type === RoomType.Window;
    
    return (
        <div className="space-y-6">
            {/* Header Info */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div 
                        className={`w-12 h-12 rounded-xl flex items-center justify-center border ${isPreview ? 'bg-white border-dashed border-slate-300' : 'bg-slate-100 border-slate-200'}`}
                        style={{ color: config.color }}
                    >
                        {getRoomIcon(type)}
                    </div>
                    <div>
                        <div className="text-xl font-black text-slate-800 leading-none">
                            {config.name}
                        </div>
                        <div className="text-xs font-mono text-slate-400 mt-1">
                            {isPreview ? (
                                <span className="text-blue-500 font-bold bg-blue-50 px-1.5 py-0.5 rounded">LIBRARY SELECTION</span>
                            ) : (
                                `X: ${x} • Y: ${y}`
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Rotation Control */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Orientation</label>
                <div className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-200">
                        <div 
                        className="w-12 h-12 rounded-full border-2 border-slate-300 flex items-center justify-center transition-transform duration-300"
                        style={{ transform: `rotate(${(data.rotation || 0) * 90}deg)` }}
                        >
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[10px] border-b-slate-600 -mt-1"></div>
                        </div>
                        <button 
                        onClick={() => onUpdate({ rotation: ((data.rotation || 0) + 1) % 4 })}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2 px-4 rounded text-sm transition-colors"
                        >
                        Rotate 90°
                        </button>
                </div>
            </div>

            {/* Label Input - Hide for structures */}
            {!isStructure && (
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Room Label</label>
                <input 
                    type="text" 
                    value={data.label || ''} 
                    onChange={(e) => onUpdate({ label: e.target.value })}
                    placeholder="e.g. Dr. Smith"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            )}

            {/* Inventory Control - Hide for structures */}
            {!isStructure && (
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Inventory</label>
                <button
                    onClick={() => onUpdate({ hasInventory: !data.hasInventory })}
                    className={`w-full py-2 px-3 rounded-lg border flex items-center justify-center gap-2 transition-all ${
                        data.hasInventory 
                        ? 'bg-amber-50 border-amber-200 text-amber-700' 
                        : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                    {data.hasInventory ? (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            <span>Inventory Enabled</span>
                        </>
                    ) : (
                            <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            <span>Enable Inventory</span>
                        </>
                    )}
                </button>
            </div>
            )}

            {/* Theme Color - Enabled for all */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Component Color</label>
                <div className="grid grid-cols-5 gap-2">
                    {[
                        undefined, // Reset / Default
                        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', 
                        '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e', 
                        '#64748b', '#334155'
                    ].map((color, i) => (
                        <button
                            key={i}
                            onClick={() => onUpdate({ customColor: color })}
                            className={`w-full aspect-square rounded-full border-2 flex items-center justify-center ${data.customColor === color || (!data.customColor && color === undefined) ? 'border-slate-800 scale-110' : 'border-transparent hover:scale-105'} transition-all shadow-sm`}
                            style={{ backgroundColor: color || '#f1f5f9' }}
                            title={color || 'Default'}
                        >
                            {!color && <span className="text-slate-400 text-xs font-bold">×</span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

const UIOverlay: React.FC<UIOverlayProps> = ({
  activeTool,
  onSelectTool,
  selectedTile,
  onUpdateTile,
  brushSettings,
  onUpdateBrushSettings,
  isEditMode
}) => {

  const hasBrushSelection = !selectedTile && activeTool !== 'Select' && activeTool !== RoomType.None;

  if (!isEditMode) return null;

  return (
    <div className="absolute inset-x-0 bottom-0 top-14 pointer-events-none flex font-sans text-slate-800">
      
      {/* LEFT PANEL: Component Library */}
      <div className="w-72 bg-slate-50/95 backdrop-blur-md border-r border-slate-200 shadow-xl pointer-events-auto flex flex-col h-full z-10">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-700 uppercase tracking-wider text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            Library
          </h2>
        </div>

        <div className="p-4 flex flex-col gap-4 overflow-y-auto flex-1">
          {/* Main Tools */}
          <div className="flex gap-2">
             <button
                onClick={() => onSelectTool('Select')}
                className={`flex-1 flex items-center justify-center p-3 rounded-lg border transition-all ${activeTool === 'Select' ? 'bg-blue-600 text-white border-blue-700 shadow-md' : 'bg-white border-slate-200 hover:bg-slate-100'}`}
                title="Selection Mode"
             >
                <CursorIcon />
                <span className="ml-2 text-xs font-bold">SELECT</span>
             </button>
             <button
                onClick={() => onSelectTool(RoomType.None)}
                className={`flex-1 flex items-center justify-center p-3 rounded-lg border transition-all ${activeTool === RoomType.None ? 'bg-red-500 text-white border-red-600 shadow-md' : 'bg-white border-slate-200 hover:bg-red-50 hover:text-red-500'}`}
                title="Eraser / Empty"
             >
                <TrashIcon />
                <span className="ml-2 text-xs font-bold">ERASE</span>
             </button>
          </div>

          <hr className="border-slate-200" />

          <div className="grid grid-cols-2 gap-2">
            {roomTypes.map((type) => {
              const config = ROOMS[type];
              const isActive = activeTool === type;
              return (
                <button
                  key={type}
                  onClick={() => onSelectTool(type)}
                  onDragStart={(e) => e.preventDefault()}
                  className={`
                    relative p-3 rounded-xl border flex flex-col items-center justify-center text-center transition-all hover:shadow-md
                    ${isActive ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50' : 'border-slate-200 bg-white hover:border-slate-300'}
                  `}
                >
                  <div 
                    className="w-10 h-10 mb-2 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-100" 
                    style={{ color: config.color }}
                  >
                    {getRoomIcon(type)}
                  </div>
                  <div className="font-bold text-[10px] uppercase text-slate-600 leading-tight">
                    {config.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CENTER: Spacer for Canvas */}
      <div className="flex-1 min-w-0 relative">
        {/* Title removed to allow Toolbar */}
        
        {/* Hints */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none text-center opacity-50">
             <div className="text-[10px] text-slate-600 font-mono bg-white/50 px-2 rounded">
                Left Click: Place | Right Click: Pan | Middle Click: Rotate
             </div>
        </div>
      </div>

      {/* RIGHT PANEL: Inspector */}
      <div className="w-72 bg-slate-50/95 backdrop-blur-md border-l border-slate-200 shadow-xl pointer-events-auto flex flex-col h-full z-10 transition-transform duration-300">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-bold text-slate-700 uppercase tracking-wider text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Inspector
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
            {selectedTile ? (
                selectedTile.roomType !== RoomType.None ? (
                    <InspectorControls 
                        type={selectedTile.roomType}
                        data={selectedTile}
                        onUpdate={onUpdateTile}
                        x={selectedTile.x}
                        y={selectedTile.y}
                    />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                        <div className="w-16 h-16 mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                            <span className="text-3xl opacity-30">∅</span>
                        </div>
                        <p className="text-sm font-medium">Empty Space</p>
                        <p className="text-xs mt-1">Select a room tool to build here.</p>
                    </div>
                )
            ) : hasBrushSelection ? (
                 <InspectorControls 
                    type={activeTool as RoomType}
                    data={brushSettings}
                    onUpdate={onUpdateBrushSettings}
                    isPreview={true}
                 />
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-4">
                    <CursorIcon />
                    <p className="text-sm mt-2 font-medium">No Selection</p>
                    <p className="text-xs max-w-[150px] mx-auto mt-1">Select a component from the Library or click a room to edit.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default UIOverlay;

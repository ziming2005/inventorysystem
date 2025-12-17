
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface TopToolbarProps {
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    worldColor: string;
    onWorldColorChange: (color: string) => void;
    floorColor: string;
    onFloorColorChange: (color: string) => void;
    isEditMode: boolean;
    onToggleEditMode: () => void;
    onShowInventory: () => void;
    onSaveDesign: () => void;
    saving: boolean;
    userEmail?: string;
    onSignOut?: () => void;
}

const TopToolbar: React.FC<TopToolbarProps> = ({
    canUndo, canRedo, onUndo, onRedo,
    worldColor, onWorldColorChange,
    floorColor, onFloorColorChange,
    isEditMode, onToggleEditMode,
    onShowInventory,
    onSaveDesign,
    saving,
    userEmail,
    onSignOut
}) => {
    return (
        <header className="absolute top-0 left-0 w-full h-14 z-30 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-4 md:px-6 pointer-events-auto">
            {/* Left: Brand */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm text-white shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                </div>
                <h1 className="font-bold text-slate-800 text-sm md:text-lg tracking-tight truncate">Dental Clinic Designer</h1>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-4">
                 <button
                    onClick={onSaveDesign}
                    disabled={saving}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg font-bold text-xs md:text-sm transition-all border border-emerald-700/40"
                 >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11V3m0 8l-2-2m2 2l2-2M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2h-3l-2-2H10L8 5H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    {saving ? 'Saving...' : 'Sync to Supabase'}
                 </button>

                 {/* Inventory Button (Available in both modes) */}
                 <button
                    onClick={onShowInventory}
                    className="hidden sm:flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg font-bold text-xs md:text-sm transition-all border border-slate-200"
                 >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    Inventory
                 </button>

                 {isEditMode ? (
                    <>
                        <div className="h-6 w-px bg-slate-200 mx-1"></div>

                        {/* Undo/Redo */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={onUndo}
                                disabled={!canUndo}
                                className={`p-2 rounded-lg transition-all ${!canUndo ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200'}`}
                                title="Undo (Ctrl+Z)"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                            </button>
                            <button
                                onClick={onRedo}
                                disabled={!canRedo}
                                className={`p-2 rounded-lg transition-all ${!canRedo ? 'text-slate-300 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200'}`}
                                title="Redo (Ctrl+Y)"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
                            </button>
                        </div>

                        {/* Colors */}
                        <div className="flex items-center gap-4 border-l border-r border-slate-200 px-4 md:px-6">
                            <div className="flex items-center gap-2" title="Change Background Color">
                                <label className="hidden md:block text-[10px] font-bold text-slate-500 uppercase tracking-wider">World</label>
                                <div className="relative w-8 h-8 rounded-full border border-slate-200 overflow-hidden shadow-sm hover:ring-2 hover:ring-blue-500 hover:ring-offset-1 transition-all bg-slate-100">
                                    <input 
                                        type="color" 
                                        value={worldColor} 
                                        onChange={(e) => onWorldColorChange(e.target.value)}
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 border-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div className="flex items-center gap-2" title="Change Floor Plan Color">
                                <label className="hidden md:block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Floor</label>
                                <div className="relative w-8 h-8 rounded-full border border-slate-200 overflow-hidden shadow-sm hover:ring-2 hover:ring-blue-500 hover:ring-offset-1 transition-all bg-slate-100">
                                    <input 
                                        type="color" 
                                        value={floorColor} 
                                        onChange={(e) => onFloorColorChange(e.target.value)}
                                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] p-0 border-0 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <button 
                        onClick={onToggleEditMode}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md shadow-emerald-900/10 active:scale-95 transition-all"
                        >
                        <svg
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >
                            <path d="M17 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V7l-4-4zM7 5h8v4H7V5zm5 14H7v-6h5v6z" />
                        </svg>
                        Save
                        </button>
                    </>
                 ) : (
                    /* Edit Button */
                    <button 
                        onClick={onToggleEditMode}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-md shadow-blue-900/10 active:scale-95 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Edit Design
                    </button>
                 )}
                 {userEmail && (
                    <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700">
                        <span className="font-semibold">Signed in:</span>
                        <span className="truncate max-w-[180px]">{userEmail}</span>
                        {onSignOut && (
                            <button onClick={onSignOut} className="text-blue-700 font-bold hover:underline text-[11px]">Sign out</button>
                        )}
                    </div>
                 )}
            </div>
        </header>
    );
};

export default TopToolbar;

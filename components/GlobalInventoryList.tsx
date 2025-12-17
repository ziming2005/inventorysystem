
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { InventoryItem } from '../types';
import { generateInventoryPDF } from '../utils/pdfExport';

interface GlobalInventoryListProps {
    isOpen: boolean;
    onClose: () => void;
    items: InventoryItem[];
}

const GlobalInventoryList: React.FC<GlobalInventoryListProps> = ({ isOpen, onClose, items }) => {
    if (!isOpen) return null;

    const handleDownload = () => {
        generateInventoryPDF(items, "Complete Clinic Inventory");
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-center pt-[8vh] bg-slate-900/60 backdrop-blur-sm overflow-y-auto font-sans">
             <div className="w-full max-w-[1400px] mx-4 mb-20 animate-fade-in h-fit">
                {/* Header */}
                <div className="bg-[#4f8f7a] h-[70px] rounded-t-2xl shadow-lg flex items-center justify-between px-6 md:px-8">
                     <h2 className="text-xl md:text-2xl font-bold text-white tracking-wide">Complete Inventory List</h2>
                     
                     <div className="flex items-center gap-3">
                        <button 
                            onClick={handleDownload}
                            className="flex items-center gap-2 bg-[#f3f4f6] hover:bg-white text-slate-700 px-4 py-2 rounded-lg shadow-sm border border-slate-300 transition-all text-sm font-semibold hover:shadow-md"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Download All
                        </button>
                        <button 
                            onClick={onClose}
                            className="flex items-center gap-2 bg-[#f3f4f6] hover:bg-white text-slate-700 px-4 py-2 rounded-lg shadow-sm border border-slate-300 transition-all text-sm font-semibold hover:shadow-md"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                            Hide
                        </button>
                     </div>
                </div>

                {/* Table Container */}
                <div className="bg-white p-6 rounded-b-2xl shadow-2xl min-h-[400px]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap">
                            <thead>
                                <tr className="bg-[#f3f4f6] text-slate-600 text-sm border-b border-slate-200">
                                    <th className="py-4 px-4 font-bold rounded-l-lg">Brand</th>
                                    <th className="py-4 px-4 font-bold">Product</th>
                                    <th className="py-4 px-4 font-bold">Code</th>
                                    <th className="py-4 px-4 font-bold">Qty</th>
                                    <th className="py-4 px-4 font-bold">UOM</th>
                                    <th className="py-4 px-4 font-bold">Unit Price</th>
                                    <th className="py-4 px-4 font-bold">Total</th>
                                    <th className="py-4 px-4 font-bold">Vendor</th>
                                    <th className="py-4 px-4 font-bold">Category</th>
                                    <th className="py-4 px-4 font-bold rounded-r-lg">Location</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-slate-700">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="py-8 text-center text-slate-400 italic">No inventory items found.</td>
                                    </tr>
                                ) : (
                                    items.map((item, idx) => (
                                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-4 text-slate-500 font-medium">{item.brand || '-'}</td>
                                            <td className="py-3 px-4 font-bold text-slate-800">{item.name}</td>
                                            <td className="py-3 px-4 font-mono text-xs text-slate-500">{item.sku || '-'}</td>
                                            <td className="py-3 px-4 font-semibold">{item.quantity}</td>
                                            <td className="py-3 px-4 text-slate-500">{item.uom || 'Each'}</td>
                                            <td className="py-3 px-4 text-slate-500">${item.unitPrice?.toFixed(2) || '0.00'}</td>
                                            <td className="py-3 px-4 text-[#10b981] font-bold">${((item.unitPrice || 0) * item.quantity).toFixed(2)}</td>
                                            <td className="py-3 px-4 text-slate-500">{item.vendor || '-'}</td>
                                            <td className="py-3 px-4">
                                                <span className="inline-block bg-slate-100 text-slate-600 rounded-full px-3 py-1 text-xs font-semibold border border-slate-200">
                                                    {item.category || 'General'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="inline-block bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full px-3 py-1 text-xs font-bold transition-colors border border-blue-100 cursor-pointer">
                                                    {item.location || 'Unknown'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
             </div>
        </div>
    );
}

export default GlobalInventoryList;

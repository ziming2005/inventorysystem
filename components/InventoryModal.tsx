
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { InventoryItem } from '../types';
import { generateInventoryPDF } from '../utils/pdfExport';

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (items: InventoryItem[]) => void;
  initialItems: InventoryItem[];
  title: string;
}

const UOM_OPTIONS = ['Each', 'Box', 'Pack', 'Case', 'Roll', 'Bottle'];
const CATEGORY_OPTIONS = ['Consumables', 'Instruments', 'Equipment', 'Furniture', 'PPE', 'Hygiene'];

const InventoryModal: React.FC<InventoryModalProps> = ({ isOpen, onClose, onSave, initialItems, title }) => {
  const [items, setItems] = useState<InventoryItem[]>(initialItems || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const initialFormState = {
    name: '',
    brand: '',
    sku: '',
    quantity: 1,
    uom: 'Each',
    unitPrice: 0,
    vendor: '',
    category: 'Consumables',
    description: ''
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    setItems(initialItems || []);
  }, [initialItems, isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveItem = () => {
    if (!formData.name) return; // Basic validation
    
    if (editingId) {
        // Update Existing Item
        const updatedItems = items.map(item => 
            item.id === editingId ? { ...item, ...formData } : item
        );
        setItems(updatedItems);
        onSave(updatedItems);
        setEditingId(null);
    } else {
        // Add New Item
        const newItem: InventoryItem = {
          id: Date.now().toString(),
          status: 'In Stock', // Default
          ...formData
        };

        const updatedItems = [...items, newItem];
        setItems(updatedItems);
        onSave(updatedItems); // Auto-save to parent state
    }
    setFormData(initialFormState); // Reset form
  };

  const handleEditItem = (item: InventoryItem) => {
      setEditingId(item.id);
      setFormData({
          name: item.name,
          brand: item.brand || '',
          sku: item.sku || '',
          quantity: item.quantity,
          uom: item.uom || 'Each',
          unitPrice: item.unitPrice || 0,
          vendor: item.vendor || '',
          category: item.category || 'Consumables',
          description: item.description || ''
      });
  };

  const handleResetForm = () => {
    setFormData(initialFormState);
    setEditingId(null);
  };

  const handleDeleteItem = (id: string) => {
    const updatedItems = items.filter(item => item.id !== id);
    setItems(updatedItems);
    onSave(updatedItems);
    if (editingId === id) {
        handleResetForm();
    }
  };

  const handleUpdateQuantity = (id: string, newQty: number) => {
      const quantity = Math.max(0, newQty);
      const updatedItems = items.map(item =>
          item.id === id ? { ...item, quantity } : item
      );
      setItems(updatedItems);
      onSave(updatedItems);
      
      // If we are currently editing this item, update the form data too so it doesn't get out of sync
      if (editingId === id) {
          setFormData(prev => ({ ...prev, quantity }));
      }
  };

  const handleDownloadPDF = () => {
      // Create a list where items without a specific location inherit the room title
      const itemsWithLocation = items.map(item => ({
          ...item,
          location: item.location || title || "Room"
      }));
      generateInventoryPDF(itemsWithLocation, `${title} Inventory`);
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.brand?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in font-sans text-slate-800">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* --- HEADER --- */}
        <div className="h-[70px] bg-[#4f8f7a] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-6 flex-1">
             <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-tight truncate max-w-[300px]" title={title}>
               {title || "ROOM"}
             </h2>
             {/* Divider */}
             <div className="h-px bg-white/30 flex-1 mr-4"></div>
          </div>
          
          <div className="flex items-center gap-4">
             <button 
                onClick={handleDownloadPDF}
                className="hidden sm:flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/20"
             >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                Download PDF
             </button>
             
             <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </button>
          </div>
        </div>

        {/* --- BODY --- */}
        <div className="p-6 overflow-y-auto flex-1">
           
           {/* --- FORM GRID --- */}
           <div className={`grid grid-cols-1 md:grid-cols-4 gap-x-4 gap-y-4 mb-4 p-4 rounded-xl border ${editingId ? 'bg-blue-50 border-blue-200' : 'bg-transparent border-transparent'}`}>
              {/* Row 1 */}
              <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">Product Name <span className="text-red-500">*</span></label>
                 <input 
                   type="text" 
                   value={formData.name}
                   onChange={(e) => handleInputChange('name', e.target.value)}
                   className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#4f8f7a] focus:ring-1 focus:ring-[#4f8f7a]"
                 />
              </div>
              <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">Brand</label>
                 <input 
                   type="text" 
                   value={formData.brand}
                   onChange={(e) => handleInputChange('brand', e.target.value)}
                   className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#4f8f7a] focus:ring-1 focus:ring-[#4f8f7a]"
                 />
              </div>
              <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">Code / SKU</label>
                 <input 
                   type="text" 
                   value={formData.sku}
                   onChange={(e) => handleInputChange('sku', e.target.value)}
                   className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#4f8f7a] focus:ring-1 focus:ring-[#4f8f7a]"
                 />
              </div>
              <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">Quantity <span className="text-red-500">*</span></label>
                 <input 
                   type="number" 
                   min="1"
                   value={formData.quantity}
                   onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                   className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#4f8f7a] focus:ring-1 focus:ring-[#4f8f7a]"
                 />
              </div>

              {/* Row 2 */}
              <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">UOM</label>
                 <select 
                   value={formData.uom}
                   onChange={(e) => handleInputChange('uom', e.target.value)}
                   className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#4f8f7a] focus:ring-1 focus:ring-[#4f8f7a]"
                 >
                   {UOM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                 </select>
              </div>
              <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">Unit Price ($)</label>
                 <input 
                   type="number" 
                   min="0"
                   step="0.01"
                   value={formData.unitPrice}
                   onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
                   className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#4f8f7a] focus:ring-1 focus:ring-[#4f8f7a]"
                 />
              </div>
              <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">Vendor</label>
                 <input 
                   type="text" 
                   value={formData.vendor}
                   onChange={(e) => handleInputChange('vendor', e.target.value)}
                   className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#4f8f7a] focus:ring-1 focus:ring-[#4f8f7a]"
                 />
              </div>
              <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1">Category</label>
                 <select 
                   value={formData.category}
                   onChange={(e) => handleInputChange('category', e.target.value)}
                   className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#4f8f7a] focus:ring-1 focus:ring-[#4f8f7a]"
                 >
                    {CATEGORY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                 </select>
              </div>
              
              {/* Description spans full width in grid */}
              <div className="col-span-1 md:col-span-4">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                  <textarea 
                    rows={2}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Item description..."
                    className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#4f8f7a] focus:ring-1 focus:ring-[#4f8f7a] resize-none"
                  />
               </div>
               
               {/* Form Buttons */}
               <div className="col-span-1 md:col-span-4 flex gap-3">
                  <button 
                    onClick={handleSaveItem}
                    className={`${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#4f8f7a] hover:bg-[#3d7a66]'} text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm`}
                  >
                    {editingId ? 'Update Item' : 'Add Item'}
                  </button>
                  <button 
                    onClick={handleResetForm}
                    className="bg-slate-700 hover:bg-slate-800 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors shadow-sm"
                  >
                    {editingId ? 'Cancel Edit' : 'Clear Form'}
                  </button>
               </div>
           </div>

           {/* --- DIVIDER --- */}
           <hr className="border-slate-200 mb-6" />

           {/* --- LIST HEADER --- */}
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h3 className="font-bold text-slate-700">Items in Room ({items.length})</h3>
              
              <div className="relative">
                 <input 
                   type="text" 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   placeholder="Search items..."
                   className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm w-64 focus:outline-none focus:border-[#4f8f7a]"
                 />
                 <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
           </div>

           {/* --- TABLE --- */}
           <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-sm text-left">
                 <thead className="bg-white text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                       <th className="px-4 py-3 font-medium">Brand</th>
                       <th className="px-4 py-3 font-medium">Product</th>
                       <th className="px-4 py-3 font-medium">Code</th>
                       <th className="px-4 py-3 font-medium">Qty</th>
                       <th className="px-4 py-3 font-medium">UOM</th>
                       <th className="px-4 py-3 font-medium">Unit Price</th>
                       <th className="px-4 py-3 font-medium">Total</th>
                       <th className="px-4 py-3 font-medium">Vendor</th>
                       <th className="px-4 py-3 font-medium">Category</th>
                       <th className="px-4 py-3 font-medium">Location</th>
                       <th className="px-4 py-3 font-medium text-right">Action</th>
                    </tr>
                 </thead>
                 <tbody className="bg-white divide-y divide-slate-100">
                    {filteredItems.length === 0 ? (
                        <tr>
                            <td colSpan={11} className="px-4 py-8 text-center text-slate-400 italic">
                                No items found in this room. Use the form above to add inventory.
                            </td>
                        </tr>
                    ) : (
                        filteredItems.map(item => (
                            <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${editingId === item.id ? 'bg-blue-50/50' : ''}`}>
                                <td className="px-4 py-3 text-slate-600">{item.brand || '-'}</td>
                                <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{item.sku || '-'}</td>
                                <td className="px-4 py-3">
                                   <input
                                      type="number"
                                      min="0"
                                      value={item.quantity}
                                      onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value) || 0)}
                                      className="w-16 px-2 py-1 text-center border border-slate-300 rounded focus:border-[#4f8f7a] focus:outline-none focus:ring-1 focus:ring-[#4f8f7a] bg-slate-50 focus:bg-white"
                                   />
                                </td>
                                <td className="px-4 py-3 text-slate-600">{item.uom || 'Each'}</td>
                                <td className="px-4 py-3 text-slate-600">${item.unitPrice?.toFixed(2) || '0.00'}</td>
                                <td className="px-4 py-3 text-[#4f8f7a] font-bold">${((item.unitPrice || 0) * item.quantity).toFixed(2)}</td>
                                <td className="px-4 py-3 text-slate-600 truncate max-w-[100px]" title={item.vendor}>{item.vendor || '-'}</td>
                                <td className="px-4 py-3">
                                    <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                                        {item.category || 'General'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-slate-500">{item.location || title || "Room"}</td>
                                <td className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button 
                                            onClick={() => handleEditItem(item)}
                                            className="text-slate-400 hover:text-blue-500 transition-colors p-1.5 rounded hover:bg-blue-50"
                                            title="Edit Item"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteItem(item.id)}
                                            className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded hover:bg-red-50"
                                            title="Delete Item"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
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
};

export default InventoryModal;

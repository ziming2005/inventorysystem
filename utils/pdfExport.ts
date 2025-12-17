
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
// @ts-ignore
import { jsPDF } from "jspdf";
// @ts-ignore
import autoTable from "jspdf-autotable";
import { InventoryItem } from "../types";

export const generateInventoryPDF = (items: InventoryItem[], title: string) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text(title, 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, 30);

    // Prepare Data
    const tableBody = items.map(item => [
        item.brand || '',
        item.name,
        item.sku || '',
        item.quantity.toString(),
        item.uom || 'Each',
        `$${(item.unitPrice || 0).toFixed(2)}`,
        `$${((item.unitPrice || 0) * item.quantity).toFixed(2)}`,
        item.vendor || '',
        item.category || '',
        item.location || ''
    ]);

    // Generate Table
    autoTable(doc, {
        startY: 35,
        head: [['Brand', 'Product', 'Code', 'Qty', 'UOM', 'Price', 'Total', 'Vendor', 'Category', 'Location']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [79, 143, 122], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
        columnStyles: {
            0: { cellWidth: 20 }, // Brand
            1: { cellWidth: 'auto' }, // Product
            2: { cellWidth: 20 }, // Code
            3: { cellWidth: 12, halign: 'center' }, // Qty
            4: { cellWidth: 15 }, // UOM
            5: { cellWidth: 18, halign: 'right' }, // Price
            6: { cellWidth: 18, halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] }, // Total
            7: { cellWidth: 20 }, // Vendor
            8: { cellWidth: 20 }, // Category
            9: { cellWidth: 20 }, // Location
        }
    });

    const fileName = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_inventory.pdf`;
    doc.save(fileName);
};

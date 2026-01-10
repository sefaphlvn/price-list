import * as XLSX from 'xlsx';
import { PriceListRow } from '../types';

// Export to CSV with UTF-8 BOM for Excel compatibility
export const exportToCSV = (data: PriceListRow[], filename: string = 'fiyat-listesi.csv') => {
  const headers = ['Marka', 'Model', 'Donanım', 'Motor', 'Şanzıman', 'Yakıt', 'Fiyat'];
  const rows = data.map(row => [
    row.brand,
    row.model,
    row.trim,
    row.engine,
    row.transmission,
    row.fuel,
    row.priceRaw,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  // Add UTF-8 BOM for Turkish characters
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
};

// Export to XLSX
export const exportToXLSX = (data: PriceListRow[], filename: string = 'fiyat-listesi.xlsx') => {
  const worksheetData = [
    ['Marka', 'Model', 'Donanım', 'Motor', 'Şanzıman', 'Yakıt', 'Fiyat'],
    ...data.map(row => [
      row.brand,
      row.model,
      row.trim,
      row.engine,
      row.transmission,
      row.fuel,
      row.priceRaw,
    ]),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Fiyat Listesi');

  XLSX.writeFile(workbook, filename);
};

// Copy as Markdown table
export const copyAsMarkdown = async (data: PriceListRow[]): Promise<boolean> => {
  const headers = '| Marka | Model | Donanım | Motor | Şanzıman | Yakıt | Fiyat |';
  const separator = '|-------|-------|---------|-------|----------|-------|-------|';
  const rows = data.map(
    row =>
      `| ${row.brand} | ${row.model} | ${row.trim} | ${row.engine} | ${row.transmission} | ${row.fuel} | ${row.priceRaw} |`
  );

  const markdown = [headers, separator, ...rows].join('\n');

  try {
    await navigator.clipboard.writeText(markdown);
    return true;
  } catch (error) {
    console.error('Clipboard error:', error);
    return false;
  }
};

// Helper function to download blob
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

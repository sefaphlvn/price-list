import * as XLSX from 'xlsx';
import { PriceListRow } from '../types';

// Helper to format powertrain type
const getPowertrainType = (row: PriceListRow): string => {
  if (row.isElectric) return 'Elektrikli';
  if (row.isPlugInHybrid) return 'Plug-in Hybrid';
  if (row.isMildHybrid) return 'Mild Hybrid';
  if (row.isHybrid) return 'Hybrid';
  return 'İçten Yanmalı';
};

// Export to CSV with UTF-8 BOM for Excel compatibility
export const exportToCSV = (data: PriceListRow[], filename: string = 'fiyat-listesi.csv') => {
  const headers = [
    'Marka', 'Model', 'Donanım', 'Motor', 'Güç (HP)', 'Güç (kW)', 'Motor Hacmi',
    'Şanzıman', 'Şanzıman Tipi', 'Yakıt', 'Çekiş', 'Güç Aktarımı', 'Fiyat',
    'Model Yılı', 'ÖTV Oranı', 'Yakıt Tüketimi', 'Aylık Kira', 'Liste Fiyatı', 'Kampanya Fiyatı',
    'Net Fiyat', 'ÖTV Tutarı', 'KDV Tutarı', 'MTV', 'Menşei',
    'Menzil (km)', 'Batarya (kWh)', 'Uzun Menzil'
  ];
  const rows = data.map(row => [
    row.brand,
    row.model,
    row.trim,
    row.engine,
    row.powerHP || '',
    row.powerKW || '',
    row.engineDisplacement || '',
    row.transmission,
    row.transmissionType || '',
    row.fuel,
    row.driveType || '',
    getPowertrainType(row),
    row.priceRaw,
    row.modelYear || '',
    row.otvRate ? `%${row.otvRate}` : '',
    row.fuelConsumption || '',
    row.monthlyLease ? `${row.monthlyLease.toLocaleString('tr-TR')} TL` : '',
    row.priceListNumeric ? `${row.priceListNumeric.toLocaleString('tr-TR')} TL` : '',
    row.priceCampaignNumeric ? `${row.priceCampaignNumeric.toLocaleString('tr-TR')} TL` : '',
    row.netPrice ? `${row.netPrice.toLocaleString('tr-TR')} TL` : '',
    row.otvAmount ? `${row.otvAmount.toLocaleString('tr-TR')} TL` : '',
    row.kdvAmount ? `${row.kdvAmount.toLocaleString('tr-TR')} TL` : '',
    row.mtvAmount ? `${row.mtvAmount.toLocaleString('tr-TR')} TL` : '',
    row.origin || '',
    row.wltpRange || '',
    row.batteryCapacity || '',
    row.hasLongRange ? 'Evet' : '',
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
    [
      'Marka', 'Model', 'Donanım', 'Motor', 'Güç (HP)', 'Güç (kW)', 'Motor Hacmi',
      'Şanzıman', 'Şanzıman Tipi', 'Yakıt', 'Çekiş', 'Güç Aktarımı', 'Fiyat',
      'Model Yılı', 'ÖTV Oranı', 'Yakıt Tüketimi', 'Aylık Kira', 'Liste Fiyatı', 'Kampanya Fiyatı',
      'Net Fiyat', 'ÖTV Tutarı', 'KDV Tutarı', 'MTV', 'Menşei',
      'Menzil (km)', 'Batarya (kWh)', 'Uzun Menzil'
    ],
    ...data.map(row => [
      row.brand,
      row.model,
      row.trim,
      row.engine,
      row.powerHP || '',
      row.powerKW || '',
      row.engineDisplacement || '',
      row.transmission,
      row.transmissionType || '',
      row.fuel,
      row.driveType || '',
      getPowertrainType(row),
      row.priceRaw,
      row.modelYear || '',
      row.otvRate ? `%${row.otvRate}` : '',
      row.fuelConsumption || '',
      row.monthlyLease ? `${row.monthlyLease.toLocaleString('tr-TR')} TL` : '',
      row.priceListNumeric ? `${row.priceListNumeric.toLocaleString('tr-TR')} TL` : '',
      row.priceCampaignNumeric ? `${row.priceCampaignNumeric.toLocaleString('tr-TR')} TL` : '',
      row.netPrice ? `${row.netPrice.toLocaleString('tr-TR')} TL` : '',
      row.otvAmount ? `${row.otvAmount.toLocaleString('tr-TR')} TL` : '',
      row.kdvAmount ? `${row.kdvAmount.toLocaleString('tr-TR')} TL` : '',
      row.mtvAmount ? `${row.mtvAmount.toLocaleString('tr-TR')} TL` : '',
      row.origin || '',
      row.wltpRange || '',
      row.batteryCapacity || '',
      row.hasLongRange ? 'Evet' : '',
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

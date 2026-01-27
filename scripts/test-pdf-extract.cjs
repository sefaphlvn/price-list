const { PDFExtract } = require('pdf.js-extract');

const pdfExtract = new PDFExtract();

pdfExtract.extract('/tmp/fiat-fiyat.pdf', {}).then(data => {
  console.log('Pages:', data.pages.length);
  console.log('');
  
  // İlk sayfayı analiz et
  const page = data.pages[0];
  console.log('=== PAGE 1 - Items with positions ===\n');
  
  // Y pozisyonuna göre grupla (satırlar)
  const rows = {};
  for (const item of page.content) {
    const y = Math.round(item.y);
    if (!rows[y]) rows[y] = [];
    rows[y].push({ x: item.x, text: item.str, width: item.width });
  }
  
  // İlk 30 satırı göster
  const sortedY = Object.keys(rows).map(Number).sort((a, b) => a - b);
  for (let i = 0; i < Math.min(40, sortedY.length); i++) {
    const y = sortedY[i];
    const rowItems = rows[y].sort((a, b) => a.x - b.x);
    const text = rowItems.map(r => r.text).join(' | ');
    if (text.trim()) {
      console.log(`Y=${y}: ${text}`);
    }
  }
}).catch(err => console.error(err));

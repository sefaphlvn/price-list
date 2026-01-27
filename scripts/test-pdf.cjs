const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('/tmp/fiat-fiyat.pdf');
pdf(dataBuffer).then(function(data) {
  console.log('=== PDF INFO ===');
  console.log('Pages:', data.numpages);
  console.log('');
  console.log('=== TEXT CONTENT (first 4000 chars) ===');
  console.log(data.text.substring(0, 4000));
});

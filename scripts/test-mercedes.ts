// Test Mercedes-Benz API
async function testMercedes() {
  const url = 'https://pladmin.mercedes-benz.com.tr/api/product/searchByCategoryCode?code=w177-fl&_includes=ID,Code,Alias,Name,GroupName,ProductAttribute,ProductPrice,TaxRatio,VATRatio,IsActive,ImagePath';

  console.log('Fetching Mercedes-Benz API...');

  const response = await fetch(url, {
    headers: {
      'accept': 'application/json, text/plain, */*',
      'applicationid': 'b7d8f89b-8642-40e7-902e-eae1190c40c0',
      'organizationid': '637ca6c6-9d07-4e59-9c31-e9081b3a9d7b',
      'origin': 'https://fiyat.mercedes-benz.com.tr',
      'referer': 'https://fiyat.mercedes-benz.com.tr/',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  });

  if (!response.ok) {
    console.log('HTTP Error:', response.status, response.statusText);
    return;
  }

  const data = await response.json();
  console.log('Success:', data.success);
  console.log('Count:', data.count);

  if (data.result && data.result.length > 0) {
    console.log('\n=== First 2 vehicles ===\n');
    data.result.slice(0, 2).forEach((item: any, i: number) => {
      console.log(`--- Vehicle ${i + 1} ---`);
      console.log(JSON.stringify(item, null, 2));
    });
  } else {
    console.log('No results');
    console.log('Response:', JSON.stringify(data, null, 2));
  }
}

testMercedes().catch(console.error);

const https = require('https');
const fs = require('fs');

const url = 'https://comtradeapi.un.org/public/v1/getMetadata/C/A/HS?reporterCode=376&partnerCode=31&period=2020,2021,2022,2023,2024&tradeDirection=1,2&aggregateBy=TOTAL';

https.get(url, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data');
    }
    fs.writeFileSync('./data/comtrade.json', data);
    console.log('Data written to file');
  });
}).on('error', (err) => {
  console.error('Error fetching data:', err.message);
});
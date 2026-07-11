const https = require('https');

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function run() {
  try {
    const html1 = await fetchHtml('https://www.pexels.com/search/billboard/');
    const matches = html1.match(/images\.pexels\.com\/photos\/\d+\/pexels-photo-\d+\.jpeg/g) || [];
    
    const uniqueIds = [...new Set(matches)];

    console.log("Found valid image URLs:");
    uniqueIds.slice(0, 10).forEach(u => {
      console.log(`"https://${u}?auto=compress&cs=tinysrgb&w=1200",`);
    });
  } catch (err) {
    console.error(err);
  }
}

run();

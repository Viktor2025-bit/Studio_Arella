const https = require('https');
const fs = require('fs');
const path = require('path');

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
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
    const html = await fetchHtml('https://unsplash.com/s/photos/billboard');
    // Extract image URLs using regex
    const matches = html.match(/"(https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9\-]+\?[^"]+)"/g) || [];
    
    // Filter and clean
    const uniqueUrls = [...new Set(matches.map(m => m.replace(/"/g, '')))]
      .filter(u => u.includes('w=') && !u.includes('premium'))
      .map(u => {
        const urlObj = new URL(u);
        urlObj.searchParams.set('w', '1000');
        urlObj.searchParams.set('auto', 'format');
        urlObj.searchParams.set('fit', 'crop');
        return urlObj.toString();
      });

    // Take first 5 unique base IDs
    const finalUrls = [];
    const seenIds = new Set();
    for (const u of uniqueUrls) {
      const id = new URL(u).pathname.split('-')[1];
      if (!seenIds.has(id)) {
        seenIds.add(id);
        finalUrls.push(u);
      }
      if (finalUrls.length >= 5) break;
    }

    console.log("Downloading the following URLs:");
    finalUrls.forEach(u => console.log(u));

    const targetDir = path.join(__dirname, 'frontend', 'public', 'billboards');

    finalUrls.forEach((url, i) => {
      const filePath = path.join(targetDir, `${i + 1}.jpg`);
      const file = fs.createWriteStream(filePath);
      https.get(url, (res) => {
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`Downloaded ${filePath}`);
        });
      }).on('error', (err) => {
        fs.unlink(filePath, () => {});
        console.error(`Error downloading ${url}:`, err.message);
      });
    });
  } catch (err) {
    console.error(err);
  }
}

run();

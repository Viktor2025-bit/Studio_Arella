const https = require('https');
const fs = require('fs');

function downloadImage(url, filename) {
  https.get(url, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      // Handle redirect
      downloadImage(res.headers.location, filename);
    } else if (res.statusCode === 200) {
      const file = fs.createWriteStream(filename);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded to ${filename}`);
      });
    } else {
      console.log(`Failed to download ${url} - Status Code: ${res.statusCode}`);
    }
  }).on('error', (err) => {
    console.error(`Error: ${err.message}`);
  });
}

downloadImage('https://unsplash.com/photos/Xw3t6N2o35Y/download?force=true', 'test1.jpg');
downloadImage('https://unsplash.com/photos/jVn4c2vN0kQ/download?force=true', 'test2.jpg');
downloadImage('https://unsplash.com/photos/a7y2k0f9s8d/download?force=true', 'test3.jpg');

const https = require('https');
const fs = require('fs');
const path = require('path');

const images = [
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1000&auto=format&fit=crop", // Giant Asian billboard
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1000&auto=format&fit=crop", // City street glowing screens
  "https://images.unsplash.com/photo-1504386106331-3e4e71712b38?w=1000&auto=format&fit=crop", // Times square massive LED
  "https://images.unsplash.com/photo-1550596334-7bb40a71b6bc?w=1000&auto=format&fit=crop", // Another giant LED screen
  "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1000&auto=format&fit=crop"  // Blank physical outdoor board
];

const targetDir = path.join(__dirname, 'frontend', 'public', 'billboards');

images.forEach((url, i) => {
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

const https = require('https');
const urls = [
  "https://images.unsplash.com/photo-1505330622200-1aa29be4c336",
  "https://images.unsplash.com/photo-1478809846180-86b053c5112f",
  "https://images.unsplash.com/photo-1517409217031-6e949987fb04",
  "https://images.unsplash.com/photo-1563986768609-322da13575f3"
];

urls.forEach(url => {
  https.get(url, (res) => {
    console.log(`${res.statusCode} - ${url}`);
  });
});

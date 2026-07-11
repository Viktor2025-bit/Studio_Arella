const https = require('https');
const ids = [
  "1542744173-8e7e53415bb0",
  "1512453979798-5ea266f8880c",
  "1563986768609-322da13575f3",
  "1504386106331-3e4e71712b38",
  "1561570732-7a871dfa5b4f",
  "1478809846180-86b053c5112f",
  "1520188740392-6809dbf3975e",
  "1561463126-7ab5fa38fb6e",
  "1550596334-7bb40a71b6bc",
  "1445585098317-09fba2451bdc",
  "1505330622200-1aa29be4c336",
  "1536248972166-3d6d0fb0f0f4",
  "1481182276532-6a6d639b78cb"
];

ids.forEach(id => {
  https.get(`https://images.unsplash.com/photo-${id}?w=1000&auto=format&fit=crop`, (res) => {
    if(res.statusCode === 200) {
      console.log(`"https://images.unsplash.com/photo-${id}?q=80&w=1000&auto=format&fit=crop",`);
    }
  });
});

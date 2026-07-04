const https = require('https');

const urls = [
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1579548122080-c0b1f3c306d1?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1561463126-7ab5fa38fb6e?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542744094-24638eff58bb?q=80&w=1000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1000&auto=format&fit=crop"
];

urls.forEach(url => {
  https.get(url, (res) => {
    console.log(`${res.statusCode} - ${url.split('?')[0]}`);
  });
});

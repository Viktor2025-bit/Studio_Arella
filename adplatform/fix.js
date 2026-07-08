const fs = require('fs');
let c = fs.readFileSync('frontend/components/landing/landingPage.tsx', 'utf8');
c = c.replace(/padding: '120px 24px'/g, "padding: 'var(--landing-py, 120px) 24px'");
c = c.replace(/padding: '80px 24px'/g, "padding: 'var(--landing-py-sm, 80px) 24px'");
c = c.replace(/padding: '60px 24px 120px'/g, "padding: 'var(--landing-py-half, 60px) 24px var(--landing-py, 120px)'");
fs.writeFileSync('frontend/components/landing/landingPage.tsx', c);

const fs = require('fs');
const path = 'c:/Users/Dell/Downloads/adplatform/adplatform/frontend/components/landing/landingPage.tsx';
let content = fs.readFileSync(path, 'utf8');

// Global backgrounds
content = content.replace(/linear-gradient\(135deg, #0f172a 0%, #0a0a0a 100%\)/g, 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)');
content = content.replace(/background: '#0a0a0a'/g, "background: '#ffffff'");
content = content.replace(/background: '#050505'/g, "background: '#f8fafc'");
content = content.replace(/background: '#111'/g, "background: '#ffffff'");
content = content.replace(/background: '#0f172a'/g, "background: '#ffffff'");

// RGBA Backgrounds & Borders (Invert opacity for white elements on dark background -> dark elements on white)
content = content.replace(/rgba\(255,255,255,/g, 'rgba(0,0,0,');
content = content.replace(/rgba\(10,10,10,/g, 'rgba(255,255,255,');
content = content.replace(/rgba\(15,23,42,/g, 'rgba(255,255,255,');

// Social icons background
content = content.replace(/#1e293b/g, '#e2e8f0');
content = content.replace(/#334155/g, '#cbd5e1');

// Text Colors
content = content.replace(/color: '#F8FAFC'/g, "color: '#0f172a'");
content = content.replace(/color: '#94A3B8'/g, "color: '#475569'");
content = content.replace(/color: '#fff'/g, "color: '#0f172a'");
content = content.replace(/color: '#e2e8f0'/g, "color: '#334155'");
content = content.replace(/color="#F8FAFC"/g, 'color="#0f172a"');
content = content.replace(/color="#94A3B8"/g, 'color="#475569"');

// Special hover colors in CSS
content = content.replace(/color:#F8FAFC/g, 'color:#0f172a');
content = content.replace(/color:#94A3B8/g, 'color:#475569');

// Buttons / Text interactions
content = content.replace(/color: '#111111'/g, "color: '#ffffff'");
content = content.replace(/color: '#111'/g, "color: '#ffffff'");

// Mobile menu inline fixes
content = content.replace(/color: i===0  \? '#111111' : '#06B6D4'/g, "color: i===0  ? '#ffffff' : '#06B6D4'");

// Logo
content = content.replace(/logo-white\.png/g, 'logo.png');

fs.writeFileSync(path, content);
console.log('Replacements completed successfully!');

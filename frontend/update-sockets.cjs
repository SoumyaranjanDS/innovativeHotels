const fs = require('fs');
const path = require('path');

const files = [
  'ProviderSupport.jsx', 
  'CustomerSupportDashboard.jsx', 
  'CustomerDashboard.jsx', 
  'CabLiveTracking.jsx', 
  'CabDriverDashboard.jsx', 
  'AdminSupport.jsx'
];

files.forEach(f => {
  const p = path.join(__dirname, 'src/pages', f);
  if(fs.existsSync(p)){
    let content = fs.readFileSync(p, 'utf8');
    content = content.replace(/io\(import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:5000'\)/g, "io(import.meta.env.PROD ? import.meta.env.VITE_API_URL : 'http://localhost:5000')");
    fs.writeFileSync(p, content);
    console.log('Updated ' + f);
  } else {
    console.log('Not found ' + p);
  }
});

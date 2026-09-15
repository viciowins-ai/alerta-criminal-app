import fs from 'fs';
fetch('http://localhost:3000/api/push/broadcast', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer INVALID'
  },
  body: JSON.stringify({
    title: 'test', body: 'test', htmlContent: 'test'
  })
}).then(res => res.text()).then(console.log).catch(console.error);

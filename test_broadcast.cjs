const http = require('http');

const data = JSON.stringify({
    title: 'Teste Broadcast Local',
    body: 'Teste corpo',
    url: '/',
    htmlContent: '<h1>Teste</h1>'
});

const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/api/push/broadcast',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
}, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.on('data', (d) => {
        process.stdout.write(d);
    });
});
req.write(data);
req.end();

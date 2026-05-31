const express = require('express');
const https = require('https');
const http = require('http');

const app = express();
const PORT = 3000;
const TARGET_BASE = 'https://fideltour.youtrack.cloud';
const AUTH_TOKEN = 'Bearer perm-bWFtYXJvYQ==.NDQtMTM=.p3EFxNWkddk5llFgUKHnV12pLOYEYu';

app.use(express.json());

// CORS abierto para localhost
app.use((req, res, next) => {
  const origin = req.headers.origin || '';
  if (origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

function forwardRequest(method, path, query, body, res) {
  const url = new URL(TARGET_BASE + path);
  if (query) {
    Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const bodyData = body ? JSON.stringify(body) : null;

  const options = {
    method,
    headers: {
      'Authorization': AUTH_TOKEN,
      'Content-Type': 'application/json',
      ...(bodyData ? { 'Content-Length': Buffer.byteLength(bodyData) } : {}),
    },
  };

  const lib = url.protocol === 'https:' ? https : http;

  const proxyReq = lib.request(url, options, (proxyRes) => {
    res.status(proxyRes.statusCode);
    const contentType = proxyRes.headers['content-type'];
    if (contentType) res.setHeader('Content-Type', contentType);

    let data = '';
    proxyRes.on('data', chunk => { data += chunk; });
    proxyRes.on('end', () => res.send(data));
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.status(502).json({ error: 'Bad Gateway', detail: err.message });
  });

  if (bodyData) proxyReq.write(bodyData);
  proxyReq.end();
}

// GET /issues?query=...
app.get('/issues', (req, res) => {
  forwardRequest('GET', '/api/issues', req.query, null, res);
});

// POST /issues
app.post('/issues', (req, res) => {
  forwardRequest('POST', '/api/issues', null, req.body, res);
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log(`Forwarding to ${TARGET_BASE}/api/issues`);
});

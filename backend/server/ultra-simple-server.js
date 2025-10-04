const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3000;

console.log('🚀 Starting ultra-simple server...');
console.log('PORT:', PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (parsedUrl.pathname === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({
      message: "FlexiAdapt Backend is ALIVE!",
      status: "running",
      timestamp: new Date().toISOString(),
      port: PORT,
      method: req.method,
      url: req.url,
      env: {
        nodeEnv: process.env.NODE_ENV || 'unknown',
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasGeminiKey: !!process.env.GEMINI_API_KEY
      }
    }, null, 2));
  } else if (parsedUrl.pathname === '/test') {
    res.writeHead(200);
    res.end(JSON.stringify({
      message: "Test endpoint working!",
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({
      error: "Not found",
      path: parsedUrl.pathname
    }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Ultra-simple server running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});

process.on('SIGTERM', () => {
  console.log('💀 SIGTERM received');
  server.close(() => {
    console.log('👋 Server closed');
  });
});

module.exports = server;

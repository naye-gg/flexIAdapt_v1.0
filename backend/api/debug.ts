export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    console.log('🔧 Debug endpoint called');
    
    // Test just environment
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: "No DATABASE_URL" });
    }

    return res.status(200).json({
      message: "Debug endpoint working",
      hasDbUrl: !!process.env.DATABASE_URL,
      method: req.method,
      query: req.query
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    return res.status(500).json({ 
      error: "Debug error",
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

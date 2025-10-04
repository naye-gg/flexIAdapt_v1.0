export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get student ID from query parameters
    const { studentId } = req.query;
    
    if (!studentId) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    console.log(`👤 Student individual get for ID: ${studentId}`);

    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: "Database URL not configured" });
    }

    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    const ws = await import('ws');

    neonConfig.webSocketConstructor = ws.default || ws;

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
    });

    const result = await pool.query('SELECT * FROM students WHERE id = $1', [studentId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    return res.status(200).json(result.rows[0]);

  } catch (error) {
    console.error('❌ Student individual handler error:', error);
    
    return res.status(500).json({ 
      error: "Error processing student request",
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

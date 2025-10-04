export default async function handler(req: any, res: any) {
  try {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // Only handle POST requests for login
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    console.log('🔐 Login attempt detected at /api/auth/login');
    
    // Dynamic imports for database functionality
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    const { eq } = await import('drizzle-orm');
    const { z } = await import('zod');
    const ws = await import('ws');
    
    // Import schema with error handling - try multiple paths for Vercel
    let teachersSchema;
    try {
      // Try different import paths for Vercel compatibility
      let schema;
      try {
        schema = await import('../../shared/schema.js');
      } catch {
        try {
          schema = await import('../../shared/schema');
        } catch {
          try {
            schema = await import('../../shared/schema');
          } catch {
              // Try relative to root
              schema = await import('shared/schema');
            }
          }
        }
      }
      teachersSchema = schema.teachers;
    } catch (importError) {
      console.error('❌ Schema import failed:', importError);
      
      // Fallback: define schema inline for Vercel compatibility
      const { pgTable, text, timestamp, boolean, serial } = await import('drizzle-orm/pg-core');
      
      teachersSchema = pgTable('teachers', {
        id: serial('id').primaryKey(),
        name: text('name').notNull(),
        email: text('email').notNull().unique(),
        password: text('password').notNull(),
        isActive: boolean('is_active').default(true),
        createdAt: timestamp('created_at').defaultNow(),
        lastLogin: timestamp('last_login')
      });
    }

    // Set up database connection
    neonConfig.webSocketConstructor = ws.default || ws;
    
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: "Database URL not configured" });
    }

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
    });
    const db = drizzle(pool);
    
    // Parse and validate request body
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (parseError) {
        return res.status(400).json({ error: "Invalid JSON in request body" });
      }
    }
    
    // Validate login data
    const loginSchema = z.object({
      email: z.string().email("Email inválido"),
      password: z.string().min(1, "Password requerido")
    });
    
    let loginData;
    try {
      loginData = loginSchema.parse(body);
    } catch (validationError) {
      return res.status(400).json({ 
        error: "Datos inválidos", 
        details: validationError.errors || validationError.message
      });
    }

    console.log('✅ Login data validated:', { email: loginData.email });

    // Query database
    try {
      const teacherResults = await db
        .select()
        .from(teachersSchema)
        .where(eq(teachersSchema.email, loginData.email))
        .limit(1);

      console.log('📊 Teacher query result count:', teacherResults.length);
      
      const [teacher] = teacherResults;
      
      if (!teacher) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // Check password (plain text for now)
      if (teacher.password !== loginData.password) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // Check if teacher is active
      if (!teacher.isActive) {
        return res.status(401).json({ error: "Cuenta desactivada" });
      }

      // Update last login
      await db.update(teachersSchema)
        .set({ lastLogin: new Date() })
        .where(eq(teachersSchema.id, teacher.id));

      // Generate session token
      const sessionToken = `teacher_${teacher.id}_${Date.now()}`;
      
      // Remove password from response
      const { password, ...teacherResponse } = teacher;
      
      return res.status(200).json({ 
        teacher: teacherResponse, 
        token: sessionToken,
        message: "Inicio de sesión exitoso" 
      });
      
    } catch (dbError) {
      console.error('❌ Database error:', dbError);
      return res.status(500).json({ 
        error: "Error de base de datos",
        message: dbError.message
      });
    }

  } catch (error) {
    console.error('❌ Handler error:', error);
    
    return res.status(500).json({ 
      error: "Error interno del servidor",
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

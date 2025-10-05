import { drizzle } from 'drizzle-orm/libsql';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { createClient } from '@libsql/client';
import ws from "ws";
import * as schema from "../shared/schema";
import { config } from "./config";

// Initialize database based on DATABASE_URL
let db: any;
let pool: Pool | undefined;

if (config.DATABASE_URL.startsWith('file:') || config.DATABASE_URL.includes('.sqlite')) {
  // SQLite database for development using libsql
  const client = createClient({
    url: config.DATABASE_URL,
  });
  db = drizzle(client, { schema });
  
  console.log('🗄️  Using SQLite database for development');
} else {
  // PostgreSQL/Neon database for production
  try {
    // Configuración simple para Neon
    neonConfig.webSocketConstructor = ws;
    
    // Usar cliente directo en lugar de pool para debug
    const client = new Pool({
      connectionString: config.DATABASE_URL,
      max: 1, // Solo una conexión para debug
      idleTimeoutMillis: 10000,
    });
    
    db = drizzleNeon(client, { schema });
    pool = client;
    
    console.log('🗄️  Using PostgreSQL/Neon database');
    console.log('🔗 Connection string format:', config.DATABASE_URL.replace(/:[^:]*@/, ':***@'));
  } catch (error) {
    console.error('❌ Error connecting to Neon database:', error);
    throw error;
  }
}

export { db };

// Graceful shutdown
let isShuttingDown = false;

const gracefulShutdown = async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log('Closing database connection...');
  if (pool) {
    try {
      await pool.end();
    } catch (error) {
      console.error('Error closing pool:', error);
    }
  }
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
export default async function handler(req: any, res: any) {
  try {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    console.log(`💬 Chat handler called, method: ${req.method}`);

    // Initialize database services
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    const { eq, desc, and } = await import('drizzle-orm');
    const ws = await import('ws');

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

    // Define schema inline
    const { pgTable, text, timestamp, boolean } = await import('drizzle-orm/pg-core');
    const { nanoid } = await import('nanoid');
    
    // Chat messages table
    const chatMessages = pgTable('chat_messages', {
      id: text('id').primaryKey(),
      studentId: text('student_id').notNull(),
      teacherId: text('teacher_id').notNull(),
      message: text('message').notNull(),
      sender: text('sender').notNull(), // 'teacher' or 'student' or 'ai'
      isAiResponse: boolean('is_ai_response').default(false),
      createdAt: timestamp('created_at').defaultNow(),
    });

    if (req.method === 'GET') {
      // Get chat history
      const { studentId, teacherId } = req.query;

      if (!studentId) {
        return res.status(400).json({ error: "Student ID is required" });
      }

      let query = db.select()
        .from(chatMessages)
        .where(eq(chatMessages.studentId, studentId))
        .orderBy(desc(chatMessages.createdAt));

      if (teacherId) {
        query = db.select()
          .from(chatMessages)
          .where(and(
            eq(chatMessages.studentId, studentId),
            eq(chatMessages.teacherId, teacherId)
          ))
          .orderBy(desc(chatMessages.createdAt));
      }

      const messages = await query.limit(50);

      return res.status(200).json({
        studentId,
        teacherId: teacherId || null,
        messages: messages.reverse(), // Show oldest first
        messageCount: messages.length
      });

    } else if (req.method === 'POST') {
      // Send new message
      const { studentId, teacherId, message, sender, isAiAssisted } = req.body;

      if (!studentId || !message || !sender) {
        return res.status(400).json({ 
          error: "Missing required fields", 
          required: ["studentId", "message", "sender"] 
        });
      }

      if (!['teacher', 'student', 'ai'].includes(sender)) {
        return res.status(400).json({ 
          error: "Invalid sender", 
          allowedValues: ["teacher", "student", "ai"] 
        });
      }

      const messageData = {
        id: nanoid(),
        studentId,
        teacherId: teacherId || 'system',
        message,
        sender,
        isAiResponse: sender === 'ai' || isAiAssisted || false,
        createdAt: new Date()
      };

      try {
        // Insert message
        const insertResult = await db.insert(chatMessages)
          .values(messageData)
          .returning();

        const savedMessage = insertResult[0];

        console.log(`💬 Message sent from ${sender} for student ${studentId}`);

        // If this is a student message, generate AI response
        let aiResponse: any = null;
        if (sender === 'student' && isAiAssisted) {
          const aiResponseText = generateAIResponse(message);
          
          const aiMessageData = {
            id: nanoid(),
            studentId,
            teacherId: teacherId || 'system',
            message: aiResponseText,
            sender: 'ai',
            isAiResponse: true,
            createdAt: new Date()
          };

          const aiInsertResult = await db.insert(chatMessages)
            .values(aiMessageData)
            .returning();

          aiResponse = aiInsertResult[0];

          console.log(`🤖 AI response generated for student ${studentId}`);
        }

        return res.status(201).json({
          message: "Message sent successfully",
          sentMessage: savedMessage,
          aiResponse: aiResponse,
          conversation: {
            studentId,
            teacherId: teacherId || 'system'
          }
        });

      } catch (dbError) {
        console.error('❌ Database error saving message:', dbError);
        return res.status(500).json({ 
          error: "Failed to save message", 
          message: dbError.message 
        });
      }

    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (error) {
    console.error('❌ Chat handler error:', error);
    
    return res.status(500).json({ 
      error: "Error processing chat request",
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Simple AI response generator (replace with real AI integration)
function generateAIResponse(userMessage: string): string {
  const responses = [
    "Entiendo tu pregunta. ¿Podrías darme más detalles sobre lo que necesitas?",
    "Excelente pregunta. Te ayudo a pensar en esto paso a paso...",
    "Esa es una buena observación. ¿Qué te parece si exploramos esta idea juntos?",
    "Me parece que estás en el camino correcto. ¿Qué más puedes decirme?",
    "Interesante punto de vista. ¿Has considerado también...?",
    "Te felicito por hacer esa pregunta. Vamos a analizarlo juntos.",
  ];

  // Simple keyword-based responses
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('ayuda') || lowerMessage.includes('help')) {
    return "Por supuesto, estoy aquí para ayudarte. ¿En qué área específica necesitas apoyo?";
  }
  
  if (lowerMessage.includes('no entiendo') || lowerMessage.includes('confundido')) {
    return "No te preocupes, es normal sentirse confundido a veces. ¿Qué parte específica te resulta más difícil?";
  }
  
  if (lowerMessage.includes('gracias') || lowerMessage.includes('thank')) {
    return "¡De nada! Me alegra poder ayudarte. ¿Hay algo más en lo que pueda apoyarte?";
  }

  // Return random response
  return responses[Math.floor(Math.random() * responses.length)];
}

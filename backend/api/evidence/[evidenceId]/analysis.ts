export default async function handler(req: any, res: any) {
  try {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // Get evidence ID from query parameters or handle general analysis routes
    const { evidenceId } = req.query;
    
    if (!evidenceId) {
      return res.status(400).json({ error: "Evidence ID is required" });
    }

    console.log(`🔍 Analysis request for evidence ${evidenceId}, method: ${req.method}`);

    // Initialize database services
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    const { eq, and } = await import('drizzle-orm');
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
    const { pgTable, text, timestamp, integer, boolean, real } = await import('drizzle-orm/pg-core');
    const { nanoid } = await import('nanoid');
    
    const evidence = pgTable('evidence', {
      id: text('id').primaryKey(),
      studentId: text('student_id').notNull(),
      taskTitle: text('task_title').notNull(),
      subject: text('subject').notNull(),
      completionDate: timestamp('completion_date').defaultNow(),
      evidenceType: text('evidence_type').notNull(),
      fileName: text('file_name'),
      filePath: text('file_path'),
      fileSize: integer('file_size'),
      standardRubric: text('standard_rubric').notNull(),
      evaluatedCompetencies: text('evaluated_competencies').notNull(),
      originalInstructions: text('original_instructions').notNull(),
      timeSpent: integer('time_spent'),
      reportedDifficulties: text('reported_difficulties'),
      isAnalyzed: boolean('is_analyzed').default(false),
      createdAt: timestamp('created_at').defaultNow(),
    });

    const analysisResults = pgTable('analysis_results', {
      id: text('id').primaryKey(),
      evidenceId: text('evidence_id').notNull(),
      studentId: text('student_id').notNull(),
      domainCompetencies: text('domain_competencies').notNull(),
      achievementLevel: text('achievement_level').notNull(),
      strengthsIdentified: text('strengths_identified').notNull(),
      areasForImprovement: text('areas_for_improvement').notNull(),
      cognitivePatternsObserved: text('cognitive_patterns_observed').notNull(),
      strategicRecommendations: text('strategic_recommendations').notNull(),
      confidenceScore: real('confidence_score').notNull(),
      aiModelUsed: text('ai_model_used').notNull(),
      createdAt: timestamp('created_at').defaultNow(),
    });

    if (req.method === 'GET') {
      // Get analysis results for specific evidence
      const results = await db.select()
        .from(analysisResults)
        .where(eq(analysisResults.evidenceId, evidenceId));

      return res.status(200).json({
        evidenceId,
        hasAnalysis: results.length > 0,
        analysisResults: results
      });

    } else if (req.method === 'POST') {
      // Generate new analysis for evidence
      
      // First get evidence details
      const evidenceResult = await db.select()
        .from(evidence)
        .where(eq(evidence.id, evidenceId))
        .limit(1);

      if (evidenceResult.length === 0) {
        return res.status(404).json({ error: "Evidence not found" });
      }

      const evidenceData = evidenceResult[0];

      // Check if analysis already exists
      const existingAnalysis = await db.select()
        .from(analysisResults)
        .where(eq(analysisResults.evidenceId, evidenceId))
        .limit(1);

      if (existingAnalysis.length > 0) {
        return res.status(409).json({ 
          error: "Analysis already exists", 
          analysis: existingAnalysis[0] 
        });
      }

      // Generate AI analysis (simplified version)
      const aiAnalysis = {
        domainCompetencies: "Competencias en " + evidenceData.subject + " - " + evidenceData.evaluatedCompetencies,
        achievementLevel: "Nivel Satisfactorio - Cumple con los objetivos esperados",
        strengthsIdentified: "Creatividad en la resolución, organización del trabajo, comprensión de conceptos",
        areasForImprovement: "Precisión en detalles, gestión del tiempo, explicación de procesos",
        cognitivePatternsObserved: "Pensamiento secuencial, preferencia por ejemplos visuales, procesamiento analítico",
        strategicRecommendations: "Reforzar práctica con ejercicios similares, usar organizadores gráficos, proporcionar feedback específico",
        confidenceScore: 0.78,
        aiModelUsed: "FlexiAdapt-Analysis-v1.0"
      };

      const analysisData = {
        id: nanoid(),
        evidenceId: evidenceId,
        studentId: evidenceData.studentId,
        ...aiAnalysis,
        createdAt: new Date()
      };

      try {
        // Insert analysis
        const insertResult = await db.insert(analysisResults)
          .values(analysisData)
          .returning();

        // Mark evidence as analyzed
        await db.update(evidence)
          .set({ isAnalyzed: true })
          .where(eq(evidence.id, evidenceId));

        const analysis = insertResult[0];

        console.log(`✅ Analysis completed for evidence ${evidenceData.taskTitle}`);

        return res.status(201).json({
          message: "Análisis completado exitosamente",
          analysis,
          evidence: evidenceData,
          aiAnalysis
        });

      } catch (dbError) {
        console.error('❌ Database error creating analysis:', dbError);
        return res.status(500).json({ 
          error: "Failed to save analysis", 
          message: dbError.message 
        });
      }

    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (error) {
    console.error('❌ Evidence analysis handler error:', error);
    
    return res.status(500).json({ 
      error: "Error processing analysis request",
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

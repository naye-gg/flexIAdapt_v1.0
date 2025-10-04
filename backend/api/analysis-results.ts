export default async function handler(req: any, res: any) {
  try {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    console.log(`📊 Analysis results handler, method: ${req.method}`);

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
    const { pgTable, text, timestamp, real } = await import('drizzle-orm/pg-core');
    const { nanoid } = await import('nanoid');
    
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

    const evidence = pgTable('evidence', {
      id: text('id').primaryKey(),
      studentId: text('student_id').notNull(),
      taskTitle: text('task_title').notNull(),
      subject: text('subject').notNull(),
      completionDate: timestamp('completion_date').defaultNow(),
      evidenceType: text('evidence_type').notNull(),
      fileName: text('file_name'),
      filePath: text('file_path'),
      fileSize: real('file_size'),
      standardRubric: text('standard_rubric').notNull(),
      evaluatedCompetencies: text('evaluated_competencies').notNull(),
      originalInstructions: text('original_instructions').notNull(),
      timeSpent: real('time_spent'),
      reportedDifficulties: text('reported_difficulties'),
      isAnalyzed: real('is_analyzed'),
      createdAt: timestamp('created_at').defaultNow(),
    });

    if (req.method === 'GET') {
      const { studentId, evidenceId } = req.query;

      // Build query conditions
      const conditions: any[] = [];
      
      if (studentId) {
        conditions.push(eq(analysisResults.studentId, studentId));
      }
      
      if (evidenceId) {
        conditions.push(eq(analysisResults.evidenceId, evidenceId));
      }

      // Execute query
      const baseQuery = db.select().from(analysisResults);
      const finalQuery = conditions.length > 0 
        ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
        : baseQuery;

      const results = await finalQuery.orderBy(desc(analysisResults.createdAt)).limit(50);

      // Process results - they're already flat from direct table query
      const processedResults = results;

      return res.status(200).json({
        studentId: studentId || null,
        evidenceId: evidenceId || null,
        results: processedResults,
        totalResults: processedResults.length,
        summary: {
          totalAnalysis: processedResults.length,
          averageConfidence: processedResults.length > 0 
            ? processedResults.reduce((sum, r) => sum + r.confidenceScore, 0) / processedResults.length 
            : 0,
          achievementLevels: [...new Set(processedResults.map(r => r.achievementLevel))],
          modelsUsed: [...new Set(processedResults.map(r => r.aiModelUsed))]
        }
      });

    } else if (req.method === 'POST') {
      // Create new analysis result
      const {
        evidenceId,
        studentId,
        domainCompetencies,
        achievementLevel,
        strengthsIdentified,
        areasForImprovement,
        cognitivePatternsObserved,
        strategicRecommendations,
        confidenceScore,
        aiModelUsed
      } = req.body;

      if (!evidenceId || !studentId || !domainCompetencies || !achievementLevel) {
        return res.status(400).json({ 
          error: "Missing required fields",
          required: ["evidenceId", "studentId", "domainCompetencies", "achievementLevel"]
        });
      }

      // Check if analysis already exists for this evidence
      const existingAnalysis = await db.select()
        .from(analysisResults)
        .where(eq(analysisResults.evidenceId, evidenceId))
        .limit(1);

      if (existingAnalysis.length > 0) {
        return res.status(409).json({ 
          error: "Analysis already exists for this evidence",
          existingAnalysis: existingAnalysis[0]
        });
      }

      const analysisData = {
        id: nanoid(),
        evidenceId,
        studentId,
        domainCompetencies,
        achievementLevel,
        strengthsIdentified: strengthsIdentified || "Análisis en progreso",
        areasForImprovement: areasForImprovement || "Pendiente de evaluación",
        cognitivePatternsObserved: cognitivePatternsObserved || "Patrones por identificar",
        strategicRecommendations: strategicRecommendations || "Recomendaciones por generar",
        resourcesAndTools: "Organizadores gráficos, material manipulativo, tecnología educativa",
        confidenceScore: confidenceScore || 0.5,
        aiModelUsed: aiModelUsed || "FlexiAdapt-Analysis-v1.0",
        createdAt: new Date()
      };

      try {
        const insertResult = await db.insert(analysisResults)
          .values(analysisData)
          .returning();

        const analysis = insertResult[0];

        console.log(`📊 Analysis result created for evidence ${evidenceId}`);

        return res.status(201).json({
          message: "Resultado de análisis creado exitosamente",
          analysis,
          evidenceId,
          studentId
        });

      } catch (dbError) {
        console.error('❌ Database error creating analysis result:', dbError);
        return res.status(500).json({ 
          error: "Failed to save analysis result", 
          message: dbError.message 
        });
      }

    } else if (req.method === 'PUT') {
      // Update existing analysis result
      const { analysisId } = req.query;
      
      if (!analysisId) {
        return res.status(400).json({ error: "Analysis ID is required for updates" });
      }

      const updateData = req.body;

      try {
        const updateResult = await db.update(analysisResults)
          .set(updateData)
          .where(eq(analysisResults.id, analysisId))
          .returning();

        if (updateResult.length === 0) {
          return res.status(404).json({ error: "Analysis result not found" });
        }

        const analysis = updateResult[0];

        console.log(`📊 Analysis result ${analysisId} updated`);

        return res.status(200).json({
          message: "Resultado de análisis actualizado",
          analysis
        });

      } catch (dbError) {
        console.error('❌ Database error updating analysis result:', dbError);
        return res.status(500).json({ 
          error: "Failed to update analysis result", 
          message: dbError.message 
        });
      }

    } else if (req.method === 'DELETE') {
      // Delete analysis result
      const { analysisId } = req.query;
      
      if (!analysisId) {
        return res.status(400).json({ error: "Analysis ID is required for deletion" });
      }

      try {
        const deleteResult = await db.delete(analysisResults)
          .where(eq(analysisResults.id, analysisId))
          .returning();

        if (deleteResult.length === 0) {
          return res.status(404).json({ error: "Analysis result not found" });
        }

        console.log(`📊 Analysis result ${analysisId} deleted`);

        return res.status(200).json({
          message: "Resultado de análisis eliminado",
          deletedAnalysis: deleteResult[0]
        });

      } catch (dbError) {
        console.error('❌ Database error deleting analysis result:', dbError);
        return res.status(500).json({ 
          error: "Failed to delete analysis result", 
          message: dbError.message 
        });
      }

    } else {
      return res.status(405).json({ error: "Method not allowed" });
    }

  } catch (error) {
    console.error('❌ Analysis results handler error:', error);
    
    return res.status(500).json({ 
      error: "Error processing analysis results request",
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

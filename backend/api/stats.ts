export default async function handler(req: any, res: any) {
  try {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    console.log('📊 Stats endpoint called');

    // Initialize database services
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
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

    // Define schema inline matching the real database structure
    const { pgTable, text, timestamp, boolean, integer, real } = await import('drizzle-orm/pg-core');
    
    const students = pgTable('students', {
      id: text('id').primaryKey(),
      teacherId: text('teacher_id').notNull(),
      name: text('name').notNull(),
      age: integer('age').notNull(),
      grade: text('grade').notNull(),
      mainSubjects: text('main_subjects').notNull(),
      specialNeeds: text('special_needs'),
      createdAt: timestamp('created_at').defaultNow(),
      updatedAt: timestamp('updated_at').defaultNow(),
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
      fileSize: integer('file_size'),
      standardRubric: text('standard_rubric').notNull(),
      evaluatedCompetencies: text('evaluated_competencies').notNull(),
      originalInstructions: text('original_instructions').notNull(),
      timeSpent: integer('time_spent'),
      reportedDifficulties: text('reported_difficulties'),
      isAnalyzed: boolean('is_analyzed').default(false),
      createdAt: timestamp('created_at').defaultNow(),
    });

    const learningProfiles = pgTable('learning_profiles', {
      id: text('id').primaryKey(),
      studentId: text('student_id').notNull(),
      dominantLearningPattern: text('dominant_learning_pattern').notNull(),
      cognitiveStrengths: text('cognitive_strengths').notNull(),
      learningChallenges: text('learning_challenges').notNull(),
      motivationalFactors: text('motivational_factors').notNull(),
      recommendedTeachingApproaches: text('recommended_teaching_approaches').notNull(),
      assessmentRecommendations: text('assessment_recommendations').notNull(),
      resourcesAndTools: text('resources_and_tools').notNull(),
      confidenceLevel: real('confidence_level').notNull(),
      createdAt: timestamp('created_at').defaultNow(),
      updatedAt: timestamp('updated_at').defaultNow(),
    });

    // Get all data for stats - filtered by teacher
    const { eq } = await import('drizzle-orm');
    
    // Extract teacher ID from Authorization header
    const authHeader = req.headers.authorization || '';
    const teacherId = authHeader.startsWith('teacher_') ? authHeader.split('_')[1] : null;
    
    if (!teacherId) {
      return res.status(401).json({ error: 'Invalid or missing authorization' });
    }

    console.log('🔵 Stats Extracted teacherId:', teacherId);

    const studentsResult = await db.select().from(students).where(eq(students.teacherId, teacherId));
    const studentIds = studentsResult.map(s => s.id);
    
    // Get evidence for all students of the teacher
    let evidenceResult: any[] = [];
    if (studentIds.length > 0) {
      for (const studentId of studentIds) {
        const studentEvidence = await db.select().from(evidence).where(eq(evidence.studentId, studentId));
        evidenceResult.push(...studentEvidence);
      }
    }
    
    // Get learning profiles for the teacher's students  
    let profilesResult: any[] = [];
    if (studentIds.length > 0) {
      for (const studentId of studentIds) {
        const studentProfiles = await db.select().from(learningProfiles).where(eq(learningProfiles.studentId, studentId));
        profilesResult.push(...studentProfiles);
      }
    }
    
    console.log('📊 Raw stats data:', { 
      students: studentsResult.length, 
      evidence: evidenceResult.length,
      profiles: profilesResult.length,
      studentIds: studentIds,
      teacherId: teacherId
    });

    const totalStudents = studentsResult.length;
    const totalEvidence = evidenceResult.length;
    const analyzedEvidence = evidenceResult.filter((e: any) => e.isAnalyzed).length;
    const profilesGenerated = profilesResult.length; // Contar perfiles generados con IA
    const pendingEvidence = evidenceResult.filter((e: any) => !e.isAnalyzed).length;

    // Generate modalityBreakdown based on analysis results
    let modalityBreakdown: Array<{name: string; percentage: number}> | null = null;
    
    if (analyzedEvidence > 0) {
      // For demo purposes, provide sample data based on analyzed evidence
      modalityBreakdown = [
        { name: 'Visual', percentage: 35 },
        { name: 'Auditiva', percentage: 25 },
        { name: 'Kinestésica', percentage: 40 }
      ];
      console.log('📊 Setting modalityBreakdown with analyzedEvidence:', analyzedEvidence, modalityBreakdown);
    } else {
      console.log('📊 No analyzed evidence, modalityBreakdown remains null');
    }    const stats = {
      totalStudents,
      analyzedEvidence,
      profilesGenerated,
      pendingReview: pendingEvidence,
      modalityBreakdown,
      analysisProgress: totalEvidence > 0 ? Math.round((analyzedEvidence / totalEvidence) * 100) : 0
    };

    console.log('✅ Stats response:', stats);
    return res.status(200).json(stats);

  } catch (error) {
    console.error('❌ Stats handler error:', error);
    
    return res.status(500).json({ 
      error: "Error fetching stats",
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

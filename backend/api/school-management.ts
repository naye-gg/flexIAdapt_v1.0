export default async function handler(req: any, res: any) {
  try {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    console.log(`🏫 School management handler called`);

    // Initialize database services
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    const { eq, count, sql } = await import('drizzle-orm');
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
    
    const teachers = pgTable('teachers', {
      id: text('id').primaryKey(),
      name: text('name').notNull(),
      email: text('email').notNull(),
      password: text('password').notNull(),
      specialization: text('specialization'),
      school: text('school'),
      experience: integer('experience'),
      createdAt: timestamp('created_at').defaultNow(),
    });

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

    // Get comprehensive system statistics
    const [
      totalTeachers,
      totalStudents,
      totalEvidence,
      analyzedEvidence,
      totalProfiles,
      totalAnalysisResults
    ] = await Promise.all([
      db.select({ count: count() }).from(teachers),
      db.select({ count: count() }).from(students),
      db.select({ count: count() }).from(evidence),
      db.select({ count: count() }).from(evidence).where(eq(evidence.isAnalyzed, true)),
      db.select({ count: count() }).from(learningProfiles),
      db.select({ count: count() }).from(analysisResults)
    ]);

    // Get recent activity (last 10 students, evidence, etc.)
    const recentStudents = await db.select({
      id: students.id,
      name: students.name,
      grade: students.grade,
      createdAt: students.createdAt
    }).from(students).orderBy(sql`${students.createdAt} DESC`).limit(5);

    const recentEvidence = await db.select({
      id: evidence.id,
      taskTitle: evidence.taskTitle,
      subject: evidence.subject,
      isAnalyzed: evidence.isAnalyzed,
      createdAt: evidence.createdAt
    }).from(evidence).orderBy(sql`${evidence.createdAt} DESC`).limit(5);

    const recentProfiles = await db.select({
      id: learningProfiles.id,
      studentId: learningProfiles.studentId,
      dominantLearningPattern: learningProfiles.dominantLearningPattern,
      confidenceLevel: learningProfiles.confidenceLevel,
      createdAt: learningProfiles.createdAt
    }).from(learningProfiles).orderBy(sql`${learningProfiles.createdAt} DESC`).limit(5);

    // Calculate system health metrics
    const analysisRate = totalEvidence[0].count > 0 
      ? (analyzedEvidence[0].count / totalEvidence[0].count) * 100 
      : 0;

    const profileCoverage = totalStudents[0].count > 0 
      ? (totalProfiles[0].count / totalStudents[0].count) * 100 
      : 0;

    console.log(`🏫 System stats retrieved: ${totalStudents[0].count} students, ${totalEvidence[0].count} evidence`);

    return res.status(200).json({
      message: "FlexiAdapt System Status",
      systemHealth: {
        status: "operational",
        analysisRate: Math.round(analysisRate),
        profileCoverage: Math.round(profileCoverage),
        totalUsers: totalTeachers[0].count + totalStudents[0].count
      },
      statistics: {
        teachers: totalTeachers[0].count,
        students: totalStudents[0].count,
        evidence: totalEvidence[0].count,
        analyzedEvidence: analyzedEvidence[0].count,
        learningProfiles: totalProfiles[0].count,
        analysisResults: totalAnalysisResults[0].count
      },
      recentActivity: {
        students: recentStudents,
        evidence: recentEvidence,
        profiles: recentProfiles
      },
      apiEndpoints: {
        authentication: "/api/auth/login",
        dashboard: "/api/stats",
        students: "/api/students",
        evidence: "/api/evidence",
        chat: "/api/chat",
        upload: "/api/upload",
        analysisResults: "/api/analysis-results"
      },
      features: {
        aiProfileGeneration: true,
        evidenceAnalysis: true,
        teacherPerspectives: true,
        studentChat: true,
        fileUpload: true,
        realTimeStats: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ School management handler error:', error);
    
    return res.status(500).json({ 
      error: "Error retrieving system information",
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

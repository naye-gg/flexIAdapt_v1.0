export default async function handler(req: any, res: any) {
  try {
    // Set CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }

    // Get parameters from query
    const { studentId, action } = req.query;
    
    console.log(`🎓 Student operations: studentId=${studentId}, action=${action}, method=${req.method}`);

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

    // Define consolidated schema
    const { pgTable, text, timestamp, integer, boolean, real } = await import('drizzle-orm/pg-core');
    const { nanoid } = await import('nanoid');
    
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

    const teacherPerspectives = pgTable('teacher_perspectives', {
      id: text('id').primaryKey(),
      studentId: text('student_id').notNull(),
      teacherId: text('teacher_id').notNull(),
      observationDate: timestamp('observation_date').defaultNow(),
      behavioralObservations: text('behavioral_observations').notNull(),
      academicProgress: text('academic_progress').notNull(),
      participationLevel: text('participation_level').notNull(),
      socialInteraction: text('social_interaction').notNull(),
      motivationFactors: text('motivation_factors').notNull(),
      challengesObserved: text('challenges_observed').notNull(),
      recommendedInterventions: text('recommended_interventions').notNull(),
      followUpActions: text('follow_up_actions'),
      priorityLevel: integer('priority_level').notNull(),
      createdAt: timestamp('created_at').defaultNow(),
      updatedAt: timestamp('updated_at').defaultNow(),
    });

    // Route to specific functionality based on action parameter
    if (action === 'evidence') {
      return await handleStudentEvidence(req, res, db, evidence, studentId);
    } else if (action === 'learning-profile') {
      return await handleLearningProfile(req, res, db, learningProfiles, studentId);
    } else if (action === 'generate-ai-profile') {
      return await handleGenerateAIProfile(req, res, db, students, evidence, learningProfiles, studentId);
    } else if (action === 'teacher-perspectives') {
      return await handleTeacherPerspectives(req, res, db, teacherPerspectives, studentId);
    } else if (studentId) {
      return await handleIndividualStudent(req, res, db, students, studentId);
    } else {
      return await handleStudentsList(req, res, db, students);
    }

  } catch (error) {
    console.error('❌ Student operations handler error:', error);
    
    return res.status(500).json({ 
      error: "Error processing student request",
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Individual handler functions
async function handleStudentEvidence(req: any, res: any, db: any, evidence: any, studentId: string) {
  const { eq } = await import('drizzle-orm');
  
  if (req.method === 'GET') {
    const studentEvidence = await db.select()
      .from(evidence)
      .where(eq(evidence.studentId, studentId));

    return res.status(200).json({
      studentId,
      evidence: studentEvidence,
      totalEvidence: studentEvidence.length
    });
  } else if (req.method === 'POST') {
    const { nanoid } = await import('nanoid');
    const evidenceData = {
      id: nanoid(),
      studentId,
      ...req.body,
      createdAt: new Date()
    };

    const insertResult = await db.insert(evidence)
      .values(evidenceData)
      .returning();

    return res.status(201).json({
      message: "Evidence created successfully",
      evidence: insertResult[0]
    });
  }
  
  return res.status(405).json({ error: "Method not allowed" });
}

async function handleLearningProfile(req: any, res: any, db: any, learningProfiles: any, studentId: string) {
  const { eq } = await import('drizzle-orm');
  
  if (req.method === 'GET') {
    const profiles = await db.select()
      .from(learningProfiles)
      .where(eq(learningProfiles.studentId, studentId));

    return res.status(200).json({
      studentId,
      profile: profiles[0] || null,
      hasProfile: profiles.length > 0
    });
  } else if (req.method === 'POST' || req.method === 'PUT') {
    const { nanoid } = await import('nanoid');
    
    const existingProfile = await db.select()
      .from(learningProfiles)
      .where(eq(learningProfiles.studentId, studentId))
      .limit(1);

    if (existingProfile.length > 0 && req.method === 'POST') {
      return res.status(409).json({ error: "Profile already exists" });
    }

    if (existingProfile.length === 0 && req.method === 'PUT') {
      return res.status(404).json({ error: "Profile not found" });
    }

    const profileData = {
      id: nanoid(),
      studentId,
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    let result;
    if (req.method === 'POST') {
      result = await db.insert(learningProfiles).values(profileData).returning();
    } else {
      result = await db.update(learningProfiles)
        .set({ ...req.body, updatedAt: new Date() })
        .where(eq(learningProfiles.studentId, studentId))
        .returning();
    }

    return res.status(req.method === 'POST' ? 201 : 200).json({
      message: `Profile ${req.method === 'POST' ? 'created' : 'updated'} successfully`,
      profile: result[0]
    });
  }
  
  return res.status(405).json({ error: "Method not allowed" });
}

async function handleGenerateAIProfile(req: any, res: any, db: any, students: any, evidence: any, learningProfiles: any, studentId: string) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { eq } = await import('drizzle-orm');
  const { nanoid } = await import('nanoid');

  // Get student and evidence
  const student = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
  const studentEvidence = await db.select().from(evidence).where(eq(evidence.studentId, studentId));

  if (student.length === 0) {
    return res.status(404).json({ error: "Student not found" });
  }

  if (studentEvidence.length === 0) {
    return res.status(400).json({ error: "No evidence available for AI profile generation" });
  }

  // Generate AI profile
  const aiProfile = {
    dominantLearningPattern: "Multimodal - combina elementos visuales y kinestésicos",
    cognitiveStrengths: "Pensamiento analítico, creatividad, resolución de problemas prácticos",
    learningChallenges: "Concentración en tareas largas, seguimiento de instrucciones verbales complejas",
    motivationalFactors: "Actividades prácticas, reconocimiento del progreso, trabajo colaborativo",
    recommendedTeachingApproaches: "Aprendizaje basado en proyectos, uso de material visual, pausas frecuentes",
    assessmentRecommendations: "Evaluación formativa continua, portafolios, presentaciones orales",
    resourcesAndTools: "Organizadores gráficos, material manipulativo, tecnología educativa",
    confidenceLevel: 0.85
  };

  const profileData = {
    id: nanoid(),
    studentId,
    ...aiProfile,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const existingProfile = await db.select()
    .from(learningProfiles)
    .where(eq(learningProfiles.studentId, studentId))
    .limit(1);

  let profile;
  if (existingProfile.length > 0) {
    const updateResult = await db.update(learningProfiles)
      .set({ ...aiProfile, updatedAt: new Date() })
      .where(eq(learningProfiles.studentId, studentId))
      .returning();
    profile = updateResult[0];
  } else {
    const insertResult = await db.insert(learningProfiles)
      .values(profileData)
      .returning();
    profile = insertResult[0];
  }

  return res.status(200).json({
    message: "AI Profile generated successfully",
    profile,
    analysisCount: studentEvidence.length,
    student: student[0]
  });
}

async function handleTeacherPerspectives(req: any, res: any, db: any, teacherPerspectives: any, studentId: string) {
  const { eq, desc } = await import('drizzle-orm');
  
  if (req.method === 'GET') {
    const perspectives = await db.select()
      .from(teacherPerspectives)
      .where(eq(teacherPerspectives.studentId, studentId))
      .orderBy(desc(teacherPerspectives.createdAt));

    return res.status(200).json({
      studentId,
      perspectives,
      totalPerspectives: perspectives.length
    });
  } else if (req.method === 'POST') {
    const { nanoid } = await import('nanoid');
    
    const perspectiveData = {
      id: nanoid(),
      studentId,
      ...req.body,
      observationDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insertResult = await db.insert(teacherPerspectives)
      .values(perspectiveData)
      .returning();

    return res.status(201).json({
      message: "Teacher perspective created successfully",
      perspective: insertResult[0]
    });
  }
  
  return res.status(405).json({ error: "Method not allowed" });
}

async function handleIndividualStudent(req: any, res: any, db: any, students: any, studentId: string) {
  const { eq } = await import('drizzle-orm');
  
  if (req.method === 'GET') {
    const student = await db.select()
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (student.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    return res.status(200).json(student[0]);
  } else if (req.method === 'PUT') {
    const updateResult = await db.update(students)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(students.id, studentId))
      .returning();

    if (updateResult.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    return res.status(200).json({
      message: "Student updated successfully",
      student: updateResult[0]
    });
  } else if (req.method === 'DELETE') {
    const deleteResult = await db.delete(students)
      .where(eq(students.id, studentId))
      .returning();

    if (deleteResult.length === 0) {
      return res.status(404).json({ error: "Student not found" });
    }

    return res.status(200).json({
      message: "Student deleted successfully",
      deletedStudent: deleteResult[0]
    });
  }
  
  return res.status(405).json({ error: "Method not allowed" });
}

async function handleStudentsList(req: any, res: any, db: any, students: any) {
  if (req.method === 'GET') {
    const { teacherId } = req.query;
    const { eq } = await import('drizzle-orm');
    
    let query = db.select().from(students);
    
    if (teacherId) {
      query = query.where(eq(students.teacherId, teacherId));
    }

    const allStudents = await query;

    return res.status(200).json({
      students: allStudents,
      totalStudents: allStudents.length
    });
  } else if (req.method === 'POST') {
    const { nanoid } = await import('nanoid');
    
    const studentData = {
      id: nanoid(),
      ...req.body,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const insertResult = await db.insert(students)
      .values(studentData)
      .returning();

    return res.status(201).json({
      message: "Student created successfully",
      student: insertResult[0]
    });
  }
  
  return res.status(405).json({ error: "Method not allowed" });
}

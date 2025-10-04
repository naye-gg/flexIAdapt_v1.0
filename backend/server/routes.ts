import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { config } from "./config";
import { uploadConfig, FileService, ensureUploadDir } from "./fileService";
import {
  insertStudentSchema,
  insertTeacherSchema,
  loginTeacherSchema,
  insertTeacherPerspectiveSchema,
  insertEvidenceSchema,
  insertAnalysisResultSchema,
  insertLearningProfileSchema,
  insertStudentChatSchema,
  insertChatMessageSchema,
  evidence,
  teachers,
  students,
  analysisResults,
} from "../shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";
import { z } from "zod";
import { ChatService } from "./chatService";

// Analysis service for AI-powered evaluation
class AnalysisService {
  static async analyzeEvidence(evidenceId: string) {
    try {
      const evidence = await storage.getEvidence(evidenceId);
      if (!evidence || !evidence.studentId) {
        throw new Error('Evidence not found');
      }

      const student = await storage.getStudent(evidence.studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      const perspective = await storage.getTeacherPerspective(evidence.studentId);
      
      // Generate analysis based on evidence and teacher perspective
      const analysis = this.generateAnalysis(evidence, perspective);
      
      // Save analysis result
      const analysisResult = await storage.createAnalysisResult({
        evidenceId: evidence.id,
        adaptedScore: analysis.adaptedScore,
        competencyLevel: analysis.competencyLevel,
        identifiedStrengths: analysis.identifiedStrengths,
        improvementAreas: analysis.improvementAreas,
        successfulModalities: analysis.successfulModalities,
        pedagogicalRecommendations: analysis.pedagogicalRecommendations,
        suggestedAdaptations: analysis.suggestedAdaptations,
        evaluationJustification: analysis.evaluationJustification,
      });

      return analysisResult;
    } catch (error) {
      console.error('Error analyzing evidence:', error);
      throw error;
    }
  }

  private static generateAnalysis(evidence: any, perspective: any) {
    const baseScore = this.calculateAdaptedScore(evidence, perspective);
    const competencyLevel = this.determineCompetencyLevel(baseScore);
    
    return {
      adaptedScore: baseScore,
      competencyLevel,
      identifiedStrengths: this.generateStrengths(evidence, perspective),
      improvementAreas: this.generateImprovementAreas(evidence, perspective),
      successfulModalities: this.determineSuccessfulModalities(perspective),
      pedagogicalRecommendations: this.generatePedagogicalRecommendations(perspective),
      suggestedAdaptations: this.generateSuggestedAdaptations(evidence, perspective),
      evaluationJustification: this.generateEvaluationJustification(evidence, perspective, baseScore)
    };
  }

  private static calculateAdaptedScore(evidence: any, perspective: any): number {
    let baseScore = 75; // Starting score

    // Adjust based on completion time vs concentration time
    if (perspective?.concentrationTime && evidence?.timeSpent) {
      const timeRatio = evidence.timeSpent / perspective.concentrationTime;
      if (timeRatio <= 1) baseScore += 15;
      else if (timeRatio <= 1.5) baseScore += 10;
      else if (timeRatio > 2) baseScore -= 5;
    }

    // Adjust based on evidence type matching preferred modality  
    if (this.evidenceMatchesModality(evidence, perspective)) baseScore += 10;

    return Math.min(100, Math.max(60, baseScore));
  }

  private static evidenceMatchesModality(evidence: any, perspective: any): boolean {
    const modality = perspective?.preferredModality?.toLowerCase();
    const type = evidence?.evidenceType?.toLowerCase();

    return (
      (modality?.includes('visual') && type === 'imagen') ||
      (modality?.includes('auditiva') && type === 'audio') ||
      (modality?.includes('kinestésica') && type === 'video')
    );
  }

  private static determineCompetencyLevel(score: number): string {
    if (score >= 90) return 'Avanzado';
    if (score >= 80) return 'Competente';  
    if (score >= 70) return 'En desarrollo';
    return 'Iniciando';
  }

  private static generateStrengths(evidence: any, perspective: any): string {
    const strengths = [];

    if (perspective?.observedStrengths) {
      strengths.push(`Fortalezas observadas: ${perspective.observedStrengths}`);
    }

    if (evidence?.evidenceType === 'imagen') {
      strengths.push('Excelente representación visual de conceptos');
    } else if (evidence?.evidenceType === 'audio') {
      strengths.push('Comunicación oral clara y estructurada');
    } else if (evidence?.evidenceType === 'video') {
      strengths.push('Integración efectiva de múltiples modalidades');
    }

    return strengths.join('. ') || 'Demuestra comprensión de conceptos básicos';
  }

  private static generateImprovementAreas(evidence: any, perspective: any): string {
    const areas = [];

    if (perspective?.mainDifficulties) {
      areas.push(`Áreas identificadas: ${perspective.mainDifficulties}`);
    }

    if (evidence?.reportedDifficulties) {
      areas.push(`Dificultades reportadas: ${evidence.reportedDifficulties}`);
    }

    return areas.join('. ') || 'Continuar fortaleciendo habilidades desarrolladas';
  }

  private static determineSuccessfulModalities(perspective: any): string {
    const modality = perspective?.preferredModality;
    if (modality) {
      return `Modalidad ${modality.toLowerCase()} muestra mayor efectividad`;
    }
    return 'Evaluar múltiples modalidades para identificar preferencias';
  }

  private static generatePedagogicalRecommendations(perspective: any): string {
    const recommendations = [];

    if (perspective?.effectiveStrategies) {
      recommendations.push(`Continuar con: ${perspective.effectiveStrategies}`);
    }

    if (perspective?.preferredModality?.toLowerCase().includes('visual')) {
      recommendations.push('Incrementar uso de materiales visuales y diagramas');
    } else if (perspective?.preferredModality?.toLowerCase().includes('auditiva')) {
      recommendations.push('Fortalecer actividades de discusión y explicación oral');
    }

    return recommendations.join('. ') || 'Diversificar estrategias pedagógicas según perfil del estudiante';
  }

  private static generateSuggestedAdaptations(evidence: any, perspective: any): string {
    const adaptations = [];

    if (perspective?.instructionNeeds?.includes('Repetidas')) {
      adaptations.push('Proporcionar instrucciones repetidas y claras');
    }

    if (perspective?.instructionNeeds?.includes('Visuales')) {
      adaptations.push('Incluir apoyos visuales en las instrucciones');
    }

    if (perspective?.concentrationTime && perspective.concentrationTime < 20) {
      adaptations.push('Dividir tareas en segmentos cortos');
    }

    return adaptations.join('. ') || 'Mantener estrategias actuales con monitoreo constante';
  }

  private static generateEvaluationJustification(evidence: any, perspective: any, score: number): string {
    return `Evaluación basada en evidencia de tipo ${evidence?.evidenceType}, considerando tiempo invertido (${evidence?.timeSpent || 'N/A'} min), modalidad preferida (${perspective?.preferredModality || 'N/A'}) y perfil individual del estudiante. Puntaje adaptado: ${score}/100`;
  }
}

export function registerRoutes(app: Express): Server {
  const server = createServer(app);

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Authentication routes for teachers
  console.log('🟢 Registering auth routes...');
  
  app.post("/api/auth/register", async (req, res) => {
    console.log('🟢 Register route called');
    try {
      const teacherData = insertTeacherSchema.parse(req.body);
      
      // Check if email already exists
      const existingTeacher = await db.select().from(teachers).where(eq(teachers.email, teacherData.email));
      if (existingTeacher.length > 0) {
        return res.status(400).json({ error: "El email ya está registrado" });
      }

      // Create teacher (password stored as plain text for now - TODO: add hashing)
      const [teacher] = await db.insert(teachers).values({
        email: teacherData.email,
        password: teacherData.password, // TODO: hash password
        name: teacherData.name,
        lastName: teacherData.lastName,
        school: teacherData.school,
        grade: teacherData.grade,
        subject: teacherData.subject,
        phoneNumber: teacherData.phoneNumber,
      }).returning();

      // Remove password from response
      const { password, ...teacherResponse } = teacher;
      res.status(201).json({ teacher: teacherResponse, message: "Profesor registrado exitosamente" });
    } catch (error) {
      console.error('Error registering teacher:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    console.log('🟢 Login route called');
    try {
      console.log('🔵 Login attempt with body:', req.body);
      const loginData = loginTeacherSchema.parse(req.body);
      console.log('🔵 Validated login data:', loginData);
      
      // Find teacher by email
      console.log('🔵 Searching for teacher with email:', loginData.email);
      const teacherResults = await db.select().from(teachers).where(eq(teachers.email, loginData.email));
      console.log('🔵 Database results:', teacherResults);
      
      const [teacher] = teacherResults;
      if (!teacher) {
        console.log('❌ No teacher found with email:', loginData.email);
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // Check password (plain text comparison for now - TODO: use hash comparison)
      if (teacher.password !== loginData.password) {
        return res.status(401).json({ error: "Credenciales inválidas" });
      }

      // Check if teacher is active
      if (!teacher.isActive) {
        return res.status(401).json({ error: "Cuenta desactivada" });
      }

      // Update last login
      await db.update(teachers)
        .set({ lastLogin: new Date() })
        .where(eq(teachers.id, teacher.id));

      // Remove password from response
      const { password, ...teacherResponse } = teacher;
      
      // TODO: Generate JWT token
      const sessionToken = `teacher_${teacher.id}_${Date.now()}`;
      
      res.json({ 
        teacher: teacherResponse, 
        token: sessionToken,
        message: "Inicio de sesión exitoso" 
      });
    } catch (error) {
      console.error('❌ Error during login:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      if (error instanceof z.ZodError) {
        console.log('❌ Validation error details:', error.errors);
        return res.status(400).json({ error: "Datos inválidos", details: error.errors });
      }
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('teacher_')) {
        return res.status(401).json({ error: "Token no válido" });
      }

      // Extract teacher ID from simple token (TODO: use proper JWT)
      const tokenParts = authHeader.split('_');
      if (tokenParts.length < 2) {
        return res.status(401).json({ error: "Token malformado" });
      }
      
      const teacherId = tokenParts[1];
      const [teacher] = await db.select().from(teachers).where(eq(teachers.id, teacherId));
      
      if (!teacher || !teacher.isActive) {
        return res.status(401).json({ error: "Profesor no encontrado" });
      }

      // Remove password from response
      const { password, ...teacherResponse } = teacher;
      res.json({ teacher: teacherResponse });
    } catch (error) {
      console.error('Error fetching teacher profile:', error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Students routes (filtered by teacher)
  app.get("/api/students", async (req, res) => {
    try {
      // Get teacher ID from authorization header
      const authHeader = req.headers.authorization;
      console.log('🔵 Auth header:', authHeader);
      if (!authHeader || !authHeader.startsWith('teacher_')) {
        return res.status(401).json({ error: "Autorización requerida" });
      }

      // Token format: teacher_TEACHERID_TIMESTAMP
      const parts = authHeader.split('_');
      const teacherId = parts.slice(1, -1).join('_'); // Get everything between teacher_ and _timestamp
      console.log('🔵 Extracted teacherId:', teacherId);
      
      // Get students for this teacher only
      const teacherStudents = await db.select().from(students).where(eq(students.teacherId, teacherId));
      console.log('🔵 Found students:', teacherStudents.length, teacherStudents);
      
      // Disable caching for this response
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      res.json(teacherStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:id", async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error('Error fetching student:', error);
      res.status(500).json({ error: "Failed to fetch student" });
    }
  });

  app.post("/api/students", async (req, res) => {
    try {
      // Get teacher ID from authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('teacher_')) {
        return res.status(401).json({ error: "Autorización requerida" });
      }

      // Parse teacher ID from token format: teacher_teacherId_timestamp
      const tokenParts = authHeader.split('_');
      const teacherId = tokenParts.slice(1, -1).join('_'); // Get everything between "teacher_" and timestamp
      console.log('🔵 Extracted teacherId from token:', teacherId);
      console.log('🔵 Full token:', authHeader);
      
      // Validate and add teacherId to student data
      const validatedData = insertStudentSchema.parse({
        ...req.body,
        teacherId
      });
      
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error('Error creating student:', error);
      res.status(500).json({ error: "Failed to create student" });
    }
  });

  app.put("/api/students/:id", async (req, res) => {
    try {
      const validatedData = insertStudentSchema.partial().parse(req.body);
      const student = await storage.updateStudent(req.params.id, validatedData);
      res.json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error('Error updating student:', error);
      res.status(500).json({ error: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", async (req, res) => {
    try {
      await storage.deleteStudent(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({ error: "Failed to delete student" });
    }
  });

  // Teacher perspectives routes
  app.get("/api/students/:studentId/perspective", async (req, res) => {
    try {
      const perspective = await storage.getTeacherPerspective(req.params.studentId);
      if (!perspective) {
        return res.status(404).json({ error: "Teacher perspective not found" });
      }
      res.json(perspective);
    } catch (error) {
      console.error('Error fetching teacher perspective:', error);
      res.status(500).json({ error: "Failed to fetch teacher perspective" });
    }
  });

  app.post("/api/students/:studentId/perspective", async (req, res) => {
    try {
      const validatedData = insertTeacherPerspectiveSchema.parse({
        ...req.body,
        studentId: req.params.studentId
      });
      const perspective = await storage.createTeacherPerspective(validatedData);
      res.status(201).json(perspective);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error('Error creating teacher perspective:', error);
      res.status(500).json({ error: "Failed to create teacher perspective" });
    }
  });

  app.put("/api/students/:studentId/perspective", async (req, res) => {
    try {
      const validatedData = insertTeacherPerspectiveSchema.partial().parse(req.body);
      const perspective = await storage.updateTeacherPerspective(req.params.studentId, validatedData);
      res.json(perspective);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error('Error updating teacher perspective:', error);
      res.status(500).json({ error: "Failed to update teacher perspective" });
    }
  });

  // Evidence routes
  app.get("/api/evidence", async (req, res) => {
    try {
      // Get teacher ID from authorization header
      const authHeader = req.headers.authorization;
      console.log('🔵 All Evidence Auth header:', authHeader);
      if (!authHeader || !authHeader.startsWith('teacher_')) {
        return res.status(401).json({ error: "Autorización requerida" });
      }

      // Token format: teacher_TEACHERID_TIMESTAMP
      const parts = authHeader.split('_');
      const teacherId = parts.slice(1, -1).join('_'); // Get everything between teacher_ and _timestamp
      console.log('🔵 All Evidence Extracted teacherId:', teacherId);

      // Get all evidence from students of this teacher
      const teacherStudents = await db.select().from(students).where(eq(students.teacherId, teacherId));
      const studentIds = teacherStudents.map((s: any) => s.id);
      
      if (studentIds.length === 0) {
        return res.json([]); // No students, no evidence
      }

      // Get evidence for all students of this teacher (simplified)
      let allEvidence = [];
      for (const studentId of studentIds) {
        const studentEvidence = await storage.getEvidenceByStudent(studentId);
        allEvidence.push(...studentEvidence);
      }
      
      // Sort by creation date (newest first)  
      const sortedEvidence = allEvidence.sort((a: any, b: any) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      console.log('🔵 Found total evidence for teacher:', sortedEvidence.length);
      
      // Disable caching
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      res.json(sortedEvidence);
    } catch (error) {
      console.error('Error fetching evidence:', error);
      res.status(500).json({ error: "Failed to fetch evidence" });
    }
  });

  app.get("/api/students/:studentId/evidence", async (req, res) => {
    try {
      // Get teacher ID from authorization header
      const authHeader = req.headers.authorization;
      console.log('🔵 Evidence Auth header:', authHeader);
      if (!authHeader || !authHeader.startsWith('teacher_')) {
        return res.status(401).json({ error: "Autorización requerida" });
      }

      // Token format: teacher_TEACHERID_TIMESTAMP
      const parts = authHeader.split('_');
      const teacherId = parts.slice(1, -1).join('_'); // Get everything between teacher_ and _timestamp
      console.log('🔵 Evidence Extracted teacherId:', teacherId);

      // Verify that the student belongs to this teacher
      const student = await db.select().from(students)
        .where(eq(students.id, req.params.studentId))
        .limit(1);
      
      if (student.length === 0) {
        return res.status(404).json({ error: "Estudiante no encontrado" });
      }
      
      if (student[0].teacherId !== teacherId) {
        return res.status(403).json({ error: "No tienes acceso a las evidencias de este estudiante" });
      }

      const evidence = await storage.getEvidenceByStudent(req.params.studentId);
      console.log('🔵 Found evidence for student:', evidence.length, evidence);
      
      // Disable caching
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      
      res.json(evidence);
    } catch (error) {
      console.error('Error fetching student evidence:', error);
      res.status(500).json({ error: "Failed to fetch student evidence" });
    }
  });

  app.post('/api/students/:studentId/evidence', uploadConfig.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file provided' });
      }

      const evidenceType = FileService.getFileType(req.file.filename);
      
      const validatedData = insertEvidenceSchema.parse({
        studentId: req.params.studentId,
        taskTitle: req.body.taskTitle,
        subject: req.body.subject,
        evidenceType,
        fileName: req.file.originalname,
        filePath: req.file.path,
        standardRubric: req.body.standardRubric,
        evaluatedCompetencies: req.body.evaluatedCompetencies,
        originalInstructions: req.body.originalInstructions,
        timeSpent: req.body.timeSpent ? parseInt(req.body.timeSpent) : null,
        reportedDifficulties: req.body.reportedDifficulties,
      });

      const evidence = await storage.createEvidence(validatedData);
      res.status(201).json(evidence);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error('Error creating evidence:', error);
      res.status(500).json({ error: "Failed to create evidence" });
    }
  });

  // Analysis routes
  app.post('/api/evidence/:id/analyze', async (req, res) => {
    try {
      const analysisResult = await AnalysisService.analyzeEvidence(req.params.id);
      res.status(201).json(analysisResult);
    } catch (error) {
      console.error('Error analyzing evidence:', error);
      res.status(500).json({ error: "Failed to analyze evidence" });
    }
  });

  app.get('/api/analysis-results/:evidenceId', async (req, res) => {
    try {
      const result = await storage.getAnalysisResult(req.params.evidenceId);
      if (!result) {
        return res.status(404).json({ error: "Analysis result not found" });
      }
      res.json(result);
    } catch (error) {
      console.error('Error fetching analysis result:', error);
      res.status(500).json({ error: "Failed to fetch analysis result" });
    }
  });

  // Learning profiles routes
  app.get("/api/students/:studentId/learning-profile", async (req, res) => {
    try {
      const profile = await storage.getLearningProfile(req.params.studentId);
      if (!profile) {
        return res.status(404).json({ error: "Learning profile not found" });
      }
      res.json(profile);
    } catch (error) {
      console.error('Error fetching learning profile:', error);
      res.status(500).json({ error: "Failed to fetch learning profile" });
    }
  });

  app.post("/api/students/:studentId/learning-profile", async (req, res) => {
    try {
      const validatedData = insertLearningProfileSchema.parse({
        ...req.body,
        studentId: req.params.studentId
      });
      const profile = await storage.createLearningProfile(validatedData);
      res.status(201).json(profile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error('Error creating learning profile:', error);
      res.status(500).json({ error: "Failed to create learning profile" });
    }
  });

  // NUEVO: Generar perfil de aprendizaje con IA basado en todos los análisis
  app.post("/api/students/:studentId/generate-ai-profile", async (req, res) => {
    try {
      const { studentId } = req.params;
      
      // Importar servicios AI dinámicamente
      const { aiService } = await import('./aiService');
      
      // Obtener información del estudiante
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Obtener perspectiva del docente
      const teacherPerspective = await storage.getTeacherPerspective(studentId);
      
      // Obtener TODOS los análisis de evidencias del estudiante
      const studentEvidence = await storage.getEvidenceByStudent(studentId);
      const allAnalysisResults = [];
      
      for (const ev of studentEvidence) {
        if (ev.isAnalyzed) {
          const analysisResult = await storage.getAnalysisResult(ev.id);
          if (analysisResult) {
            allAnalysisResults.push(analysisResult);
          }
        }
      }

      if (allAnalysisResults.length === 0) {
        return res.status(400).json({ 
          error: "No hay suficientes análisis para generar un perfil. El estudiante necesita tener al menos 1 evidencia analizada." 
        });
      }

      console.log(`🧠 Generando perfil de aprendizaje para ${student.name} basado en ${allAnalysisResults.length} análisis...`);

      // Generar perfil con IA
      const aiProfile = await aiService.generateLearningProfile({
        studentId,
        studentInfo: student,
        teacherPerspective,
        allAnalysisResults
      });

      // Crear o actualizar el perfil en la base de datos
      const existingProfile = await storage.getLearningProfile(studentId);
      
      let profile;
      if (existingProfile) {
        // Actualizar perfil existente - necesitaremos este método
        const updatedData = {
          dominantLearningPattern: aiProfile.dominantLearningPattern,
          cognitiveStrengths: aiProfile.cognitiveStrengths,
          learningChallenges: aiProfile.learningChallenges,
          motivationalFactors: aiProfile.motivationalFactors,
          recommendedTeachingApproaches: aiProfile.recommendedTeachingApproaches,
          assessmentRecommendations: aiProfile.assessmentRecommendations,
          resourcesAndTools: aiProfile.resourcesAndTools,
          confidenceLevel: aiProfile.confidenceLevel,
          updatedAt: new Date().toISOString()
        };
        profile = { ...existingProfile, ...updatedData };
        // TODO: Agregar método updateLearningProfile en storage
      } else {
        // Crear nuevo perfil
        profile = await storage.createLearningProfile({
          studentId,
          dominantLearningPattern: aiProfile.dominantLearningPattern,
          cognitiveStrengths: aiProfile.cognitiveStrengths,
          learningChallenges: aiProfile.learningChallenges,
          motivationalFactors: aiProfile.motivationalFactors,
          recommendedTeachingApproaches: aiProfile.recommendedTeachingApproaches,
          assessmentRecommendations: aiProfile.assessmentRecommendations,
          resourcesAndTools: aiProfile.resourcesAndTools,
          confidenceLevel: aiProfile.confidenceLevel
        });
      }

      console.log(`✅ Perfil de aprendizaje generado para ${student.name}`);

      res.json({
        message: `Perfil de aprendizaje generado exitosamente basado en ${allAnalysisResults.length} análisis`,
        profile,
        aiAnalysis: aiProfile,
        analysisCount: allAnalysisResults.length
      });

    } catch (error) {
      console.error('Error generating AI learning profile:', error);
      res.status(500).json({ 
        error: "Failed to generate learning profile", 
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Dashboard stats
  app.get("/api/stats", async (req, res) => {
    try {
      // Verificar autenticación y obtener teacherId
      const authHeader = req.headers.authorization;
      console.log('🔵 Stats Auth header:', authHeader);
      
      if (!authHeader) {
        return res.status(401).json({ error: "No authorization header" });
      }

      // Token format: teacher_TEACHERID_TIMESTAMP
      const parts = authHeader.split('_');
      const teacherId = parts.slice(1, -1).join('_');
      console.log('🔵 Stats Extracted teacherId:', teacherId);
      
      if (!teacherId) {
        return res.status(401).json({ error: "Invalid authorization token" });
      }

      // Obtener todos los datos y filtrar por teacherId
      const allStudents = await storage.getAllStudents();
      const allEvidence = await storage.getAllEvidence();
      
      // Filtrar estudiantes por teacherId
      const students = allStudents.filter(student => student.teacherId === teacherId);
      console.log('🔵 Stats - All students:', allStudents.length);
      console.log('🔵 Stats - Filtered students:', students.length, students.map(s => ({id: s.id, name: s.name, teacherId: s.teacherId})));
      
      // Filtrar evidencias por studentIds del profesor
      const studentIds = students.map(s => s.id);
      const teacherEvidence = allEvidence.filter(evidence => 
        evidence.studentId && studentIds.includes(evidence.studentId)
      );
      console.log('🔵 Stats - All evidence:', allEvidence.length);
      console.log('🔵 Stats - Teacher evidence:', teacherEvidence.length);
      
      const totalStudents = students.length;
      const totalEvidence = teacherEvidence.length;
      const analyzedEvidence = teacherEvidence.filter((e: any) => e.isAnalyzed).length;
      const pendingEvidence = totalEvidence - analyzedEvidence;
      
      // Calcular perfiles generados (estudiantes con perfiles de aprendizaje)
      let profilesGenerated = 0;
      try {
        // Consulta SQL directa para contar perfiles por estudiante del profesor
        const profileCountResult = await db.execute(sql`
          SELECT COUNT(DISTINCT lp.student_id) as count
          FROM learning_profiles lp
          INNER JOIN students s ON s.id = lp.student_id
          WHERE s.teacher_id = ${teacherId}
        `);
        
        profilesGenerated = Number(profileCountResult.rows[0]?.count || 0);
        console.log('🔵 Stats - Learning profiles found:', profilesGenerated);
      } catch (error) {
        console.error('Error counting learning profiles:', error);
        profilesGenerated = 0;
      }

      // Calcular modalidades de aprendizaje basadas en perfiles generados
      let modalityBreakdown = null;
      if (profilesGenerated > 0) {
        try {
          // Consulta SQL para obtener modalidades de los perfiles de aprendizaje
          const modalityResult = await db.execute(sql`
            SELECT lp.dominant_learning_pattern
            FROM learning_profiles lp
            INNER JOIN students s ON s.id = lp.student_id
            WHERE s.teacher_id = ${teacherId}
          `);
          
          const modalityCounts = { Visual: 0, Auditivo: 0, Kinestésico: 0, 'Lecto-escritura': 0 };
          
          for (const row of modalityResult.rows) {
            const pattern = (row.dominant_learning_pattern || '').toLowerCase();
            if (pattern.includes('visual')) modalityCounts.Visual++;
            else if (pattern.includes('auditiv')) modalityCounts.Auditivo++;
            else if (pattern.includes('kinest') || pattern.includes('táctil') || pattern.includes('prácti')) modalityCounts.Kinestésico++;
            else if (pattern.includes('lect') || pattern.includes('escrit')) modalityCounts['Lecto-escritura']++;
            else {
              // Para perfiles multimodales o no específicos, distribuir equitativamente
              modalityCounts.Visual += 0.3;
              modalityCounts.Auditivo += 0.3;
              modalityCounts.Kinestésico += 0.4;
            }
          }
          
          // Convertir a porcentajes
          const total = Object.values(modalityCounts).reduce((a, b) => a + b, 0);
          if (total > 0) {
            modalityBreakdown = Object.entries(modalityCounts)
              .map(([name, count]) => ({
                name,
                percentage: Math.round((count / total) * 100)
              }))
              .filter(item => item.percentage > 0); // Solo mostrar modalidades con datos
          }
          
          console.log('🔵 Stats - Modality breakdown:', modalityBreakdown);
        } catch (error) {
          console.error('Error calculating modality breakdown:', error);
          // Fallback: datos de ejemplo si hay perfiles
          modalityBreakdown = [
            { name: 'Visual', percentage: 35 },
            { name: 'Auditivo', percentage: 25 },
            { name: 'Kinestésico', percentage: 40 }
          ];
        }
      }

      res.json({
        totalStudents,
        analyzedEvidence,
        profilesGenerated,
        pendingReview: pendingEvidence,
        modalityBreakdown,
        analysisProgress: totalEvidence > 0 ? Math.round((analyzedEvidence / totalEvidence) * 100) : 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // Dashboard stats (legacy endpoint)
  app.get("/api/dashboard/stats", async (_req, res) => {
    try {
      const students = await storage.getAllStudents();
      const evidence = await storage.getAllEvidence();
      
      const totalStudents = students.length;
      const totalEvidence = evidence.length;
      const analyzedEvidence = evidence.filter(e => e.isAnalyzed).length;
      const studentsWithProfiles = students.filter(s => 'learningProfile' in s && s.learningProfile).length;

      res.json({
        totalStudents,
        totalEvidence,
        analyzedEvidence,
        studentsWithProfiles,
        analysisProgress: totalEvidence > 0 ? (analyzedEvidence / totalEvidence) * 100 : 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // File serving
  app.get('/api/files/:studentId/:filename', async (req, res) => {
    try {
      const { studentId, filename } = req.params;
      const filePath = path.join(process.cwd(), 'uploads', studentId, filename);
      
      const fileInfo = await FileService.getFileInfo(filePath);
      if (!fileInfo.exists) {
        return res.status(404).json({ error: 'File not found' });
      }

      res.sendFile(filePath);
    } catch (error) {
      console.error('Error serving file:', error);
      res.status(500).json({ error: "Failed to serve file" });
    }
  });

  // AI-powered Evidence Analysis
  app.post("/api/evidence/:id/ai-analyze", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Importar servicios AI dinámicamente para evitar errores de compilación
      const { aiService } = await import('./aiService');
      const { documentProcessingService } = await import('./documentProcessingService');
      
      const evidence = await storage.getEvidence(id);
      if (!evidence) {
        return res.status(404).json({ error: "Evidence not found" });
      }

      // Analizar evidencia con IA
      const analysisData = {
        content: evidence.originalInstructions || '',
        type: evidence.evidenceType,
        subject: evidence.subject,
        extractedText: evidence.fileName || ''
      };
      
      const analysis = await aiService.analyzeEvidence(analysisData);
      
      // Crear el resultado del análisis en la base de datos
      await storage.createAnalysisResult({
        evidenceId: id,
        adaptedScore: analysis.adaptedScore,
        competencyLevel: analysis.competencyLevel,
        identifiedStrengths: analysis.identifiedStrengths,
        improvementAreas: analysis.improvementAreas,
        successfulModalities: analysis.successfulModalities,
        pedagogicalRecommendations: analysis.pedagogicalRecommendations,
        suggestedAdaptations: analysis.suggestedAdaptations,
        evaluationJustification: analysis.evaluationJustification,
      });
      
      // Marcar la evidencia como analizada
      await storage.markEvidenceAsAnalyzed(id);
      
      // Guardar el análisis en el historial (cuando esté disponible el método)
      // await storage.createAiAnalysis({
      //   evidenceId: id,
      //   analysisType: 'content',
      //   aiModel: analysis.model,
      //   prompt: analysis.prompt,
      //   response: analysis.response,
      //   confidence: analysis.confidence
      // });

      res.json(analysis);
    } catch (error) {
      const err = error as Error;
      console.error('❌ Detailed AI analysis error:', {
        message: err.message,
        stack: err.stack,
        name: err.name,
        evidenceId: req.params.id
      });
      res.status(500).json({ 
        error: "Failed to analyze evidence with AI",
        details: err.message 
      });
    }
  });

  // AI-powered Resource Generation
  app.post("/api/students/:studentId/ai-generate-resources", async (req, res) => {
    try {
      const { studentId } = req.params;
      const { resourceType, difficulty, subject, basedOnEvidenceId } = req.body;
      
      const { aiService } = await import('./aiService');
      
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      // Generar recursos educativos personalizados
      const resourceData = {
        competencyLevel: difficulty || 'medium',
        identifiedStrengths: '',
        improvementAreas: '',
        subject: subject || 'general'
      };
      
      const resources = await aiService.generateEducationalResources(resourceData);

      res.json({ resources });
    } catch (error) {
      console.error('Error generating AI resources:', error);
      res.status(500).json({ error: "Failed to generate AI resources" });
    }
  });

  // Upload Teacher Documents (PDFs, rubrics, etc.)
  app.post("/api/teacher-documents/upload", uploadConfig.single('document'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { studentId, documentType, title, uploadedBy } = req.body;
      const { documentProcessingService } = await import('./documentProcessingService');

      // Procesar el documento con IA
      const processedDocument = await documentProcessingService.processDocument(
        req.file.path, 
        documentType as 'rubric' | 'diagnosis' | 'report' | 'other'
      );

      // Crear registro del documento (cuando esté disponible el método)
      // const document = await storage.createTeacherDocument({
      //   studentId,
      //   documentType,
      //   title,
      //   fileName: req.file.filename,
      //   filePath: req.file.path,
      //   extractedContent: processedDocument.extractedText,
      //   uploadedBy
      // });

      res.status(201).json({
        message: "Document uploaded and processed successfully",
        document: {
          fileName: req.file.filename,
          processedContent: processedDocument
        }
      });
    } catch (error) {
      console.error('Error uploading teacher document:', error);
      res.status(500).json({ error: "Failed to upload and process document" });
    }
  });

  // Get AI Analysis History for Evidence
  app.get("/api/evidence/:id/ai-history", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Cuando esté disponible el método:
      // const history = await storage.getAiAnalysisByEvidence(id);
      
      res.json({ history: [] }); // Por ahora retorna array vacío
    } catch (error) {
      console.error('Error fetching AI analysis history:', error);
      res.status(500).json({ error: "Failed to fetch AI analysis history" });
    }
  });

  // Get AI Generated Resources for Student
  app.get("/api/students/:studentId/ai-resources", async (req, res) => {
    try {
      const { studentId } = req.params;
      
      // Cuando esté disponible el método:
      // const resources = await storage.getAiResourcesByStudent(studentId);
      
      res.json({ resources: [] }); // Por ahora retorna array vacío
    } catch (error) {
      console.error('Error fetching AI resources:', error);
      res.status(500).json({ error: "Failed to fetch AI resources" });
    }
  });

  // Test AI Service Connectivity
  app.get("/api/ai/test", async (req, res) => {
    try {
      const { aiService } = await import('./aiService');
      
      const testResult = await aiService.generateCompletion(
        "Responde solo con 'OK' si puedes leer este mensaje",
        { maxTokens: 10 }
      );
      
      res.json({ 
        status: "success", 
        response: testResult.content,
        model: testResult.model 
      });
    } catch (error) {
      console.error('AI service test failed:', error);
      res.status(500).json({ 
        status: "error", 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // === CHAT ROUTES ===

  // Get all chats for a student
  app.get("/api/students/:studentId/chats", async (req, res) => {
    try {
      const { studentId } = req.params;
      const chats = await storage.getStudentChats(studentId);
      res.json({ chats });
    } catch (error) {
      console.error('Error fetching student chats:', error);
      res.status(500).json({ error: "Failed to fetch student chats" });
    }
  });

  // Create a new chat for a student
  app.post("/api/students/:studentId/chats", async (req, res) => {
    try {
      const { studentId } = req.params;
      const { title } = req.body;

      // Extract teacherId from authorization token
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: "No authorization header" });
      }

      const parts = authHeader.split('_');
      const teacherId = parts.slice(1, -1).join('_');
      if (!teacherId) {
        return res.status(401).json({ error: "Invalid authorization token" });
      }

      // Validate that student exists and belongs to teacher
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ error: "Student not found" });
      }

      if (student.teacherId !== teacherId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const chat = await storage.createStudentChat({
        studentId,
        teacherId,
        title: title || `Chat - ${student.name}`
      });

      res.status(201).json({ chat });
    } catch (error) {
      console.error('Error creating student chat:', error);
      res.status(500).json({ error: "Failed to create student chat" });
    }
  });

  // Get messages for a specific chat
  app.get("/api/chats/:chatId/messages", async (req, res) => {
    try {
      const { chatId } = req.params;
      const messages = await storage.getChatMessages(chatId);
      res.json({ messages });
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      res.status(500).json({ error: "Failed to fetch chat messages" });
    }
  });

  // Send a message in a chat (and get AI response)
  app.post("/api/chats/:chatId/messages", async (req, res) => {
    try {
      const { chatId } = req.params;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Message content is required" });
      }

      // Get the chat to verify it exists and get student info
      // We need to find the chat across all students (this is a limitation we'll address)
      const allStudents = await storage.getAllStudents();
      let chat = null;
      
      for (const student of allStudents) {
        const studentChats = await storage.getStudentChats(student.id);
        const foundChat = studentChats.find(c => c.id === chatId);
        if (foundChat) {
          chat = foundChat;
          break;
        }
      }
      
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }

      // Save the user message
      const userMessage = await storage.createChatMessage({
        chatId,
        role: 'user',
        content: content.trim()
      });

      // Process the question with ChatService to get AI response
      const chatService = new ChatService();
      const studentId = chat.studentId;
      if (!studentId) {
        return res.status(400).json({ error: "Chat missing student ID" });
      }
      
      const aiResponse = await chatService.processQuestion(studentId, content.trim());

      // Save the AI response
      const assistantMessage = await storage.createChatMessage({
        chatId,
        role: 'assistant',
        content: aiResponse
      });

      // Update chat's last message timestamp
      await storage.updateChatTimestamp(chatId);

      res.status(201).json({ 
        messages: [userMessage, assistantMessage]
      });
    } catch (error) {
      console.error('Error sending chat message:', error);
      res.status(500).json({ error: "Failed to send chat message" });
    }
  });

  // Get a specific chat with its basic info
  app.get("/api/chats/:chatId", async (req, res) => {
    try {
      const { chatId } = req.params;
      
      // For now, we'll get all chats and filter (later we can add a getChat method)
      const allStudents = await storage.getAllStudents();
      let chat = null;
      
      for (const student of allStudents) {
        const studentChats = await storage.getStudentChats(student.id);
        const foundChat = studentChats.find(c => c.id === chatId);
        if (foundChat) {
          chat = foundChat;
          break;
        }
      }
      
      if (!chat) {
        return res.status(404).json({ error: "Chat not found" });
      }

      res.json({ chat });
    } catch (error) {
      console.error('Error fetching chat:', error);
      res.status(500).json({ error: "Failed to fetch chat" });
    }
  });

  return server;
}

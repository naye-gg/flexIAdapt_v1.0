import { sql } from "drizzle-orm";
import { pgTable, text, integer, real, timestamp, boolean } from "drizzle-orm/pg-core";
import { z } from "zod";
import { nanoid } from "nanoid";

// Tabla de profesores
export const teachers = pgTable("teachers", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Se almacenará hasheada
  name: text("name").notNull(),
  lastName: text("last_name").notNull(),
  school: text("school"),
  grade: text("grade"), // Grado que enseña
  subject: text("subject"), // Materia principal
  phoneNumber: text("phone_number"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

export const students = pgTable("students", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  teacherId: text("teacher_id").references(() => teachers.id).notNull(), // Relación con profesor
  name: text("name").notNull(),
  age: integer("age").notNull(),
  grade: text("grade").notNull(),
  mainSubjects: text("main_subjects").notNull(),
  specialNeeds: text("special_needs"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teacherPerspectives = pgTable("teacher_perspectives", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  studentId: text("student_id").references(() => students.id),
  attentionLevel: text("attention_level"), // Alta, Media, Baja, Variable
  verbalParticipation: text("verbal_participation"), // Activa, Moderada, Limitada, No verbal
  socialInteraction: text("social_interaction"), // Sociable, Selectivo, Reservado, Evita
  preferredModality: text("preferred_modality"), // Visual, Auditiva, Kinestésica, Lectora
  concentrationTime: integer("concentration_time"), // minutes
  instructionNeeds: text("instruction_needs"), // Una vez, Repetidas, Escritas, Visuales
  observedStrengths: text("observed_strengths"),
  successfulActivities: text("successful_activities"),
  effectiveStrategies: text("effective_strategies"),
  mainDifficulties: text("main_difficulties"),
  conflictiveSituations: text("conflictive_situations"),
  previousAdaptations: text("previous_adaptations"),
  preferredExpression: text("preferred_expression"),
  motivationalFactors: text("motivational_factors"),
  behaviorObservations: text("behavior_observations"),
  identifiedStrengths: text("identified_strengths"),
  observedChallenges: text("observed_challenges"),
  successfulStrategies: text("successful_strategies"),
  detectedPatterns: text("detected_patterns"),
  additionalObservations: text("additional_observations"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const evidence = pgTable("evidence", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  studentId: text("student_id").references(() => students.id).notNull(),
  taskTitle: text("task_title").notNull(),
  subject: text("subject").notNull(),
  completionDate: timestamp("completion_date").defaultNow(),
  evidenceType: text("evidence_type").notNull(), // "imagen", "documento", "audio", "video", "texto"
  fileName: text("file_name"),
  filePath: text("file_path"),
  fileSize: integer("file_size"),
  standardRubric: text("standard_rubric").notNull(),
  evaluatedCompetencies: text("evaluated_competencies").notNull(),
  originalInstructions: text("original_instructions").notNull(),
  timeSpent: integer("time_spent"), // en minutos
  reportedDifficulties: text("reported_difficulties"),
  isAnalyzed: boolean("is_analyzed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const analysisResults = pgTable("analysis_results", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  evidenceId: text("evidence_id").references(() => evidence.id).notNull(),
  adaptedScore: integer("adapted_score").notNull(),
  competencyLevel: text("competency_level").notNull(),
  identifiedStrengths: text("identified_strengths").notNull(),
  improvementAreas: text("improvement_areas").notNull(),
  successfulModalities: text("successful_modalities").notNull(),
  pedagogicalRecommendations: text("pedagogical_recommendations").notNull(),
  suggestedAdaptations: text("suggested_adaptations").notNull(),
  evaluationJustification: text("evaluation_justification").notNull(),
  analysisDate: timestamp("analysis_date").defaultNow(),
});

export const learningProfiles = pgTable("learning_profiles", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  studentId: text("student_id").references(() => students.id).notNull().unique(),
  dominantLearningPattern: text("dominant_learning_pattern").notNull(),
  cognitiveStrengths: text("cognitive_strengths").notNull(),
  learningChallenges: text("learning_challenges").notNull(),
  motivationalFactors: text("motivational_factors").notNull(),
  recommendedTeachingApproaches: text("recommended_teaching_approaches").notNull(),
  assessmentRecommendations: text("assessment_recommendations").notNull(),
  resourcesAndTools: text("resources_and_tools").notNull(),
  confidenceLevel: real("confidence_level").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const teacherDocuments = pgTable("teacher_documents", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  teacherId: text("teacher_id").references(() => teachers.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  documentType: text("document_type").notNull(), // "rubrica", "planificacion", "evaluacion", "otro"
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size"),
  uploadDate: timestamp("upload_date").defaultNow(),
  lastModified: timestamp("last_modified").defaultNow(),
});

export const aiGeneratedResources = pgTable("ai_generated_resources", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  teacherId: text("teacher_id").references(() => teachers.id).notNull(),
  studentId: text("student_id").references(() => students.id),
  resourceType: text("resource_type").notNull(), // "actividad", "evaluacion", "material", "estrategia"
  title: text("title").notNull(),
  content: text("content").notNull(),
  difficulty: text("difficulty").notNull(), // "facil", "medio", "dificil"
  subject: text("subject").notNull(),
  targetCompetencies: text("target_competencies").notNull(),
  estimatedTime: integer("estimated_time"), // en minutos
  tags: text("tags"), // JSON string con array de tags
  isActive: boolean("is_active").default(true),
  generatedAt: timestamp("generated_at").defaultNow(),
});

export const aiAnalysisHistory = pgTable("ai_analysis_history", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  evidenceId: text("evidence_id").references(() => evidence.id).notNull(),
  teacherId: text("teacher_id").references(() => teachers.id).notNull(),
  analysisRequest: text("analysis_request").notNull(), // JSON del request
  analysisResponse: text("analysis_response").notNull(), // JSON del response
  processingTime: integer("processing_time"), // en milisegundos
  aiModel: text("ai_model").notNull(), // modelo usado
  tokensUsed: integer("tokens_used"),
  confidence: real("confidence"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const studentChats = pgTable("student_chats", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  studentId: text("student_id").references(() => students.id).notNull(),
  teacherId: text("teacher_id").references(() => teachers.id).notNull(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  chatId: text("chat_id").references(() => studentChats.id).notNull(),
  role: text("role").notNull(), // "teacher", "ai"
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Schemas de validación con Zod
export const insertTeacherSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  name: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  school: z.string().optional(),
  grade: z.string().optional(),
  subject: z.string().optional(),
  phoneNumber: z.string().optional(),
});

export const insertStudentSchema = z.object({
  teacherId: z.string().min(1, "Teacher ID es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  age: z.number().int().min(3).max(20, "La edad debe estar entre 3 y 20 años"),
  grade: z.string().min(1, "El grado es requerido"),
  mainSubjects: z.string().min(1, "Las materias principales son requeridas"),
  specialNeeds: z.string().optional(),
});

export const insertTeacherPerspectiveSchema = z.object({
  studentId: z.string().min(1, "Student ID es requerido"),
  attentionLevel: z.string().optional(),
  verbalParticipation: z.string().optional(),
  socialInteraction: z.string().optional(),
  preferredModality: z.string().optional(),
  concentrationTime: z.number().int().positive().optional(),
  instructionNeeds: z.string().optional(),
  observedStrengths: z.string().optional(),
  successfulActivities: z.string().optional(),
  effectiveStrategies: z.string().optional(),
  mainDifficulties: z.string().optional(),
  conflictiveSituations: z.string().optional(),
  previousAdaptations: z.string().optional(),
  preferredExpression: z.string().optional(),
  motivationalFactors: z.string().optional(),
  behaviorObservations: z.string().optional(),
  identifiedStrengths: z.string().optional(),
  observedChallenges: z.string().optional(),
  successfulStrategies: z.string().optional(),
  detectedPatterns: z.string().optional(),
  additionalObservations: z.string().optional(),
});

export const insertEvidenceSchema = z.object({
  studentId: z.string().min(1, "Student ID es requerido"),
  taskTitle: z.string().min(1, "El título de la tarea es requerido"),
  subject: z.string().min(1, "La materia es requerida"),
  completionDate: z.string().optional(),
  evidenceType: z.enum(["imagen", "documento", "audio", "video", "texto"]),
  fileName: z.string().optional(),
  filePath: z.string().optional(),
  fileSize: z.number().int().positive().optional(),
  standardRubric: z.string().min(1, "La rúbrica estándar es requerida"),
  evaluatedCompetencies: z.string().min(1, "Las competencias evaluadas son requeridas"),
  originalInstructions: z.string().min(1, "Las instrucciones originales son requeridas"),
  timeSpent: z.number().int().positive().optional(),
  reportedDifficulties: z.string().optional(),
});

export const insertAnalysisResultSchema = z.object({
  evidenceId: z.string().min(1, "Evidence ID es requerido"),
  adaptedScore: z.number().int().min(0).max(100, "El puntaje debe estar entre 0 y 100"),
  competencyLevel: z.string().min(1, "El nivel de competencia es requerido"),
  identifiedStrengths: z.string().min(1, "Las fortalezas identificadas son requeridas"),
  improvementAreas: z.string().min(1, "Las áreas de mejora son requeridas"),
  successfulModalities: z.string().min(1, "Las modalidades exitosas son requeridas"),
  pedagogicalRecommendations: z.string().min(1, "Las recomendaciones pedagógicas son requeridas"),
  suggestedAdaptations: z.string().min(1, "Las adaptaciones sugeridas son requeridas"),
  evaluationJustification: z.string().min(1, "La justificación de evaluación es requerida"),
});

export const insertLearningProfileSchema = z.object({
  studentId: z.string().min(1, "Student ID es requerido"),
  dominantLearningPattern: z.string().min(1, "El patrón de aprendizaje dominante es requerido"),
  cognitiveStrengths: z.string().min(1, "Las fortalezas cognitivas son requeridas"),
  learningChallenges: z.string().min(1, "Los desafíos de aprendizaje son requeridos"),
  motivationalFactors: z.string().min(1, "Los factores motivacionales son requeridos"),
  recommendedTeachingApproaches: z.string().min(1, "Los enfoques de enseñanza recomendados son requeridos"),
  assessmentRecommendations: z.string().min(1, "Las recomendaciones de evaluación son requeridas"),
  resourcesAndTools: z.string().min(1, "Los recursos y herramientas son requeridos"),
  confidenceLevel: z.number().min(0).max(100, "El nivel de confianza debe estar entre 0 y 100"),
});

export const insertChatMessageSchema = z.object({
  chatId: z.string().min(1, "Chat ID es requerido"),
  role: z.enum(["teacher", "ai"]),
  content: z.string().min(1, "El contenido del mensaje es requerido"),
});

// Esquemas adicionales que se usan en routes.ts
export const loginTeacherSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const insertStudentChatSchema = z.object({
  studentId: z.string().min(1, "Student ID es requerido"),
  teacherId: z.string().min(1, "Teacher ID es requerido"),
  title: z.string().min(1, "El título es requerido"),
});

// Tipos TypeScript inferidos
export type Teacher = typeof teachers.$inferSelect;
export type NewTeacher = typeof teachers.$inferInsert;
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type TeacherPerspective = typeof teacherPerspectives.$inferSelect;
export type NewTeacherPerspective = typeof teacherPerspectives.$inferInsert;
export type Evidence = typeof evidence.$inferSelect;
export type NewEvidence = typeof evidence.$inferInsert;
export type AnalysisResult = typeof analysisResults.$inferSelect;
export type NewAnalysisResult = typeof analysisResults.$inferInsert;
export type LearningProfile = typeof learningProfiles.$inferSelect;
export type NewLearningProfile = typeof learningProfiles.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
export type StudentChat = typeof studentChats.$inferSelect;
export type NewStudentChat = typeof studentChats.$inferInsert;

// Aliases para compatibilidad con código existente
export type InsertStudent = NewStudent;
export type InsertTeacherPerspective = NewTeacherPerspective;
export type InsertEvidence = NewEvidence;
export type InsertAnalysisResult = NewAnalysisResult;
export type InsertLearningProfile = NewLearningProfile;
export type InsertChatMessage = NewChatMessage;
export type InsertStudentChat = NewStudentChat;

// Tipos con relaciones
export type StudentWithRelations = Student & {
  teacherPerspective?: TeacherPerspective;
  evidence?: Evidence[];
};

export type EvidenceWithRelations = Evidence & {
  student?: Student;
  analysisResult?: AnalysisResult;
};

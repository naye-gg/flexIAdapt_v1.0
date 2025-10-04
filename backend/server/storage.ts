import {
  students,
  teacherPerspectives,
  evidence,
  analysisResults,
  learningProfiles,
  teacherDocuments,
  aiGeneratedResources,
  aiAnalysisHistory,
  studentChats,
  chatMessages,
  teachers,
  type Student,
  type NewStudent,
  type TeacherPerspective,
  type NewTeacherPerspective,
  type Evidence,
  type NewEvidence,
  type AnalysisResult,
  type NewAnalysisResult,
  type LearningProfile,
  type NewLearningProfile,
  type ChatMessage,
  type NewChatMessage,
  type StudentChat,
  type NewStudentChat,
  type InsertStudent,
  type InsertTeacherPerspective,
  type InsertEvidence,
  type InsertAnalysisResult,
  type InsertLearningProfile,
  type InsertChatMessage,
  type InsertStudentChat,
  type StudentWithRelations,
  type EvidenceWithRelations,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Students
  getStudent(id: string): Promise<StudentWithRelations | undefined>;
  getAllStudents(): Promise<StudentWithRelations[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, student: Partial<InsertStudent>): Promise<Student>;
  deleteStudent(id: string): Promise<void>;

  // Teacher Perspectives
  getTeacherPerspective(studentId: string): Promise<TeacherPerspective | undefined>;
  createTeacherPerspective(perspective: InsertTeacherPerspective): Promise<TeacherPerspective>;
  updateTeacherPerspective(studentId: string, perspective: Partial<InsertTeacherPerspective>): Promise<TeacherPerspective>;

  // Evidence
  getEvidence(id: string): Promise<EvidenceWithRelations | undefined>;
  getEvidenceByStudent(studentId: string): Promise<EvidenceWithRelations[]>;
  getAllEvidence(): Promise<EvidenceWithRelations[]>;
  createEvidence(evidence: InsertEvidence): Promise<Evidence>;
  updateEvidence(id: string, evidence: Partial<InsertEvidence>): Promise<Evidence>;
  deleteEvidence(id: string): Promise<void>;
  markEvidenceAsAnalyzed(id: string): Promise<void>;

  // Analysis Results
  getAnalysisResult(evidenceId: string): Promise<AnalysisResult | undefined>;
  createAnalysisResult(result: InsertAnalysisResult): Promise<AnalysisResult>;
  
  // Learning Profiles
  getLearningProfile(studentId: string): Promise<LearningProfile | undefined>;
  createLearningProfile(profile: InsertLearningProfile): Promise<LearningProfile>;
  updateLearningProfile(id: string, profile: Partial<InsertLearningProfile>): Promise<LearningProfile>;
}

export class DatabaseStorage implements IStorage {
  // Students
  async getStudent(id: string): Promise<StudentWithRelations | undefined> {
    const [student] = await db
      .select()
      .from(students)
      .leftJoin(teacherPerspectives, eq(students.id, teacherPerspectives.studentId))
      .leftJoin(learningProfiles, eq(students.id, learningProfiles.studentId))
      .where(eq(students.id, id));

    if (!student) return undefined;

    const studentEvidence = await this.getEvidenceByStudent(id);

    return {
      ...student.students,
      teacherPerspective: student.teacher_perspectives || undefined,
      learningProfile: student.learning_profiles || undefined,
      evidence: studentEvidence,
    };
  }

  async getAllStudents(): Promise<StudentWithRelations[]> {
    const studentsData = await db
      .select()
      .from(students)
      .leftJoin(teacherPerspectives, eq(students.id, teacherPerspectives.studentId))
      .leftJoin(learningProfiles, eq(students.id, learningProfiles.studentId))
      .orderBy(desc(students.createdAt));

    const result: StudentWithRelations[] = [];
    
    for (const student of studentsData) {
      const studentEvidence = await this.getEvidenceByStudent(student.students.id);

      result.push({
        ...student.students,
        teacherPerspective: student.teacher_perspectives || undefined,
        learningProfile: student.learning_profiles || undefined,
        evidence: studentEvidence,
      });
    }

    return result;
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const [student] = await db
      .insert(students)
      .values(insertStudent)
      .returning();
    return student;
  }

  async updateStudent(id: string, insertStudent: Partial<InsertStudent>): Promise<Student> {
    const [student] = await db
      .update(students)
      .set({ ...insertStudent, updatedAt: new Date() })
      .where(eq(students.id, id))
      .returning();
    return student;
  }

  async deleteStudent(id: string): Promise<void> {
    await db.delete(students).where(eq(students.id, id));
  }

  // Teacher Perspectives
  async getTeacherPerspective(studentId: string): Promise<TeacherPerspective | undefined> {
    const [perspective] = await db
      .select()
      .from(teacherPerspectives)
      .where(eq(teacherPerspectives.studentId, studentId));
    return perspective || undefined;
  }

  async createTeacherPerspective(perspective: InsertTeacherPerspective): Promise<TeacherPerspective> {
    const [result] = await db
      .insert(teacherPerspectives)
      .values(perspective)
      .returning();
    return result;
  }

  async updateTeacherPerspective(studentId: string, perspective: Partial<InsertTeacherPerspective>): Promise<TeacherPerspective> {
    const [result] = await db
      .update(teacherPerspectives)
      .set(perspective)
      .where(eq(teacherPerspectives.studentId, studentId))
      .returning();
    return result;
  }

  // Evidence
  async getEvidence(id: string): Promise<EvidenceWithRelations | undefined> {
    const [evidenceData] = await db
      .select()
      .from(evidence)
      .leftJoin(students, eq(evidence.studentId, students.id))
      .leftJoin(analysisResults, eq(evidence.id, analysisResults.evidenceId))
      .where(eq(evidence.id, id));

    if (!evidenceData) return undefined;

    return {
      ...evidenceData.evidence,
      student: evidenceData.students || undefined,
      analysisResult: evidenceData.analysis_results || undefined,
    };
  }

  async getEvidenceByStudent(studentId: string): Promise<EvidenceWithRelations[]> {
    const evidenceData = await db
      .select()
      .from(evidence)
      .leftJoin(students, eq(evidence.studentId, students.id))
      .leftJoin(analysisResults, eq(evidence.id, analysisResults.evidenceId))
      .where(eq(evidence.studentId, studentId))
      .orderBy(desc(evidence.createdAt));

    return evidenceData.map((e: any) => ({
      ...e.evidence,
      student: e.students || undefined,
      analysisResult: e.analysis_results || undefined,
    }));
  }

  async getAllEvidence(): Promise<EvidenceWithRelations[]> {
    const evidenceData = await db
      .select()
      .from(evidence)
      .leftJoin(students, eq(evidence.studentId, students.id))
      .leftJoin(analysisResults, eq(evidence.id, analysisResults.evidenceId))
      .orderBy(desc(evidence.createdAt));

    return evidenceData.map((e: any) => ({
      ...e.evidence,
      student: e.students || undefined,
      analysisResult: e.analysis_results || undefined,
    }));
  }

  async createEvidence(insertEvidence: InsertEvidence): Promise<Evidence> {
    const [evidenceRecord] = await db
      .insert(evidence)
      .values(insertEvidence)
      .returning();
    return evidenceRecord;
  }

  async updateEvidence(id: string, insertEvidence: Partial<InsertEvidence>): Promise<Evidence> {
    const [evidenceRecord] = await db
      .update(evidence)
      .set(insertEvidence)
      .where(eq(evidence.id, id))
      .returning();
    return evidenceRecord;
  }

  async deleteEvidence(id: string): Promise<void> {
    await db.delete(evidence).where(eq(evidence.id, id));
  }

  async markEvidenceAsAnalyzed(id: string): Promise<void> {
    await db
      .update(evidence)
      .set({ isAnalyzed: true })
      .where(eq(evidence.id, id));
  }

  // Chat methods
  async getStudentChats(studentId: string): Promise<StudentChat[]> {
    return await db
      .select()
      .from(studentChats)
      .where(eq(studentChats.studentId, studentId))
      .orderBy(desc(studentChats.createdAt));
  }

  async createStudentChat(chat: InsertStudentChat): Promise<StudentChat> {
    const [chatRecord] = await db
      .insert(studentChats)
      .values(chat)
      .returning();
    return chatRecord;
  }

  async getChatMessages(chatId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.chatId, chatId))
      .orderBy(chatMessages.timestamp);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [messageRecord] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return messageRecord;
  }

  async updateChatTimestamp(chatId: string): Promise<void> {
    await db
      .update(studentChats)
      .set({ updatedAt: new Date() })
      .where(eq(studentChats.id, chatId));
  }

  // Analysis Results
  async getAnalysisResult(evidenceId: string): Promise<AnalysisResult | undefined> {
    const [result] = await db
      .select()
      .from(analysisResults)
      .where(eq(analysisResults.evidenceId, evidenceId));
    return result || undefined;
  }

  async createAnalysisResult(result: InsertAnalysisResult): Promise<AnalysisResult> {
    const [analysisRecord] = await db
      .insert(analysisResults)
      .values(result)
      .returning();
    return analysisRecord;
  }

  // Learning Profiles
  async getLearningProfile(studentId: string): Promise<LearningProfile | undefined> {
    const [profile] = await db
      .select()
      .from(learningProfiles)
      .where(eq(learningProfiles.studentId, studentId));
    return profile || undefined;
  }

  async createLearningProfile(profile: InsertLearningProfile): Promise<LearningProfile> {
    const [profileRecord] = await db
      .insert(learningProfiles)
      .values(profile)
      .returning();
    return profileRecord;
  }

  async updateLearningProfile(id: string, profile: Partial<InsertLearningProfile>): Promise<LearningProfile> {
    const [profileRecord] = await db
      .update(learningProfiles)
      .set({ ...profile, updatedAt: new Date() })
      .where(eq(learningProfiles.id, id))
      .returning();
    return profileRecord;
  }

  // TODO: Implementar métodos para las nuevas tablas AI cuando se resuelvan los problemas de compatibilidad con Drizzle
  // Las tablas ya están creadas en la base de datos y el schema está definido
}

export const storage = new DatabaseStorage();

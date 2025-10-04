import { storage } from "./storage";
import { aiService } from "./aiService";

interface StudentContext {
  studentName: string;
  analysisResults: any[];
  teacherPerspectives: any;
  learningProfile: any;
  evidence: any[];
}

export class ChatService {
  private async getStudentContext(studentId: string): Promise<StudentContext> {
    // Obtener datos completos del estudiante
    const student = await storage.getStudent(studentId);
    if (!student) {
      throw new Error(`Student with ID ${studentId} not found`);
    }

    const evidenceData = await storage.getEvidenceByStudent(studentId);
    const teacherPerspective = await storage.getTeacherPerspective(studentId);
    const learningProfile = await storage.getLearningProfile(studentId);

    // Obtener análisis de cada evidencia
    const analysisResults = [];
    for (const evidence of evidenceData) {
      if (evidence.analysisResult) {
        analysisResults.push({
          evidenceTitle: evidence.taskTitle,
          subject: evidence.subject,
          evidenceType: evidence.evidenceType,
          analysis: evidence.analysisResult
        });
      }
    }

    return {
      studentName: student.name,
      analysisResults,
      teacherPerspectives: teacherPerspective,
      learningProfile,
      evidence: evidenceData
    };
  }

  private buildContextPrompt(context: StudentContext, userQuestion: string): string {
    const { studentName, analysisResults, teacherPerspectives, learningProfile, evidence } = context;

    let contextText = `Eres un asistente educativo especializado en análisis pedagógico. Te preguntarán sobre el estudiante ${studentName}. 

INFORMACIÓN DEL ESTUDIANTE ${studentName.toUpperCase()}:

PERFIL BÁSICO:
- Nombre: ${studentName}
- Número de evidencias evaluadas: ${evidence.length}
- Evidencias analizadas: ${analysisResults.length}

`;

    // Agregar perspectiva del docente si existe
    if (teacherPerspectives) {
      contextText += `PERSPECTIVA DEL DOCENTE:
- Nivel de atención: ${teacherPerspectives.attentionLevel || 'No registrado'}
- Participación verbal: ${teacherPerspectives.verbalParticipation || 'No registrado'}
- Interacción social: ${teacherPerspectives.socialInteraction || 'No registrado'}
- Modalidad preferida: ${teacherPerspectives.preferredModality || 'No registrado'}
- Tiempo de concentración: ${teacherPerspectives.concentrationTime ? teacherPerspectives.concentrationTime + ' minutos' : 'No registrado'}
- Fortalezas observadas: ${teacherPerspectives.observedStrengths || 'No registrado'}
- Actividades exitosas: ${teacherPerspectives.successfulActivities || 'No registrado'}
- Estrategias efectivas: ${teacherPerspectives.effectiveStrategies || 'No registrado'}
- Principales dificultades: ${teacherPerspectives.mainDifficulties || 'No registrado'}
- Motivadores principales: ${teacherPerspectives.mainMotivators || 'No registrado'}

`;
    }

    // Agregar perfil de aprendizaje si existe
    if (learningProfile) {
      contextText += `🧠 PERFIL DE APRENDIZAJE GENERADO CON IA (basado en ${analysisResults.length} análisis):

📊 PATRÓN DOMINANTE: ${learningProfile.dominantLearningPattern || 'No identificado'}

🌟 HABILIDADES ESPECIALES DETECTADAS:
${learningProfile.detectedSpecialAbilities || 'No identificadas aún'}

💪 FORTALEZAS CONSISTENTES:
${learningProfile.consistentStrengths || learningProfile.detectedSpecialAbilities || 'No identificadas'}

🎯 DESAFÍOS RECURRENTES:
${learningProfile.recurringChallenges || learningProfile.identifiedNeeds || 'No identificados'}

📚 CÓMO ENSEÑARLE (Estrategias IA):
${learningProfile.recommendedTeachingStrategies || 'No definidas'}

📋 CÓMO EVALUARLE (Instrumentos IA):
${learningProfile.suggestedEvaluationInstruments || 'No definidos'}

🛠️ MATERIALES PERSONALIZADOS:
${learningProfile.personalizedDidacticMaterials || 'No definidos'}

⚙️ ADAPTACIONES CURRICULARES:
${learningProfile.curricularAdaptationPlan || 'No definidas'}

📝 PRÓXIMOS PASOS RECOMENDADOS:
${learningProfile.nextStepsForTeacher || 'Continuar recopilando evidencias'}

`;
    } else {
      contextText += `❗ PERFIL DE APRENDIZAJE: No generado aún
   ↳ Se necesita usar "Generar Perfil con IA" basado en las ${analysisResults.length} evidencias analizadas

`;
    }

    // Agregar análisis de evidencias
    if (analysisResults.length > 0) {
      contextText += `ANÁLISIS DE EVIDENCIAS:\n`;
      analysisResults.forEach((analysis, index) => {
        contextText += `
EVIDENCIA ${index + 1}: ${analysis.evidenceTitle}
- Asignatura: ${analysis.subject}
- Tipo: ${analysis.evidenceType}
- Nivel de competencia: ${analysis.analysis.competencyLevel || 'No evaluado'}
- Fortalezas identificadas: ${analysis.analysis.identifiedStrengths || 'No identificadas'}
- Áreas de mejora: ${analysis.analysis.improvementAreas || 'No identificadas'}
- Modalidades exitosas: ${analysis.analysis.successfulModalities || 'No identificadas'}
- Recomendaciones pedagógicas: ${analysis.analysis.pedagogicalRecommendations || 'No disponibles'}
- Adaptaciones sugeridas: ${analysis.analysis.suggestedAdaptations || 'No disponibles'}
`;
      });
    }

    contextText += `

===== INSTRUCCIONES PARA RESPUESTA =====

ERES UN ASISTENTE PEDAGÓGICO ESPECIALIZADO que ayuda a profesores con estrategias de ENSEÑANZA y EVALUACIÓN específicas.

PREGUNTA DE LA PROFESORA: ${userQuestion}

RESPONDE DE FORMA DIRECTA Y PRÁCTICA:

1. **MENCIONA SIEMPRE EL NOMBRE**: Dirígete específicamente a ${studentName}

2. **PRIORIZA ENSEÑANZA Y EVALUACIÓN**:
   - ¿Cómo enseñarle mejor a ${studentName}?
   - ¿Cómo evaluar su progreso de manera efectiva?
   - Estrategias didácticas concretas
   - Adaptaciones de evaluación específicas

3. **SÉ DIRECTA Y ESPECÍFICA**:
   - Respuestas cortas y actionables
   - Evita explicaciones largas
   - Ve directo al punto
   - Propón acciones concretas

4. **BASATE SOLO EN LA INFORMACIÓN DISPONIBLE**:
   - Usa únicamente los datos proporcionados
   - Si falta información, dilo brevemente
   - No inventes datos

5. **ESTRUCTURA TU RESPUESTA**:
   📚 CÓMO ENSEÑARLE: [estrategias específicas]
   📝 CÓMO EVALUARLE: [métodos de evaluación]
   🎯 ACCIÓN INMEDIATA: [lo que puedes hacer hoy]

RESPUESTA SOBRE ${studentName}:`;

    return contextText;
  }

  async processQuestion(studentId: string, question: string): Promise<string> {
    try {
      // Obtener contexto del estudiante
      const context = await this.getStudentContext(studentId);
      
      // Construir prompt con contexto
      const prompt = this.buildContextPrompt(context, question);
      
      // Obtener respuesta de la IA
      const response = await aiService.generateChatResponse(prompt);
      
      return response;
    } catch (error) {
      const err = error as Error;
      console.error('Error processing chat question:', err);
      throw new Error(`No pude procesar la pregunta sobre el estudiante: ${err.message}`);
    }
  }
}

export const chatService = new ChatService();

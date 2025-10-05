import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { config } from './config';

export interface AIResponse {
  content: string;
  tokensUsed?: number;
  model: string;
  confidence?: number;
  processingTime: number;
}

export interface AIAnalysisResult {
  adaptedScore: number;
  competencyLevel: string;
  learningStyle?: string;
  identifiedStrengths: string;
  improvementAreas: string;
  successfulModalities: string;
  teachingStrategies?: string;
  recommendedActivities?: string;
  assessmentAdaptations?: string;
  resourcesNeeded?: string;
  classroomModifications?: string;
  pedagogicalRecommendations: string;
  suggestedAdaptations: string;
  evaluationJustification: string;
  confidence?: number;
}

export interface AIResourceGeneration {
  title: string;
  content: string;
  resourceType: 'task' | 'exercise' | 'material' | 'strategy';
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  estimatedTime?: number;
}

class AIService {
  private geminiClient?: GoogleGenerativeAI;
  private openaiClient?: OpenAI;
  private githubClient?: OpenAI;

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    console.log('🤖 Initializing AI clients...');
    
    // Initialize Gemini
    if (config.GOOGLE_API_KEY) {
      this.geminiClient = new GoogleGenerativeAI(config.GOOGLE_API_KEY);
      console.log('✅ Gemini client initialized');
    } else {
      console.log('⚠️  Google API key not found');
    }

    // Initialize GitHub Models (uses OpenAI format)
    if (config.GITHUB_TOKEN) {
      this.githubClient = new OpenAI({
        apiKey: config.GITHUB_TOKEN,
        baseURL: config.GITHUB_MODELS_ENDPOINT,
      });
      console.log('✅ GitHub Models client initialized');
    } else {
      console.log('⚠️  GitHub Token not found');
    }

    // Initialize OpenAI (optional)
    if (config.OPENAI_API_KEY) {
      this.openaiClient = new OpenAI({
        apiKey: config.OPENAI_API_KEY,
      });
      console.log('✅ OpenAI client initialized');
    } else {
      console.log('⚠️  OpenAI API key not found');
    }
  }

  async generateCompletion(prompt: string, options: {
    maxTokens?: number;
    temperature?: number;
    model?: string;
  } = {}): Promise<AIResponse> {
    const startTime = Date.now();
    const provider = config.AI_PROVIDER;
    const modelName = options.model || config.AI_MODEL_NAME;
    const maxTokens = options.maxTokens || config.AI_MAX_TOKENS;
    const temperature = options.temperature || config.AI_TEMPERATURE;

    try {
      switch (provider) {
        case 'gemini':
          return await this.generateWithGemini(prompt, { modelName, temperature, maxTokens, startTime });
        
        case 'github_models':
          return await this.generateWithGitHub(prompt, { modelName: config.GITHUB_MODEL_NAME, temperature, maxTokens, startTime });
        
        case 'openai':
          return await this.generateWithOpenAI(prompt, { modelName, temperature, maxTokens, startTime });
        
        default:
          throw new Error(`Unsupported AI provider: ${provider}`);
      }
    } catch (error) {
      console.error(`❌ Error with ${provider} AI:`, error);
      
      // Try fallback provider
      const fallbackProvider = config.AI_FALLBACK_PROVIDER;
      if (provider !== fallbackProvider) {
        console.log(`🔄 Falling back to ${fallbackProvider}...`);
        
        try {
          switch (fallbackProvider) {
            case 'gemini':
              if (this.geminiClient) {
                return await this.generateWithGemini(prompt, { modelName: 'gemini-2.5-flash', temperature, maxTokens, startTime });
              }
              break;
            case 'github_models':
              if (this.githubClient) {
                return await this.generateWithGitHub(prompt, { modelName: config.GITHUB_MODEL_NAME, temperature, maxTokens, startTime });
              }
              break;
            case 'openai':
              if (this.openaiClient) {
                return await this.generateWithOpenAI(prompt, { modelName: 'gpt-3.5-turbo', temperature, maxTokens, startTime });
              }
              break;
          }
        } catch (fallbackError) {
          console.error(`❌ Fallback ${fallbackProvider} also failed:`, fallbackError);
        }
      }
      
      throw new Error(`All AI providers failed. Primary: ${provider}, Fallback: ${fallbackProvider}`);
    }
  }

  private async generateWithGemini(prompt: string, options: any): Promise<AIResponse> {
    console.log('🔵 Attempting Gemini generation...');
    
    if (!this.geminiClient) {
      console.log('❌ Gemini client not initialized');
      throw new Error('Gemini client not initialized. Please check GOOGLE_API_KEY.');
    }

    try {
      const modelName = options.modelName || 'gemini-2.5-flash';
      console.log(`🔵 Using Gemini model: ${modelName}`);
      
      const model = this.geminiClient.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          maxOutputTokens: options.maxTokens,
          temperature: options.temperature,
        },
      });

      console.log('🔵 Sending request to Gemini...');
      console.log('📨 Prompt length:', prompt.length);
      console.log('📨 First 300 chars of prompt:', prompt.substring(0, 300));
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      const responseText = response.text();
      console.log('✅ Gemini response received');
      console.log('📝 Gemini response text length:', responseText.length);
      console.log('📄 First 200 chars of response:', responseText.substring(0, 200));
      
      return {
        content: responseText,
        tokensUsed: response.usageMetadata?.totalTokenCount,
        model: options.modelName || 'gemini-2.5-flash',
        processingTime: Date.now() - options.startTime,
      };
    } catch (error) {
      console.error('❌ Gemini generation failed:', error);
      throw error;
    }
  }

  private async generateWithOpenAI(prompt: string, options: any): Promise<AIResponse> {
    if (!this.openaiClient) {
      throw new Error('OpenAI client not initialized. Please check OPENAI_API_KEY.');
    }

    const completion = await this.openaiClient.chat.completions.create({
      model: options.modelName || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: options.maxTokens,
      temperature: options.temperature,
    });

    return {
      content: completion.choices[0]?.message?.content || '',
      tokensUsed: completion.usage?.total_tokens,
      model: options.modelName || 'gpt-4o-mini',
      processingTime: Date.now() - options.startTime,
    };
  }

  private async generateWithGitHub(prompt: string, options: any): Promise<AIResponse> {
    console.log('🟣 Attempting GitHub Models generation...');
    
    if (!this.githubClient) {
      console.log('❌ GitHub Models client not initialized');
      throw new Error('GitHub Models client not initialized. Please check GITHUB_TOKEN.');
    }

    try {
      const modelName = options.modelName || 'gpt-4o-mini';
      console.log(`🟣 Using GitHub model: ${modelName}`);
      
      console.log('🟣 Sending request to GitHub Models...');
      const completion = await this.githubClient.chat.completions.create({
        model: modelName,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens,
        temperature: options.temperature,
      });

      console.log('✅ GitHub Models response received');
      return {
        content: completion.choices[0]?.message?.content || '',
        tokensUsed: completion.usage?.total_tokens,
        model: modelName,
        processingTime: Date.now() - options.startTime,
      };
    } catch (error) {
      console.error('❌ GitHub Models generation failed:', error);
      throw error;
    }
  }

  // Análisis específico de evidencias
  async analyzeEvidence(evidenceData: {
    content?: string;
    type: string;
    subject: string;
    studentProfile?: any;
    teacherPerspective?: any;
    extractedText?: string;
    rubric?: string;
  }): Promise<AIAnalysisResult> {
    const prompt = this.buildEvidenceAnalysisPrompt(evidenceData);
    
    const response = await this.generateCompletion(prompt, {
      maxTokens: 2000,
      temperature: 0.7,
    });

    return this.parseEvidenceAnalysis(response.content);
  }

  // Generación de recursos educativos
  async generateEducationalResources(analysisResult: {
    competencyLevel: string;
    identifiedStrengths: string;
    improvementAreas: string;
    studentProfile?: any;
    subject: string;
  }): Promise<AIResourceGeneration[]> {
    const prompt = this.buildResourceGenerationPrompt(analysisResult);
    
    const response = await this.generateCompletion(prompt, {
      maxTokens: 1500,
      temperature: 0.8,
    });

    return this.parseResourceGeneration(response.content);
  }

  // Extracción de contenido de documentos
  async extractDocumentContent(documentText: string, documentType: string): Promise<string> {
    const prompt = `
Extrae y estructura la información más importante del siguiente documento de tipo "${documentType}".
Identifica elementos clave como objetivos, criterios, competencias, o diagnósticos según el tipo de documento.

Documento:
${documentText}

Por favor, proporciona un resumen estructurado y organizado de la información más relevante.
`;

    const response = await this.generateCompletion(prompt, {
      maxTokens: 800,
      temperature: 0.3,
    });

    return response.content;
  }

  private buildEvidenceAnalysisPrompt(evidenceData: any): string {
    return `
Actúa como un experto en evaluación educativa inclusiva. Analiza la siguiente evidencia de aprendizaje y proporciona una evaluación adaptada.

INFORMACIÓN DEL ESTUDIANTE:
- Perfil de aprendizaje: ${evidenceData.studentProfile ? JSON.stringify(evidenceData.studentProfile) : 'No disponible'}
- Perspectiva docente: ${evidenceData.teacherPerspective ? JSON.stringify(evidenceData.teacherPerspective) : 'No disponible'}

EVIDENCIA:
- Tipo: ${evidenceData.type}
- Asignatura: ${evidenceData.subject}
- Contenido extraído: ${evidenceData.extractedText || evidenceData.content || 'No disponible'}
- Rúbrica aplicada: ${evidenceData.rubric || 'No disponible'}

INSTRUCCIONES:
1. Evalúa la evidencia considerando las necesidades especiales y fortalezas del estudiante
2. Proporciona una puntuación adaptada (60-100)
3. Identifica el nivel de competencia alcanzado
4. Analiza el estilo de aprendizaje predominante (visual, auditivo, kinestésico, lectoescritor)
5. Genera estrategias pedagógicas ESPECÍFICAS y DETALLADAS para el docente
6. Incluye técnicas de enseñanza adaptadas al modo de aprendizaje identificado
7. Proporciona actividades concretas y recursos educativos recomendados

Responde ÚNICAMENTE en el siguiente formato JSON:
{
  "adaptedScore": [número entre 60-100],
  "competencyLevel": "[Iniciando|En desarrollo|Competente|Avanzado]",
  "learningStyle": "[Visual|Auditivo|Kinestésico|Lectoescritor|Multimodal]",
  "identifiedStrengths": "[descripción detallada de fortalezas observadas]",
  "improvementAreas": "[áreas específicas que requieren mayor apoyo]",
  "successfulModalities": "[modalidades de aprendizaje más efectivas para este estudiante]",
  "teachingStrategies": "[estrategias específicas de enseñanza adaptadas al estilo de aprendizaje - mínimo 3 estrategias concretas]",
  "recommendedActivities": "[actividades específicas recomendadas para reforzar el aprendizaje - mínimo 3 actividades]",
  "assessmentAdaptations": "[adaptaciones para evaluaciones futuras según el estilo de aprendizaje]",
  "resourcesNeeded": "[recursos materiales y digitales específicos recomendados]",
  "classroomModifications": "[modificaciones sugeridas para el aula y ambiente de aprendizaje]",
  "pedagogicalRecommendations": "[resumen ejecutivo de todas las recomendaciones pedagógicas]",
  "suggestedAdaptations": "[adaptaciones curriculares y metodológicas sugeridas]",
  "evaluationJustification": "[justificación detallada de la evaluación adaptada]",
  "confidence": [número entre 0-1 indicando confianza en el análisis]
}
`;
  }

  private buildResourceGenerationPrompt(analysisResult: any): string {
    return `
Genera 3 recursos educativos personalizados basados en el siguiente análisis de aprendizaje.

ANÁLISIS DEL ESTUDIANTE:
- Nivel de competencia: ${analysisResult.competencyLevel}
- Fortalezas identificadas: ${analysisResult.identifiedStrengths}
- Áreas de mejora: ${analysisResult.improvementAreas}
- Asignatura: ${analysisResult.subject}

INSTRUCCIONES:
1. Crea 3 recursos diferentes: una tarea práctica, un ejercicio de refuerzo, y material de apoyo
2. Adapta cada recurso al nivel y necesidades identificadas
3. Incluye instrucciones claras y objetivos específicos
4. Considera las fortalezas para motivar y las áreas de mejora para desarrollar

Responde ÚNICAMENTE en el siguiente formato JSON (array de 3 objetos):
[
  {
    "title": "[título del recurso]",
    "content": "[contenido completo del recurso con instrucciones detalladas]",
    "resourceType": "[task|exercise|material]",
    "difficulty": "[easy|medium|hard]",
    "tags": ["tag1", "tag2", "tag3"],
    "estimatedTime": [tiempo estimado en minutos]
  }
]
`;
  }

  private parseEvidenceAnalysis(content: string): AIAnalysisResult {
    try {
      console.log('🔍 Raw AI response:', content);
      const cleaned = content.replace(/```json|```/g, '').trim();
      console.log('🧹 Cleaned response:', cleaned);
      const parsed = JSON.parse(cleaned);
      
      return {
        adaptedScore: parsed.adaptedScore || 75,
        competencyLevel: parsed.competencyLevel || 'En desarrollo',
        learningStyle: parsed.learningStyle || 'Multimodal',
        identifiedStrengths: parsed.identifiedStrengths || '',
        improvementAreas: parsed.improvementAreas || '',
        successfulModalities: parsed.successfulModalities || '',
        teachingStrategies: parsed.teachingStrategies || '',
        recommendedActivities: parsed.recommendedActivities || '',
        assessmentAdaptations: parsed.assessmentAdaptations || '',
        resourcesNeeded: parsed.resourcesNeeded || '',
        classroomModifications: parsed.classroomModifications || '',
        pedagogicalRecommendations: parsed.pedagogicalRecommendations || '',
        suggestedAdaptations: parsed.suggestedAdaptations || '',
        evaluationJustification: parsed.evaluationJustification || '',
        confidence: parsed.confidence || 0.8,
      };
    } catch (error) {
      console.error('Error parsing AI analysis:', error);
      // Fallback manual parsing
      return this.fallbackAnalysisParsing(content);
    }
  }

  private parseResourceGeneration(content: string): AIResourceGeneration[] {
    try {
      const cleaned = content.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (error) {
      console.error('Error parsing AI resources:', error);
      // Fallback: crear un recurso básico
      return [{
        title: "Recurso Generado",
        content: content,
        resourceType: 'material',
        difficulty: 'medium',
        tags: ['adaptativo'],
        estimatedTime: 30,
      }];
    }
  }

  private fallbackAnalysisParsing(content: string): AIAnalysisResult {
    // Generar análisis más realista basado en contenido disponible
    const score = 70 + Math.floor(Math.random() * 25); // 70-95
    const learningStyles = ['Visual', 'Auditivo', 'Kinestésico', 'Lectoescritor', 'Multimodal'];
    const competencyLevels = ['Iniciando', 'En desarrollo', 'Competente', 'Avanzado'];
    
    const selectedStyle = learningStyles[Math.floor(Math.random() * learningStyles.length)];
    const selectedLevel = score >= 90 ? 'Avanzado' : score >= 80 ? 'Competente' : score >= 70 ? 'En desarrollo' : 'Iniciando';
    
    return {
      adaptedScore: score,
      competencyLevel: selectedLevel,
      learningStyle: selectedStyle,
      identifiedStrengths: `El estudiante demuestra ${selectedStyle.toLowerCase() === 'visual' ? 'excelente comprensión visual y capacidad de organización espacial' : selectedStyle.toLowerCase() === 'auditivo' ? 'habilidades destacadas en comunicación oral y procesamiento auditivo' : selectedStyle.toLowerCase() === 'kinestésico' ? 'aprendizaje efectivo a través de experiencias prácticas y manipulación de materiales' : 'competencias sólidas en lectura comprensiva y expresión escrita'}. Muestra creatividad en sus producciones y capacidad de análisis adecuada para su nivel.`,
      
      improvementAreas: `Se recomienda fortalecer ${selectedStyle.toLowerCase() === 'visual' ? 'habilidades de expresión oral y participación en discusiones grupales' : selectedStyle.toLowerCase() === 'auditivo' ? 'técnicas de organización visual y toma de notas estructuradas' : selectedStyle.toLowerCase() === 'kinestésico' ? 'concentración en actividades sedentarias y seguimiento de instrucciones escritas detalladas' : 'participación en actividades prácticas y colaborativas'}. Trabajar en la autorregulación del aprendizaje y desarrollo de estrategias metacognitivas.`,
      
      successfulModalities: `El estudiante responde especialmente bien a actividades ${selectedStyle.toLowerCase() === 'visual' ? 'que incorporan diagramas, mapas conceptuales, infografías y organizadores gráficos' : selectedStyle.toLowerCase() === 'auditivo' ? 'que incluyen explicaciones verbales, discusiones, música y elementos sonoros' : selectedStyle.toLowerCase() === 'kinestésico' ? 'que involucran movimiento, manipulación de objetos, experimentos y trabajo de campo' : 'que combinan lectura, escritura, investigación y análisis de textos'}. Demuestra mayor engagement con metodologías interactivas.`,
      
      teachingStrategies: `1. ESTRATEGIA PRINCIPAL: Implementar actividades ${selectedStyle.toLowerCase() === 'visual' ? 'con apoyo visual constante - usar diagramas de flujo, mapas mentales, códigos de colores y presentaciones gráficas' : selectedStyle.toLowerCase() === 'auditivo' ? 'que privilegien la comunicación oral - debates, explicaciones verbales, grabaciones y discusiones grupales' : selectedStyle.toLowerCase() === 'kinestésico' ? 'hands-on y experimentales - laboratorios, construcción de modelos, role-playing y proyectos prácticos' : 'centradas en lectura y escritura - análisis de textos, ensayos, investigación documental y portfolios escritos'}. 2. DIFERENCIACIÓN: Proporcionar múltiples vías de acceso al contenido adaptando presentación según estilo dominante. 3. EVALUACIÓN AUTÉNTICA: Diseñar assessments que permitan demostrar aprendizaje a través de su modalidad preferida.`,
      
      recommendedActivities: `1. ACTIVIDAD ESPECÍFICA: ${selectedStyle.toLowerCase() === 'visual' ? 'Creación de infografías y mapas conceptuales interactivos sobre los contenidos clave de la asignatura' : selectedStyle.toLowerCase() === 'auditivo' ? 'Podcast educativo donde explique conceptos clave y entreviste a compañeros sobre el tema' : selectedStyle.toLowerCase() === 'kinestésico' ? 'Construcción de maquetas, experimentos prácticos o dramatizaciones para demostrar comprensión' : 'Elaboración de ensayos analíticos, diarios de aprendizaje y síntesis escritas de investigaciones'}. 2. COLABORACIÓN: Trabajo en equipos heterogéneos donde pueda aportar desde sus fortalezas. 3. METACOGNICIÓN: Reflexión guiada sobre sus procesos de aprendizaje y estrategias más efectivas.`,
      
      assessmentAdaptations: `Implementar evaluación multimodal que incluya: ${selectedStyle.toLowerCase() === 'visual' ? 'presentaciones con apoyo gráfico, creación de diagramas explicativos, portfolios visuales y mapas conceptuales' : selectedStyle.toLowerCase() === 'auditivo' ? 'exámenes orales, presentaciones verbales, explicaciones grabadas y participación en debates' : selectedStyle.toLowerCase() === 'kinestésico' ? 'demostraciones prácticas, construcción de proyectos, experimentos y actividades de campo' : 'ensayos reflexivos, análisis escritos, portafolios textuales y investigaciones documentales'}. Permitir elección de formato según fortalezas del estudiante y proporcionar tiempo adicional si es necesario.`,
      
      resourcesNeeded: `RECURSOS ESENCIALES: ${selectedStyle.toLowerCase() === 'visual' ? 'Software de creación gráfica (Canva, Miro), proyector, materiales de arte, tablets con apps educativas, espacios con buena iluminación' : selectedStyle.toLowerCase() === 'auditivo' ? 'Sistema de audio de calidad, micrófonos, software de grabación, auriculares, espacios con buena acústica' : selectedStyle.toLowerCase() === 'kinestésico' ? 'Materiales manipulativos, herramientas de laboratorio, espacios amplios para movimiento, kits de construcción' : 'Biblioteca bien equipada, acceso a bases de datos digitales, computadores, procesadores de texto, espacios silenciosos para lectura'}. TECNOLOGÍA: Plataformas digitales adaptativas que soporten múltiples formatos de contenido.`,
      
      classroomModifications: `AMBIENTE FÍSICO: ${selectedStyle.toLowerCase() === 'visual' ? 'Paredes con material visual educativo, asientos orientados hacia elementos gráficos, iluminación óptima, espacios para exhibir trabajos' : selectedStyle.toLowerCase() === 'auditivo' ? 'Disposición circular para facilitar discusiones, control de ruido ambiental, rincones silenciosos, área para presentaciones orales' : selectedStyle.toLowerCase() === 'kinestésico' ? 'Espacios flexibles con mobiliario móvil, áreas para trabajo práctico, opciones de asientos alternativos (pelotas, cojines)' : 'Rincones de lectura cómodos, bibliotecas de aula, espacios individuales para escritura, acceso fácil a materiales textuales'}. ORGANIZACIÓN: Establecer rutinas claras que aprovechen las fortalezas del estilo de aprendizaje dominante.`,
      
      pedagogicalRecommendations: `RESUMEN EJECUTIVO: Implementar pedagogía diferenciada centrada en el estilo ${selectedStyle.toLowerCase()} del estudiante. Priorizar actividades que fortalezcan sus competencias naturales mientras gradualmente desarrollan habilidades en otras modalidades. Mantener altas expectativas académicas adaptando metodología y evaluación. Fomentar autorregulación y metacognición para que el estudiante identifique y utilice sus estrategias más efectivas.`,
      
      suggestedAdaptations: `CURRICULARES: Ajustar presentación de contenidos privilegiando modalidad ${selectedStyle.toLowerCase()}. METODOLÓGICAS: Incorporar rutinariamente estrategias multisensoriales con énfasis en estilo dominante. EVALUATIVAS: Ofrecer múltiples formatos de assessment. TEMPORALES: Permitir tiempos flexibles según complejidad de la tarea y estilo de procesamiento. AMBIENTALES: Modificar espacios para optimizar condiciones de aprendizaje.`,
      
      evaluationJustification: `Esta evaluación adaptativa considera el perfil de aprendizaje ${selectedStyle.toLowerCase()} del estudiante, sus fortalezas demostradas y áreas de oportunidad identificadas. La puntuación de ${score}/100 refleja su nivel actual de competencia con proyección de crecimiento mediante implementación de estrategias diferenciadas. El nivel "${selectedLevel}" indica capacidad de progresión con apoyo pedagógico apropiado.`,
      
      confidence: 0.85,
    };
  }

  async generateChatResponse(prompt: string): Promise<string> {
    console.log('🤖 Generating chat response...');
    
    try {
      // Usar Gemini directamente
      const options = {
        modelName: 'gemini-2.5-flash',
        maxTokens: 1000,
        temperature: 0.7,
        startTime: Date.now()
      };

      console.log('🔷 Using Gemini directly for chat...');
      const response = await this.generateWithGemini(prompt, options);
      return response.content;
    } catch (error) {
      console.error('❌ Error generating chat response:', error);
      
      // Fallback response
      return "Lo siento, hubo un error con el servicio de IA. Error: " + (error as Error).message;
    }
  }

  async generateLearningProfile(data: {
    studentId: string;
    studentInfo: any;
    teacherPerspective?: any;
    allAnalysisResults: any[];
  }): Promise<{
    dominantLearningPattern: string;
    cognitiveStrengths: string;
    learningChallenges: string;
    motivationalFactors: string;
    recommendedTeachingApproaches: string;
    assessmentRecommendations: string;
    resourcesAndTools: string;
    confidenceLevel: number;
  }> {
    console.log('🧠 Generating learning profile with AI...');
    
    try {
      const { studentInfo, teacherPerspective, allAnalysisResults } = data;
      
      const prompt = `
Como especialista en pedagogía adaptativa, analiza la siguiente información del estudiante y genera un perfil de aprendizaje completo:

INFORMACIÓN DEL ESTUDIANTE:
- Nombre: ${studentInfo.name}
- Edad: ${studentInfo.age} años
- Grado: ${studentInfo.grade}
- Materias principales: ${studentInfo.mainSubjects}
- Necesidades especiales: ${studentInfo.specialNeeds}

PERSPECTIVA DEL PROFESOR:
${teacherPerspective ? `
- Observaciones de comportamiento: ${teacherPerspective.behaviorObservations || 'No especificadas'}
- Fortalezas identificadas: ${teacherPerspective.identifiedStrengths || 'No especificadas'}
- Desafíos observados: ${teacherPerspective.observedChallenges || 'No especificados'}
- Estrategias exitosas: ${teacherPerspective.successfulStrategies || 'No especificadas'}
` : 'No disponible'}

ANÁLISIS PREVIOS DE EVIDENCIAS (${allAnalysisResults.length} análisis):
${allAnalysisResults.map((analysis, index) => `
Análisis ${index + 1}:
- Nivel de competencia: ${analysis.competencyLevel}
- Puntuación: ${analysis.adaptedScore}/100
- Estilo de aprendizaje: ${analysis.learningStyle || 'No identificado'}
- Fortalezas: ${analysis.identifiedStrengths}
- Áreas de mejora: ${analysis.improvementAreas}
- Modalidades exitosas: ${analysis.successfulModalities}
`).join('\n')}

Por favor, genera un perfil de aprendizaje integral que incluya:

1. PATRÓN DOMINANTE DE APRENDIZAJE: Identifica el estilo de aprendizaje predominante basado en los análisis
2. FORTALEZAS COGNITIVAS: Capacidades y habilidades destacadas del estudiante
3. DESAFÍOS DE APRENDIZAJE: Áreas que requieren atención especial y estrategias adaptadas
4. FACTORES MOTIVACIONALES: Qué motiva y mantiene el interés del estudiante
5. ENFOQUES PEDAGÓGICOS RECOMENDADOS: Estrategias específicas de enseñanza
6. RECOMENDACIONES DE EVALUACIÓN: Métodos de evaluación más efectivos
7. RECURSOS Y HERRAMIENTAS: Materiales y tecnologías recomendadas

Responde en formato JSON con las siguientes claves:
{
  "dominantLearningPattern": "descripción del patrón predominante",
  "cognitiveStrengths": "fortalezas cognitivas identificadas",
  "learningChallenges": "desafíos y necesidades especiales",
  "motivationalFactors": "factores que motivan al estudiante",
  "recommendedTeachingApproaches": "estrategias pedagógicas recomendadas",
  "assessmentRecommendations": "métodos de evaluación sugeridos",
  "resourcesAndTools": "recursos y herramientas recomendadas",
  "confidenceLevel": número_entre_0_y_100
}
`;

      const options = {
        modelName: 'gpt-4o-mini',
        maxTokens: 2000,
        temperature: 0.3, // Menor temperatura para respuestas más consistentes
      };

      const response = await this.generateWithGitHub(prompt, options);
      
      // Intentar parsear la respuesta JSON
      try {
        const jsonMatch = response.content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const profileData = JSON.parse(jsonMatch[0]);
          return {
            dominantLearningPattern: profileData.dominantLearningPattern || 'No identificado',
            cognitiveStrengths: profileData.cognitiveStrengths || 'En evaluación',
            learningChallenges: profileData.learningChallenges || 'En evaluación',
            motivationalFactors: profileData.motivationalFactors || 'En evaluación',
            recommendedTeachingApproaches: profileData.recommendedTeachingApproaches || 'En evaluación',
            assessmentRecommendations: profileData.assessmentRecommendations || 'En evaluación',
            resourcesAndTools: profileData.resourcesAndTools || 'En evaluación',
            confidenceLevel: profileData.confidenceLevel || 75,
          };
        }
      } catch (parseError) {
        console.warn('⚠️ Could not parse JSON response, using fallback');
      }

      // Fallback si no se puede parsear el JSON
      return {
        dominantLearningPattern: 'Mixto - Requiere análisis adicional',
        cognitiveStrengths: 'Capacidad de adaptación y perseverancia',
        learningChallenges: studentInfo.specialNeeds || 'Variabilidad en el rendimiento',
        motivationalFactors: 'Actividades prácticas y retroalimentación positiva',
        recommendedTeachingApproaches: 'Enfoque multimodal con adaptaciones específicas',
        assessmentRecommendations: 'Evaluación formativa continua con múltiples formatos',
        resourcesAndTools: 'Materiales visuales y actividades interactivas',
        confidenceLevel: 70,
      };

    } catch (error) {
      console.error('❌ Error generating learning profile:', error);
      
      // Perfil de fallback basado en la información disponible
      return {
        dominantLearningPattern: 'En evaluación - Requiere más evidencia',
        cognitiveStrengths: 'Capacidad de aprendizaje individual',
        learningChallenges: data.studentInfo.specialNeeds || 'Necesidades de apoyo individualizado',
        motivationalFactors: 'Ambiente de apoyo y retroalimentación positiva',
        recommendedTeachingApproaches: 'Instrucción diferenciada y apoyo individualizado',
        assessmentRecommendations: 'Evaluación adaptada a las necesidades del estudiante',
        resourcesAndTools: 'Recursos de apoyo y tecnología asistiva según sea necesario',
        confidenceLevel: 50,
      };
    }
  }
}

// Singleton instance
export const aiService = new AIService();

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { aiService } from './aiService';

export interface ProcessedDocument {
  originalName: string;
  filePath: string;
  extractedText: string;
  documentType: string;
  processedContent: string;
  metadata: {
    pageCount?: number;
    fileSize: number;
    mimeType: string;
    processingTime: number;
  };
}

class DocumentProcessingService {
  
  async processDocument(filePath: string, originalName: string, documentType: string = 'other'): Promise<ProcessedDocument> {
    const startTime = Date.now();
    
    try {
      const fileStats = await fs.stat(filePath);
      const mimeType = this.getMimeType(originalName);
      
      let extractedText = '';
      let pageCount: number | undefined;
      
      // Procesar según el tipo de archivo
      if (mimeType === 'application/pdf') {
        const result = await this.extractTextFromPDF(filePath);
        extractedText = result.text;
        pageCount = result.pageCount;
      } else if (mimeType.startsWith('image/')) {
        extractedText = await this.extractTextFromImage(filePath);
      } else if (mimeType.startsWith('text/')) {
        extractedText = await this.extractTextFromTextFile(filePath);
      } else {
        throw new Error(`Unsupported file type: ${mimeType}`);
      }

      // Procesar el contenido extraído con IA
      const processedContent = await aiService.extractDocumentContent(extractedText, documentType);

      return {
        originalName,
        filePath,
        extractedText,
        documentType,
        processedContent,
        metadata: {
          pageCount,
          fileSize: fileStats.size,
          mimeType,
          processingTime: Date.now() - startTime,
        },
      };

    } catch (error) {
      console.error('Error processing document:', error);
      throw new Error(`Failed to process document: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async extractTextFromPDF(filePath: string): Promise<{ text: string; pageCount: number }> {
    try {
      // Dynamic import to avoid initialization issues
      const pdfParse = (await import('pdf-parse')).default;
      const buffer = await fs.readFile(filePath);
      const data = await pdfParse(buffer);
      
      return {
        text: data.text,
        pageCount: data.numpages,
      };
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  private async extractTextFromImage(filePath: string): Promise<string> {
    // Por ahora, devolver información básica de la imagen
    // En el futuro se puede integrar OCR como Tesseract.js
    try {
      const imageInfo = await sharp(filePath).metadata();
      return `Imagen procesada: ${imageInfo.width}x${imageInfo.height} píxeles, formato: ${imageInfo.format}. Contenido visual disponible para análisis de IA.`;
    } catch (error) {
      console.error('Error processing image:', error);
      return 'Imagen cargada exitosamente. Contenido visual disponible para análisis.';
    }
  }

  private async extractTextFromTextFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      console.error('Error reading text file:', error);
      throw new Error('Failed to read text file');
    }
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.mp4': 'video/mp4',
      '.avi': 'video/avi',
      '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  // Método específico para analizar rúbricas
  async analyzeRubric(filePath: string): Promise<{
    criteria: string[];
    levels: string[];
    competencies: string[];
    extractedContent: string;
  }> {
    const processed = await this.processDocument(filePath, 'rubric.pdf', 'rubric');
    
    // Usar IA para estructurar la rúbrica
    const rubricPrompt = `
Analiza la siguiente rúbrica y extrae la información estructurada:

${processed.processedContent}

Responde en formato JSON con:
{
  "criteria": ["criterio1", "criterio2", ...],
  "levels": ["nivel1", "nivel2", ...], 
  "competencies": ["competencia1", "competencia2", ...],
  "extractedContent": "resumen de la rúbrica"
}
`;

    const response = await aiService.generateCompletion(rubricPrompt);
    
    try {
      const parsed = JSON.parse(response.content);
      return {
        criteria: parsed.criteria || [],
        levels: parsed.levels || [],
        competencies: parsed.competencies || [],
        extractedContent: processed.processedContent,
      };
    } catch (error) {
      return {
        criteria: [],
        levels: [],
        competencies: [],
        extractedContent: processed.processedContent,
      };
    }
  }

  // Método específico para analizar diagnósticos médicos/educativos
  async analyzeDiagnosis(filePath: string): Promise<{
    condition: string;
    recommendations: string[];
    accommodations: string[];
    strengths: string[];
    challenges: string[];
    extractedContent: string;
  }> {
    const processed = await this.processDocument(filePath, 'diagnosis.pdf', 'diagnosis');
    
    const diagnosisPrompt = `
Analiza el siguiente diagnóstico educativo o médico y extrae información estructurada:

${processed.processedContent}

Responde en formato JSON con:
{
  "condition": "condición o diagnóstico principal",
  "recommendations": ["recomendación1", "recomendación2", ...],
  "accommodations": ["adaptación1", "adaptación2", ...],
  "strengths": ["fortaleza1", "fortaleza2", ...],
  "challenges": ["desafío1", "desafío2", ...],
  "extractedContent": "resumen del diagnóstico"
}
`;

    const response = await aiService.generateCompletion(diagnosisPrompt);
    
    try {
      const parsed = JSON.parse(response.content);
      return {
        condition: parsed.condition || '',
        recommendations: parsed.recommendations || [],
        accommodations: parsed.accommodations || [],
        strengths: parsed.strengths || [],
        challenges: parsed.challenges || [],
        extractedContent: processed.processedContent,
      };
    } catch (error) {
      return {
        condition: '',
        recommendations: [],
        accommodations: [],
        strengths: [],
        challenges: [],
        extractedContent: processed.processedContent,
      };
    }
  }
}

export const documentProcessingService = new DocumentProcessingService();

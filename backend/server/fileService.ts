import multer from "multer";
import path from "path";
import fs from "fs/promises";
import { config } from "./config";
import { nanoid } from "nanoid";

// Ensure upload directory exists
export async function ensureUploadDir(studentId?: string) {
  const baseDir = path.join(process.cwd(), "uploads");
  const targetDir = studentId ? path.join(baseDir, studentId) : baseDir;
  
  try {
    await fs.access(targetDir);
  } catch {
    await fs.mkdir(targetDir, { recursive: true });
  }
  
  return targetDir;
}

// File type validation
const allowedMimeTypes = new Set([
  // Images
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  // Videos
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/wmv',
  'video/quicktime',
  // Audio
  'audio/mp3',
  'audio/wav',
  'audio/mpeg',
  'audio/ogg',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/html'
]);

const allowedExtensions = new Set([
  '.jpeg', '.jpg', '.png', '.gif', '.webp',
  '.mp4', '.avi', '.mov', '.wmv',
  '.mp3', '.wav', '.ogg',
  '.pdf', '.doc', '.docx', '.txt', '.html'
]);

// Configure multer with enhanced security
export const uploadConfig = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      try {
        const studentId = req.params.studentId || 'general';
        const dir = await ensureUploadDir(studentId);
        cb(null, dir);
      } catch (error) {
        cb(error as Error, '');
      }
    },
    filename: (req, file, cb) => {
      // Generate secure filename with nanoid
      const uniqueId = nanoid(10);
      const ext = path.extname(file.originalname).toLowerCase();
      const safeName = file.originalname
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .substring(0, 50); // Limit filename length
      
      const filename = `${Date.now()}-${uniqueId}-${safeName}`;
      cb(null, filename);
    }
  }),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype.toLowerCase();
    
    if (allowedMimeTypes.has(mimeType) && allowedExtensions.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${ext} (${mimeType})`));
    }
  },
  limits: {
    fileSize: config.MAX_FILE_SIZE,
    files: 5, // Max 5 files per request
    fieldSize: 2 * 1024 * 1024, // 2MB field size limit
  }
});

// File utilities
export class FileService {
  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  static async getFileInfo(filePath: string) {
    try {
      const stats = await fs.stat(filePath);
      return {
        exists: true,
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime
      };
    } catch {
      return {
        exists: false,
        size: 0,
        modified: null,
        created: null
      };
    }
  }

  static getFileType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
      return 'imagen';
    }
    if (['.mp4', '.avi', '.mov', '.wmv'].includes(ext)) {
      return 'video';
    }
    if (['.mp3', '.wav', '.ogg'].includes(ext)) {
      return 'audio';
    }
    if (['.pdf', '.doc', '.docx', '.txt', '.html'].includes(ext)) {
      return 'documento';
    }
    
    return 'otro';
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }
}

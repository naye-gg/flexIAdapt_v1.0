# FlexiAdapt Backend API

Backend API completo para la plataforma educativa adaptativa FlexiAdapt.

## 🚀 Tecnologías

- **Node.js** + **Express.js**
- **TypeScript**
- **PostgreSQL** (Neon)
- **Drizzle ORM**
- **OpenAI/Gemini APIs**
- **Multer** (File Upload)
- **Sharp** (Image Processing)

## 📁 Estructura

```
backend/
├── server/          # Código del servidor
│   ├── index.ts     # Punto de entrada
│   ├── routes.ts    # Definición de rutas API
│   ├── db.ts        # Configuración de base de datos
│   ├── storage.ts   # Operaciones de base de datos
│   ├── aiService.ts # Servicios de IA
│   └── chatService.ts # Servicio de chat
├── shared/          # Esquemas compartidos
│   └── schema.ts    # Esquema de base de datos y tipos
├── api/             # Funciones para Vercel
└── .env             # Variables de entorno
```

## 🛠️ Instalación

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores

# Generar migraciones de base de datos
pnpm db:generate

# Aplicar migraciones
pnpm db:push
```

## 🏃‍♂️ Desarrollo

```bash
# Ejecutar en modo desarrollo
pnpm dev

# Verificar tipos
pnpm check

# Studio de base de datos
pnpm db:studio
```

## 📊 API Endpoints Completos

### 🔐 **Autenticación**
```
GET    /api/health                    # Health check
POST   /api/auth/register             # Registrar profesor
POST   /api/auth/login                # Login de profesor
GET    /api/auth/me                   # Obtener perfil actual
```

### 👨‍🎓 **Estudiantes**
```
GET    /api/students                  # Lista de estudiantes
GET    /api/students/:id              # Obtener estudiante específico
POST   /api/students                  # Crear nuevo estudiante
PUT    /api/students/:id              # Actualizar estudiante
DELETE /api/students/:id              # Eliminar estudiante
```

### 👀 **Perspectivas del Profesor**
```
GET    /api/students/:studentId/perspective        # Obtener perspectiva
POST   /api/students/:studentId/perspective        # Crear perspectiva
PUT    /api/students/:studentId/perspective        # Actualizar perspectiva
```

### 📄 **Evidencias de Aprendizaje**
```
GET    /api/evidence                               # Todas las evidencias
GET    /api/students/:studentId/evidence           # Evidencias del estudiante
POST   /api/students/:studentId/evidence           # Subir nueva evidencia (con archivo)
POST   /api/evidence/:id/analyze                   # Analizar evidencia con IA
GET    /api/analysis-results/:evidenceId           # Obtener análisis de evidencia
```

### 🧠 **Perfiles de Aprendizaje**
```
GET    /api/students/:studentId/learning-profile   # Obtener perfil de aprendizaje
POST   /api/students/:studentId/learning-profile   # Crear perfil manualmente
POST   /api/students/:studentId/generate-ai-profile # Generar perfil con IA
```

### 💬 **Sistema de Chat IA**
```
GET    /api/students/:studentId/chats              # Lista de chats del estudiante
POST   /api/students/:studentId/chats              # Crear nuevo chat
GET    /api/chats/:chatId/messages                 # Obtener mensajes del chat
POST   /api/chats/:chatId/messages                 # Enviar mensaje (respuesta IA automática)
```

### 📊 **Estadísticas y Dashboard**
```
GET    /api/stats                                  # Estadísticas generales del dashboard
```

## 🤖 **Funcionalidades de IA**

### **Análisis de Evidencias**
- Extrae texto de PDFs e imágenes
- Analiza contenido educativo con IA
- Genera insights sobre el aprendizaje del estudiante
- Identifica fortalezas y áreas de mejora

### **Generación de Perfiles**
- Crea perfiles de aprendizaje personalizados
- Analiza múltiples evidencias del estudiante
- Sugiere estrategias educativas adaptativas

### **Chat Inteligente**
- Conversaciones contextualizadas sobre cada estudiante
- Respuestas basadas en el perfil y evidencias del estudiante
- Soporte para múltiples modelos de IA (GPT-4, Gemini)

## 🚀 Deploy

### Vercel
```bash
# Deploy a Vercel
vercel --prod
```

### Variables de entorno requeridas:
```env
# Base de datos
DATABASE_URL=postgresql://user:pass@host/db

# IA APIs
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key

# Servidor
SESSION_SECRET=your_secret_key
PORT=5000
NODE_ENV=production
```

## 📋 **Formato de Datos**

### **Estudiante**
```json
{
  "id": "string",
  "name": "string",
  "age": number,
  "grade": "string",
  "createdAt": "timestamp"
}
```

### **Evidencia**
```json
{
  "id": "string",
  "studentId": "string",
  "title": "string",
  "description": "string",
  "filePath": "string",
  "fileType": "string",
  "uploadDate": "timestamp"
}
```

### **Chat**
```json
{
  "id": "string",
  "studentId": "string",
  "teacherId": "string", 
  "title": "string",
  "createdAt": "timestamp"
}
```

### **Mensaje de Chat**
```json
{
  "id": "string",
  "chatId": "string",
  "role": "teacher" | "ai",
  "content": "string",
  "timestamp": "timestamp"
}
```

## 🔒 **Autenticación**

Todos los endpoints (excepto `/health` y `/auth/login`) requieren autenticación:

```
Header: Authorization: teacher_{teacherId}_{timestamp}
```

El sistema extrae automáticamente el `teacherId` del token para filtrar datos por profesor.


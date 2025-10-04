# FlexIAdapt - Empoderando la Educación Inclusiva

## 🎯 Descripción

**FlexIAdapt** es una plataforma digital que combina inteligencia artificial, análisis de datos educativos y herramientas pedagógicas especializadas para ayudar a los docentes a identificar, evaluar y adaptar su enseñanza a los diversos estilos de aprendizaje de sus estudiantes, con **especial énfasis en estudiantes neurodivergentes y con capacidades especiales cognitivas**.

### 💫 Slogan
> **"FlexIAdapt, empoderando la educación inclusiva"**

La plataforma nace de la necesidad real de los docentes de contar con herramientas especializadas para atender la **neurodivergencia** (TDAH, Autismo, Dislexia, etc.) y crear estrategias pedagógicas adaptadas que permitan a cada estudiante desarrollar su máximo potencial a través de su manera única de aprender.

## ✨ Características Principales

- **🧠 Generación de Perfiles IA**: Creación automática de perfiles de aprendizaje personalizados basados en evidencias analizadas
- **📊 Análisis Adaptativo**: Evaluación inteligente de evidencias con puntuaciones adaptadas a las necesidades individuales
- **🧩 Enfoque Neurodivergente**: Herramientas especializadas para estudiantes con TDAH, Autismo, Dislexia y otras neurodivergencias
- **🎨 Análisis por Modalidades**: Identificación precisa de estilos de aprendizaje (Visual, Auditivo, Kinestésico)
- **📁 Gestión de Evidencias**: Subida y análisis multimodal de documentos, imágenes, videos y audio
- **👥 Perfiles Estudiantiles Detallados**: Gestión completa con enfoque en diversidad e inclusión
- **📈 Dashboard Pedagógico**: Visualización en tiempo real de estadísticas y métricas educativas
- **💬 Comunicación Educativa**: Sistema de mensajería entre docentes y estudiantes
- **📋 Reportes Especializados**: Generación de reportes detallados con recomendaciones pedagógicas

## 🏗️ Arquitectura

### Frontend (React + TypeScript)
- **Framework**: React 18 con TypeScript
- **UI**: Tailwind CSS + shadcn/ui
- **Estado**: React Query (TanStack Query)
- **Routing**: Wouter
- **Formularios**: React Hook Form

### Backend (Node.js + Express)
- **Runtime**: Node.js con TypeScript
- **Framework**: Express.js
- **Base de Datos**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **IA**: Google Gemini API + GitHub Models
- **Autenticación**: Basada en tokens
- **Archivos**: Multer para uploads

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+
- npm o pnpm
- Cuenta de Neon Database (PostgreSQL)
- API Keys de Google Gemini y GitHub Models

### 1. Clonar el Repositorio

```bash
git clone <url-del-repositorio>
cd FlexiAdapt-Separated
```

### 2. Configurar el Backend

```bash
cd backend
npm install
```

Crear archivo `.env` en la carpeta `backend`:

```env
# Base de datos
DATABASE_URL=postgresql://user:password@host/database

# APIs de IA
GOOGLE_API_KEY=tu_google_api_key
GITHUB_TOKEN=tu_github_token

# Configuración del servidor
NODE_ENV=development
PORT=5000
```

### 3. Configurar el Frontend

```bash
cd ../frontend
npm install
```

Crear archivo `.env` en la carpeta `frontend`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_BACKEND_URL=http://localhost:5000
```

### 4. Ejecutar Migraciones de Base de Datos

```bash
cd backend
npm run db:push
```

### 5. Iniciar la Aplicación

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

La aplicación estará disponible en:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000

## 📚 Uso de la Plataforma

### 1. Registro e Inicio de Sesión
- Crear cuenta de docente
- Iniciar sesión con credenciales

### 2. Gestión de Estudiantes
- Agregar estudiantes con información detallada
- Incluir perfil neurodivergente y materias principales

### 3. Subida de Evidencias
- Cargar archivos (documentos, imágenes, videos, audio)
- Completar rúbricas y criterios de evaluación
- Agregar observaciones del docente

### 4. Análisis IA
- El sistema analiza automáticamente las evidencias
- Genera puntuaciones adaptativas
- Identifica modalidades de aprendizaje

### 5. Generación de Perfiles
- Crear perfiles de aprendizaje con IA
- Obtener recomendaciones pedagógicas
- Adaptar estrategias de enseñanza

### 6. Análisis y Reportes
- Visualizar estadísticas en el dashboard
- Exportar reportes detallados en Excel
- Analizar distribución por modalidades

## 🗄️ Estructura de la Base de Datos

### Tablas Principales

- **teachers**: Información de docentes
- **students**: Datos de estudiantes
- **evidence**: Evidencias subidas
- **analysis_results**: Resultados del análisis IA
- **learning_profiles**: Perfiles de aprendizaje generados
- **teacher_perspectives**: Observaciones del docente
- **chat_messages**: Sistema de mensajería

## 🔧 Scripts Disponibles

### Backend
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Compilar para producción
npm run start        # Iniciar servidor de producción
npm run db:push      # Aplicar cambios al esquema
npm run db:studio    # Abrir Drizzle Studio
```

### Frontend
```bash
npm run dev          # Servidor de desarrollo
npm run build        # Compilar para producción
npm run preview      # Vista previa de producción
npm run lint         # Ejecutar linter
```

## 🤖 Integración con IA

### Google Gemini
- Análisis de contenido de evidencias
- Generación de perfiles de aprendizaje
- Recomendaciones pedagógicas personalizadas

### GitHub Models
- Procesamiento de texto y documentos
- Análisis de patrones de aprendizaje
- Clasificación de modalidades educativas

## 🔐 Autenticación

El sistema utiliza autenticación basada en tokens:

```javascript
// Header de autorización
Authorization: teacher_{teacherId}_{timestamp}
```

## 📊 APIs Principales

### Estudiantes
```
GET    /api/students              # Listar estudiantes
POST   /api/students              # Crear estudiante
GET    /api/students/:id          # Obtener estudiante
PUT    /api/students/:id          # Actualizar estudiante
DELETE /api/students/:id          # Eliminar estudiante
```

### Evidencias
```
GET    /api/evidence              # Listar evidencias
POST   /api/upload                # Subir evidencia
GET    /api/evidence/:id/analysis # Obtener análisis
```

### Estadísticas
```
GET    /api/stats                 # Obtener estadísticas del dashboard
```

### Perfiles IA
```
POST   /api/students/:id/generate-ai-profile  # Generar perfil con IA
```

## 🎨 Componentes UI

El proyecto utiliza una biblioteca de componentes personalizada basada en shadcn/ui:

- **Cards**: Tarjetas informativas
- **Forms**: Formularios con validación
- **Tables**: Tablas de datos
- **Charts**: Gráficos y visualizaciones
- **Dialogs**: Modales y ventanas emergentes

## 🚀 Despliegue

### Vercel (Recomendado para Frontend)
```bash
cd frontend
vercel --prod
```

### Railway/Heroku (Backend)
```bash
cd backend
# Configurar variables de entorno
# Desplegar según la plataforma elegida
```

## 🔍 Troubleshooting

### Problemas Comunes

**Error de conexión a la base de datos:**
- Verificar la cadena de conexión DATABASE_URL
- Asegurar que la base de datos esté activa

**APIs de IA no funcionan:**
- Verificar las API keys en el archivo .env
- Comprobar límites de uso de las APIs

**Problemas de CORS:**
- Verificar la configuración de CORS en el backend
- Asegurar que las URLs coincidan

## 🧩 Enfoque en Neurodivergencia

**FlexIAdapt** está específicamente diseñado para atender estudiantes con:

- **🧠 TDAH (Trastorno por Déficit de Atención e Hiperactividad)**
- **🌟 TEA (Trastorno del Espectro Autista)**  
- **📖 Dislexia y dificultades específicas del aprendizaje**
- **🎯 Trastornos del procesamiento sensorial**
- **💭 Otras neurodivergencias cognitivas**

### 🔍 **Detección Inteligente:**
La IA analiza patrones en las evidencias estudiantiles para identificar indicadores de neurodivergencia y generar estrategias pedagógicas personalizadas que respeten y potencien la forma única de aprender de cada estudiante.

## 🌍 Impacto Social

**FlexIAdapt** aborda problemas reales en la educación inclusiva:

### 🎯 **Problemas que Resolvemos:**
- **Falta de herramientas especializadas** para estudiantes neurodivergentes
- **Dificultades para adaptar** evaluaciones a diferentes formas de procesamiento
- **Ausencia de identificación temprana** de patrones neurodivergentes
- **Sobrecarga docente** al crear adaptaciones individualizadas
- **Inequidad educativa** para estudiantes con diferencias cognitivas

### 💪 **Nuestro Impacto:**
- **Educación más inclusiva** para estudiantes neurodivergentes
- **Reducción del tiempo** de evaluación y análisis docente
- **Mejora en la identificación** de potencialidades estudiantiles
- **Personalización efectiva** de estrategias pedagógicas
- **Empoderamiento docente** con herramientas de IA

## 🤝 Contribución

¡Únete a nuestra misión de transformar la educación! 

1. Fork el proyecto
2. Crear una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit los cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear un Pull Request

### 🎯 **Áreas donde Necesitamos Ayuda:**
- Desarrollo de algoritmos especializados en neurodivergencia
- Mejoras en accesibilidad cognitiva y sensorial
- Validación con especialistas en TEA, TDAH y dislexia
- Traducción a otros idiomas
- Testing con docentes especializados en educación inclusiva

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 Equipo de Desarrollo

**FlexIAdapt** fue desarrollado por un equipo multidisciplinario comprometido con la educación inclusiva:

- **🧑‍💻 Nayeli Guerrero** - Developer & Project Lead
- **🎓 Claudia Calderón** - Facilitadora EdTech
- **👩‍🏫 Ruth Luján** - Docente de Enseña Perú
- **🧑‍🎓 Jasyr Valdez** - Colaborador & Feedback

### 💡 Inspiración del Proyecto

Este proyecto nace de los **dolores reales compartidos por Ruth Luján**, docente de Enseña Perú, quien nos ayudó a entender las necesidades específicas de los educadores en el aula, especialmente al trabajar con **estudiantes neurodivergentes** (TDAH, Autismo, Dislexia) que requieren enfoques pedagógicos diferenciados.

### 🛠️ Distribución de Trabajo

Este proyecto fue un esfuerzo colaborativo donde cada miembro aportó desde su expertise:
- **Nayeli** se encargó del diseño y desarrollo técnico fullstack del proyecto
- **Claudia** aportó experiencia en EdTech y apoyó la validación pedagógica de las funcionalidades
- **Ruth** compartió insights reales del aula y validó la utilidad práctica de las herramientas
- **Jasyr** participó proporcionando feedback y reflexiones constructivas

## 🙏 Agradecimientos

- **Enseña Perú** por conectarnos con la realidad educativa del país
- **Ruth Luján** por compartir su experiencia y necesidades como docente
- **EdTech y AIdea** por organizar la hackathon y ser el ecosistema de creación de FlexIAdapt
- **Google Gemini API** por el procesamiento avanzado de IA
- **GitHub Models** por las capacidades de machine learning
- **Comunidad de shadcn/ui** por los componentes de interfaz
- **Neon Database** por el hosting confiable de PostgreSQL
- **Todos los educadores** que luchan por una educación más inclusiva cada día

---

## 📞 Soporte

Para soporte técnico o consultas, por favor:

1. Revisar la documentación
2. Buscar en los issues existentes
3. Crear un nuevo issue con detalles del problema

---

## 🎯 Misión

Empoderar a los docentes con herramientas de inteligencia artificial para crear experiencias educativas verdaderamente inclusivas, donde cada estudiante neurodivergente pueda alcanzar su máximo potencial a través de estrategias pedagógicas adaptadas a su forma única de procesar información.

## 🌟 Visión

Ser la plataforma líder en educación adaptativa e inclusiva, transformando la manera en que los docentes entienden, evalúan y responden a la diversidad en el aula.

---

**¡Transforma la educación con FlexIAdapt - Empoderando la educación inclusiva! 🎓🧩✨**

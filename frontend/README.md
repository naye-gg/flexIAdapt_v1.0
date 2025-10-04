# FlexiAdapt Frontend

Frontend de la plataforma educativa adaptativa FlexiAdapt - Interfaz para profesores.

## 🚀 Tecnologías

- **React 18** + **TypeScript**
- **Vite** (Build tool)
- **Tailwind CSS** + **Shadcn/ui**
- **React Hook Form** + **Zod**
- **React Query** (TanStack Query)
- **React Router** (Wouter)
- **Recharts** (Gráficos)

## 📁 Estructura

```
frontend/
├── src/
│   ├── components/          # Componentes reutilizables
│   │   ├── ui/             # Componentes base (Shadcn)
│   │   ├── auth/           # Componentes de autenticación  
│   │   ├── layout/         # Layout y navegación
│   │   ├── evidence-upload.tsx
│   │   ├── student-card.tsx
│   │   ├── student-chat.tsx
│   │   └── student-form.tsx
│   ├── pages/              # Páginas de la aplicación
│   │   ├── dashboard.tsx   # Dashboard principal
│   │   ├── students.tsx    # Lista de estudiantes
│   │   ├── student-profile.tsx
│   │   ├── evidence.tsx    # Gestión de evidencias
│   │   └── analysis.tsx    # Análisis y reportes
│   ├── hooks/              # Hooks personalizados
│   │   ├── useAuth.ts      # Autenticación
│   │   └── use-toast.ts    # Notificaciones
│   ├── lib/                # Utilidades y configuración
│   │   ├── api.ts          # Cliente API
│   │   ├── api-auth.ts     # Autenticación API
│   │   └── utils.ts        # Utilidades generales
│   └── App.tsx             # Componente principal
├── public/                 # Archivos estáticos
└── dist/                   # Build de producción
```

## 🛠️ Instalación

```bash
# Instalar dependencias
pnpm install

# Configurar variables de entorno
cp .env.example .env
# Configurar URLs del backend

# Desarrollo
pnpm run dev

# Build para producción
pnpm run build
```

## ⚙️ Configuración

### Variables de entorno (.env):
```env
# URL del backend (desarrollo)
VITE_API_URL=http://localhost:5000/api
VITE_BACKEND_URL=http://localhost:5000

# URL del backend (producción)
# VITE_API_URL=https://tu-backend.vercel.app/api
# VITE_BACKEND_URL=https://tu-backend.vercel.app
```

## 🎯 **Funcionalidades Principales**

### 📊 **Dashboard**
- Estadísticas generales de estudiantes
- Número de evidencias analizadas
- Perfiles generados
- Progreso de análisis

### 👨‍🎓 **Gestión de Estudiantes**
- Lista completa de estudiantes
- Crear/editar/eliminar estudiantes
- Perfil detallado de cada estudiante
- Perspectiva del profesor sobre el estudiante

### 📄 **Evidencias de Aprendizaje**
- Subir documentos (PDF, imágenes, Word)
- Visualizar evidencias por estudiante
- Análisis automático con IA
- Resultados y insights del análisis

### 🧠 **Perfiles de Aprendizaje**
- Generar perfiles con IA
- Editar perfiles manualmente
- Visualizar fortalezas y debilidades
- Recomendaciones educativas

### 💬 **Chat IA Contextualizado**
- Conversaciones sobre cada estudiante
- Chat inteligente con contexto del estudiante
- Historial de conversaciones
- Respuestas basadas en evidencias y perfil

### 📈 **Análisis y Reportes**
- Gráficos de progreso del estudiante
- Comparativas entre estudiantes
- Reportes de evidencias
- Métricas de aprendizaje

## 🎨 **Sistema de Diseño**

### **Componentes Base (Shadcn/ui)**
- Button, Input, Card, Dialog
- Toast (Notificaciones)
- Form (Formularios validados)
- Tabs, Sidebar, Dropdown

### **Tema y Colores**
- Design system consistente
- Modo oscuro/claro (opcional)
- Colores accesibles
- Tipografía clara

## 🔐 **Autenticación**

### **Flujo de Login**
1. Login con email/contraseña
2. Token almacenado en localStorage
3. Renovación automática de sesión
4. Redirección a dashboard

### **Protección de Rutas**
- Todas las páginas requieren autenticación
- Redirección automática al login
- Manejo de sesión expirada

## 🚀 **Deployment**

### **Vercel (Recomendado)**
```bash
# Instalar Vercel CLI
pnpm add -g vercel

# Deploy
vercel --prod

# Configurar variables de entorno en Vercel dashboard
```

### **Netlify**
```bash
# Build
pnpm run build

# Subir carpeta dist/ a Netlify
```

### **Variables de entorno en producción:**
- `VITE_API_URL`: URL del backend en producción
- `VITE_BACKEND_URL`: URL base del backend

## 📱 **Responsive Design**

- ✅ Mobile First
- ✅ Tablet optimizado  
- ✅ Desktop completo
- ✅ Navegación adaptativa
- ✅ Componentes responsive

## 🔄 **Estado y Caching**

### **React Query (TanStack)**
- Cache automático de datos
- Invalidación inteligente
- Sincronización en tiempo real
- Optimistic updates

### **Estados Locales**
- Formularios con React Hook Form
- UI state con useState/useReducer
- Tema y preferencias en localStorage


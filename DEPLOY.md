# 🚀 Guía de Despliegue - FlexIAdapt

## 📋 Prerrequisitos

- [ ] Cuenta de GitHub con el repositorio subido
- [ ] Cuenta de Vercel (para frontend)
- [ ] Cuenta de Railway (para backend)
- [ ] Base de datos PostgreSQL (Neon recomendado)
- [ ] API Keys de Google Gemini y GitHub Models

## 🗄️ 1. Configurar Base de Datos

### Opción A: Neon Database (Recomendado)
1. Ve a [neon.tech](https://neon.tech)
2. Crea una nueva base de datos
3. Copia la CONNECTION STRING

### Opción B: Railway PostgreSQL
1. En Railway, crea un nuevo servicio PostgreSQL
2. Copia las credenciales de conexión

## 🖥️ 2. Desplegar Backend (Railway)

### Paso 1: Crear nuevo proyecto en Railway
1. Ve a [railway.app](https://railway.app)
2. Conecta tu cuenta de GitHub
3. Selecciona "Deploy from GitHub repo"
4. Elige el repositorio `flexIAdapt_v1.0`

### Paso 2: Configurar variables de entorno
En Railway, ve a Variables y agrega:

```
DATABASE_URL=tu_connection_string_de_neon
GOOGLE_API_KEY=tu_google_api_key
GITHUB_TOKEN=tu_github_token
NODE_ENV=production
PORT=5000
```

### Paso 3: Configurar Build
- Railway detectará automáticamente el proyecto Node.js
- Asegúrate que esté usando el directorio `/backend`
- El comando de start será: `pnpm start`

### Paso 4: Verificar despliegue
- Railway te dará una URL como: `https://flexiadapt-backend-production.up.railway.app`
- Prueba: `https://tu-url/api/health`

## 🌐 3. Desplegar Frontend (Vercel)

### Paso 1: Conectar repositorio
1. Ve a [vercel.com](https://vercel.com)
2. Importa el repositorio desde GitHub
3. Selecciona el directorio `/frontend`

### Paso 2: Configurar variables de entorno
En Vercel, ve a Settings > Environment Variables:

```
VITE_API_URL=https://tu-backend-url.railway.app/api
VITE_BACKEND_URL=https://tu-backend-url.railway.app
```

### Paso 3: Configurar Build Settings
- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Root Directory: `frontend`

### Paso 4: Deploy
- Vercel desplegará automáticamente
- Te dará una URL como: `https://flexiadapt.vercel.app`

## 🔄 4. Configurar CORS (Importante)

Una vez tengas ambas URLs, actualiza el backend para permitir el frontend:

1. En tu archivo de configuración del backend, agrega el dominio de Vercel a CORS
2. Redeploya el backend si es necesario

## ✅ 5. Verificación Final

### Backend Health Check:
```bash
curl https://tu-backend-url.railway.app/api/health
```

### Frontend:
- Abre `https://tu-frontend-url.vercel.app`
- Verifica que pueda conectar al backend
- Prueba login y funcionalidades básicas

## 🔧 6. Configuración Post-Despliegue

### Base de Datos:
```bash
# Ejecutar migraciones (si es necesario)
# Conectarse a Railway y ejecutar:
pnpm run db:push
```

### Datos de Prueba:
- Crear un usuario docente de prueba
- Subir algunas evidencias de ejemplo
- Verificar que la IA funcione correctamente

## 📝 7. URLs Finales

Una vez completado el despliegue:

- **Frontend**: `https://flexiadapt.vercel.app`
- **Backend**: `https://flexiadapt-backend.railway.app`
- **API Docs**: `https://flexiadapt-backend.railway.app/api`

## 🛟 8. Troubleshooting

### Error de CORS:
- Verificar que el frontend esté en las variables de entorno del backend
- Comprobar configuración de CORS en el backend

### Error de Base de Datos:
- Verificar CONNECTION_STRING
- Ejecutar migraciones si es necesario

### Error de API Keys:
- Verificar que las API keys estén configuradas correctamente
- Comprobar límites de uso de las APIs

### Error de Build:
- Verificar que todas las dependencias estén en package.json
- Comprobar que los scripts de build funcionen localmente

## 🔄 9. Actualizaciones Futuras

Para desplegar actualizaciones:

1. **Hacer push al repositorio**:
   ```bash
   git add .
   git commit -m "feat: nueva funcionalidad"
   git push origin main
   ```

2. **Vercel y Railway** se actualizarán automáticamente

## 🚨 10. Monitoreo

- **Railway**: Monitorea logs y métricas de rendimiento
- **Vercel**: Revisa analytics y Core Web Vitals
- **Neon**: Monitorea uso de la base de datos

---

¡Tu aplicación FlexIAdapt estará lista para transformar la educación inclusiva! 🎓✨

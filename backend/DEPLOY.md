# Instrucciones de Despliegue para Vercel

## Pasos para desplegar en Vercel

### 1. Preparar el repositorio
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### 2. Configurar en Vercel
1. Ve a [vercel.com](https://vercel.com) e inicia sesión
2. Conecta tu repositorio de GitHub
3. Vercel detectará automáticamente la configuración desde `vercel.json`
4. Configura las siguientes variables de entorno en Vercel:
   - `GEMINI_API_KEY`: Tu clave de API de Google Gemini
   - `GITHUB_TOKEN`: Tu token de GitHub para AI Models
   - `DATABASE_URL`: URL de base de datos (usar Turso o similar para producción)
   - `DATABASE_AUTH_TOKEN`: Token de autenticación para Turso
   - `NODE_ENV`: production

### 3. Configuración de Base de Datos
Para producción, recomendamos usar Turso (SQLite distribuido):

1. Instala Turso CLI:
```bash
curl -sSfL https://get.tur.so/install.sh | bash
```

2. Crea una base de datos:
```bash
turso db create flexiadapt-prod
turso db show flexiadapt-prod
```

3. Obtén la URL de conexión:
```bash
turso db show flexiadapt-prod --url
turso db tokens create flexiadapt-prod
```

4. Configura las variables en Vercel:
   - `DATABASE_URL`: libsql://[your-db-url]
   - `DATABASE_AUTH_TOKEN`: [your-auth-token]

### 4. Estructura de archivos para Vercel
El proyecto está configurado con:
- `/api/index.ts` - Función serverless principal
- `/vercel.json` - Configuración de Vercel
- `/client/` - Frontend React

### 5. Comandos útiles
```bash
# Instalar dependencias
npm install

# Build local del frontend
npm run build

# Desarrollar localmente
npm run dev

# Verificar que el build funciona
npx vercel build

# Deploy directo desde CLI (opcional)
npx vercel --prod
```

### 6. Configuración simplificada
El proyecto está configurado para deployment automático:
- `vercel.json` define toda la configuración necesaria
- No necesita instalaciones manuales de npm
- Build automático del frontend React
- API serverless en `/api/index.ts`

### 7. Notas importantes
- El frontend se sirve estáticamente desde `/client/dist/`
- Las API routes están en `/api/`
- Los uploads de archivos se manejan en memoria para serverless
- La base de datos SQLite local se reemplaza por Turso en producción
- Vercel maneja automáticamente las dependencias y el build process

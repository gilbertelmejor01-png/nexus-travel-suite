# Configuración de Variables de Entorno

## Pasos para configurar la API de OpenAI:

1. **Crear archivo `.env` en la raíz del proyecto:**
```bash
VITE_OPENAI_API_KEY=tu_clave_api_aqui
```

2. **Reemplazar `tu_clave_api_aqui` con tu clave real de OpenAI**

3. **Reiniciar el servidor de desarrollo:**
```bash
npm run dev
```

## ⚠️ Importante:
- Nunca subas el archivo `.env` al repositorio
- El archivo `.env` ya está en `.gitignore`
- Usa variables de entorno para mantener las claves seguras

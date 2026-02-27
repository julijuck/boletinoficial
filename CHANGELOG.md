# Changelog

Todos los cambios notables de este proyecto se documentan en este archivo.

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [1.0.0] - 2026-02-27

### Agregado

- **Scraping del Boletín Oficial** con URL dinámica por fecha (`/seccion/primera/YYYYMMDD`) usando Firecrawl.
- **Validación de fecha** del contenido scrapeado mediante `parseSpanishDate()`, asegurando que coincida con la fecha actual.
- **Resúmenes con IA** de cada normativa (máx. 2 renglones) usando Gemini Flash vía Lovable AI Gateway con tool calling estructurado.
- **Envío de emails** con Resend en lotes de 50, con plantilla HTML responsive que incluye categorías y links al detalle de cada norma.
- **Gestión de suscriptores**: alta con confirmación por email (double opt-in), token único de desuscripción por suscriptor.
- **Página de desuscripción** (`/unsubscribe`) con feedback visual al usuario.
- **Página de vista previa del email** (`/email-preview`) para verificar el formato antes del envío.
- **Automatización con cron** (`pg_cron`): ejecución de lunes a viernes a las 7:30 ART (10:30 UTC).
- **Tablas `editions` y `subscribers`** con RLS habilitado y políticas de acceso público para lectura/escritura de suscriptores.
- **Landing page** con formulario de suscripción y contador de suscriptores activos.

### Corregido

- URL genérica del Boletín Oficial no mostraba la edición más reciente; reemplazada por URL con fecha explícita.
- Regex de extracción de fecha fallaba cuando el texto estaba partido en múltiples líneas del Markdown; corregido colapsando saltos de línea antes del match.



## Plan: Ajustar cron y textos de la landing

### 1. Cambiar schedule del cron job
- Actualmente: `0 10 * * 1-5` (solo lunes a viernes, 10:00 UTC)
- Nuevo: `0 10 * * *` (todos los días, 10:00 UTC = 7:00 AM ART)
- La edge function ya maneja el caso de que no haya edición (devuelve "No entries found" si el scraping no encuentra normativas), así que correr todos los días es seguro: si es feriado o fin de semana sin edición, simplemente no hace nada.
- Se ejecutará via UPDATE en `cron.job`.

### 2. Quitar el chequeo de fin de semana en la edge function
- Actualmente `process-boletin/index.ts` tiene un bloque que detecta sábado/domingo y retorna sin hacer nada.
- Se eliminará ese chequeo para que el único criterio sea si hay contenido en el Boletín Oficial (si no hay entradas, no se envía nada).

### 3. Cambios en la landing (`src/pages/Index.tsx`)
- **Titulo hero**: Separar en dos líneas con `<br />`:
  ```
  Boletín Oficial:
  Tu resumen diario
  ```
- **Subtitulo**: Cambiar a: "Recibí un resumen con IA de cada nueva edición. Títulos, extractos concisos y links directos en tu correo."
- **Tarjeta**: Cambiar "Cada día hábil" a "Cada nueva edición" y descripción a "Automático con cada nueva publicación, sin feriados ni fines de semana."

### 4. Página de preview del email (`src/pages/EmailPreview.tsx`)
- Nueva ruta `/preview-email` que carga la edición más reciente de la tabla `editions` y renderiza el HTML del email en un iframe.
- Se replica la función `buildEmailHtml` del lado del cliente para generar el preview.
- Se agrega la ruta en `src/App.tsx`.

### Archivos a modificar
- `supabase/functions/process-boletin/index.ts` — eliminar chequeo de fin de semana
- `src/pages/Index.tsx` — textos del hero y tarjetas
- `src/pages/EmailPreview.tsx` — nueva página
- `src/App.tsx` — agregar ruta `/preview-email`
- Base de datos — UPDATE del schedule del cron job a `0 10 * * *`

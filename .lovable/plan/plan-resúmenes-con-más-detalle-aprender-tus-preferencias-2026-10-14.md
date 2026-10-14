## Plan: Resúmenes con más detalle + aprender tus preferencias

### Respuesta corta sobre costos
- **Resumen con detalle**: sí se puede, y el costo es bajo. Hoy la IA solo ve el título de la norma, por eso el resumen es genérico. Para que diga "se trata del acuerdo con el BID...", necesita leer el texto de cada norma. Vamos a bajarlo directo del sitio del Boletín (gratis), sin usar el servicio pago de lectura de páginas. La IA sigue siendo una sola llamada por día, apenas más larga.
- **Aprender tus preferencias**: también es barato. No hace falta inteligencia artificial cara: con tus votos (pulgar arriba / abajo) armamos un puntaje por tipo de norma y por organismo (ej. "Decretos", "Ministerio de Economía", "BCRA") y ordenamos el mail según eso. Va mejorando solo a medida que votás.

### 1. Resumen con detalle (máximo 2 renglones)
- Para cada norma del día, se lee el texto completo desde su página en el Boletín (solo los primeros párrafos, que es donde está lo importante).
- La IA escribe 2 renglones: qué tipo de acto es + de qué se trata concretamente (partes, montos, objeto).
- Si alguna página no se puede leer, se usa el resumen actual como respaldo, sin cortar el envío.

### 2. Votos desde el mail
- Debajo de cada norma aparecen dos enlaces: 👍 y 👎.
- Al tocarlos se abre una página simple que dice "¡Gracias, lo tendremos en cuenta!". No hace falta iniciar sesión (cada enlace lleva tu código personal, igual que el de desuscripción).
- Cada voto queda guardado con la categoría, el organismo y el título de la norma.

### 3. Orden según tus gustos
- Cada día se calcula un puntaje por norma según tus votos anteriores en esa categoría y ese organismo.
- Arriba del mail aparece una sección **"Destacadas para vos"** con las 5 de mayor puntaje; abajo sigue el listado completo por categoría como hoy.
- Mientras tengas pocos votos (primeras semanas), el mail se ve igual que ahora.

### Detalles técnicos
- `process-boletin`: fetch directo (sin Firecrawl) de cada `detalleAviso`, en paralelo con límite de concurrencia (~8) y timeout de 8 s; se extraen ~1500 caracteres de texto. Fallback a la descripción actual.
- Prompt de Gemini actualizado para usar ese texto; se mantiene una única llamada con tool calling.
- Nueva tabla `norm_feedback` (subscriber_token, edition_date, category, organism, title, url, vote ±1, created_at). Solo accesible desde funciones del servidor (service_role), sin acceso público.
- Nueva función `feedback` (GET con `token`, `url`, `vote`) que valida el token contra `subscribers`, guarda el voto y devuelve una página HTML de agradecimiento.
- Ranking: puntaje = suma suavizada de votos por categoría + por organismo del suscriptor; sección "Destacadas" cuando hay al menos 10 votos.
- Se verifica disparando la función manualmente y revisando el mail recibido.



# 📰 Resumen Diario del Boletín Oficial

App que scrapea diariamente la primera sección del Boletín Oficial argentino, genera resúmenes con IA, y los envía por email a los suscriptores.

---

## 1. Página de suscripción
- Landing page simple y atractiva que explique el servicio: "Recibí cada día hábil un resumen de la primera sección del Boletín Oficial en tu correo"
- Formulario con campo de email para suscribirse
- Confirmación visual al suscribirse
- Opción para desuscribirse (link en cada email)

## 2. Scraping del Boletín Oficial
- Edge function que accede al Boletín Oficial (primera sección) usando Firecrawl
- Extrae los títulos de cada normativa publicada
- Se ejecuta automáticamente cada día hábil a las mañanas (cron job)
- Detecta si hay nueva edición (no se ejecuta fines de semana/feriados)

## 3. Resumen con IA
- Cada normativa extraída se procesa con Lovable AI (Gemini)
- Se genera un extracto de ~2 renglones claro y conciso de cada norma
- El prompt está optimizado para lenguaje jurídico argentino

## 4. Envío de email
- Se compone un email limpio y legible con:
  - Fecha de la edición
  - Lista de normativas con título + extracto IA
  - Link a la normativa completa en el Boletín Oficial
- Se envía a todos los suscriptores activos
- Incluye link de desuscripción

## 5. Base de datos
- Tabla de suscriptores (email, estado activo/inactivo, fecha de suscripción)
- Tabla de ediciones procesadas (fecha, contenido, estado de envío)

---

**Servicios necesarios:** Lovable Cloud, Firecrawl (scraping), Lovable AI (resúmenes), email vía Cloud


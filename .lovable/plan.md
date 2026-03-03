

## Plan: Diagnosticar y corregir el envío de emails

### Problema
La función `process-boletin` reporta `email_sent: true` pero los emails no llegan. No hay logs disponibles de la ejecución para ver qué respondió Resend. No podemos reproducir el problema porque la función dice "Already processed today".

### Cambios

**1. Crear una edge function de prueba `test-email`** que envíe un solo email de prueba usando la misma configuración de Resend. Esto permitirá ver en tiempo real si Resend acepta o rechaza el envío, y qué responde exactamente.

**2. Mejorar el logging en `process-boletin`** para registrar el response body completo de Resend (tanto en éxito como en error), incluyendo el `id` del email que Resend devuelve cuando acepta un envío. Esto dará visibilidad en futuras ejecuciones.

**3. Registrar el resultado de cada email en la respuesta final** de la función, para poder ver desde el curl si los envíos fueron exitosos o no, sin depender de logs efímeros.

### Detalles tecnicos

- Nueva función: `supabase/functions/test-email/index.ts`
  - Toma el email del body del request
  - Usa la misma configuración de `from`, subject, y Resend API key
  - Devuelve el response completo de Resend (status + body)

- Modificar: `supabase/functions/process-boletin/index.ts`
  - Log del response body de Resend en cada envío
  - Acumular resultados (éxito/error por email) y devolverlos en el JSON de respuesta
  - Agregar campo `email_results` al response

### Resultado esperado
Podremos ejecutar `test-email` ahora mismo para ver exactamente qué responde Resend, y en futuras ejecuciones del cron tendremos visibilidad completa del resultado de cada envío.


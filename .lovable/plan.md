

## Plan: Re-enviar boletín de hoy y ajustar horario del cron

### Paso 1: Borrar la edición de hoy y re-disparar la función
La función detecta que ya procesó la edición de hoy y la saltea ("Already processed today"). Para forzar el re-envío:
1. Borrar el registro de la tabla `editions` con `edition_date = '2026-02-27'`
2. Volver a llamar la función `process-boletin` para que scrappee, resuma y envíe los emails a los suscriptores activos

### Paso 2: Actualizar el horario del cron
El cron actual está configurado a las **10:00 UTC (7:00 AM ART)**, que es correcto. Sin embargo, para dar más margen y asegurar que el Boletín ya esté publicado, lo cambiaremos a **10:30 UTC (7:30 AM ART)**.

SQL a ejecutar:
```sql
SELECT cron.unschedule(2);

SELECT cron.schedule(
  'process-boletin-daily',
  '30 10 * * 1-5',
  $$
  SELECT net.http_post(
    url:='https://lehgtxqjmummqzzuseqc.supabase.co/functions/v1/process-boletin',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlaGd0eHFqbXVtbXF6enVzZXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTgxNDcsImV4cCI6MjA4NzczNDE0N30.VGzT6CitEUUEVV8ARsFuP_6kT4m2Ig57P0_2Jadyuz4"}'::jsonb,
    body:='{}'::jsonb
  ) AS request_id;
  $$
);
```

Notas:
- Se usa `1-5` (lunes a viernes) ya que el Boletín no se publica fines de semana
- El horario 7:30 AM ART da margen para que la edición del día ya esté online

### Resumen de acciones
1. DELETE del registro de hoy en `editions`
2. Llamada manual a `process-boletin` para enviar el boletín
3. Actualizar el cron a 7:30 AM ART, solo días hábiles

SELECT cron.unschedule('process-boletin-daily');
SELECT cron.schedule(
  'process-boletin-daily',
  '30 10 * * 1-5',
  $cron$
  SELECT net.http_post(
    url:='https://lehgtxqjmummqzzuseqc.supabase.co/functions/v1/process-boletin',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6ImxoZ3R4cWptdW1tcXp6dXNlcWMiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc3MjE1ODE0NywiZXhwIjoyMDg3NzM0MTQ3fQ.VGzT6CitEUUEVV8ARsFuP_6kT4m2Ig57P0_2Jadyuz4"}'::jsonb,
    body:='{}'::jsonb,
    timeout_milliseconds:=300000
  ) AS request_id;
  $cron$
);
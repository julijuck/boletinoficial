
Objetivo: eliminar definitivamente la pantalla blanca en la versión publicada y evitar que un fallo de inicialización rompa todo el frontend.

Diagnóstico que ya confirmé
- La URL publicada responde con HTML mínimo (`#root`) y visualmente queda en blanco.
- En preview el proyecto sí funciona.
- No hay logs útiles del iframe en este último reporte.
- El arranque actual sigue siendo frágil porque:
  1) `App.tsx` importa rutas de forma eager (todas al inicio),
  2) varias rutas importan el cliente de backend en top-level,
  3) el cliente se crea al importar el módulo (si falla en runtime, puede romper antes del primer render).
- El Error Boundary actual ayuda para errores en render, pero no siempre captura fallos que ocurren antes de montar React.

Do I know what the issue is?
- Sí, con alta probabilidad: hay un fallo temprano de bootstrap/importación en producción, y la app no tiene un arranque suficientemente defensivo para sobrevivir a ese escenario.

Implementación propuesta (secuenciada)

1) Blindar el bootstrap global (prioridad alta)
- Archivo: `src/main.tsx`
- Cambios:
  - Convertir el arranque en una función `bootstrap()` con `try/catch`.
  - Cargar `App` (y boundary) de forma controlada dentro del bootstrap.
  - Si algo falla antes de montar React, renderizar un fallback HTML mínimo en `#root` (mensaje + botón recargar), en vez de dejar blanco.
  - Registrar error con prefijo técnico estable (ej. `BOOTSTRAP_ERROR`) para diagnóstico rápido.

2) Cargar rutas de manera diferida para aislar fallos
- Archivo: `src/App.tsx`
- Cambios:
  - Pasar rutas a `React.lazy` + `Suspense`.
  - Resultado: una ruta problemática no rompe todo el bundle inicial.
- Beneficio: menor riesgo de crash global y mejor resiliencia en publicado.

3) Quitar inicialización de backend en top-level de páginas
- Archivos:
  - `src/pages/Index.tsx`
  - `src/pages/Unsubscribe.tsx`
  - `src/pages/EmailPreview.tsx`
- Cambios:
  - Eliminar `import { supabase } ...` estático en top-level.
  - Usar carga diferida del cliente dentro de handlers/efectos con import relativo (no alias dinámico), para evitar el problema previo.
  - Envolver esa carga en `try/catch` y mostrar mensaje de error amigable si falla.
- Importante:
  - No tocar archivos autogenerados del backend (`src/integrations/supabase/client.ts`).

4) Reutilizar helper único para carga segura del cliente
- Archivo nuevo sugerido: `src/lib/loadBackendClient.ts`
- Responsabilidad:
  - Centralizar la carga diferida del cliente.
  - Unificar manejo de error y mensajes para evitar duplicación.
- Resultado: mantenimiento más simple y comportamiento consistente en todas las rutas.

5) Endurecer UX de error por ruta (sin romper flujo)
- `Index`: si falla backend, toast claro (“no pudimos conectar, intentá de nuevo”).
- `Unsubscribe`: estado visual “error temporal” en vez de pantalla vacía.
- `EmailPreview`: estado “no se pudo cargar” con texto explícito.
- Objetivo: nunca volver a “white screen”.

Validación obligatoria

A. Preview (funcional)
1. Abrir `/` y confirmar render completo.
2. Enviar suscripción (éxito + error controlado).
3. Abrir `/preview-email`.
4. Abrir `/unsubscribe?token=test`.
5. Confirmar que ante fallo simulado no aparece blanco.

B. Publicado (estabilidad real)
1. Publicar update.
2. Verificar `https://boletinoficial.lovable.app` en incógnito y móvil.
3. Hard refresh (Cmd/Ctrl+Shift+R) varias veces.
4. Confirmar que no hay pantalla blanca y que se ve hero + secciones + footer.
5. Verificar submit de suscripción end-to-end.

Criterio de éxito
- La versión publicada deja de caer en blanco.
- Si ocurre un error temprano, se muestra fallback visible y recuperable.
- El formulario de suscripción funciona nuevamente tras publicar.

Plan de contingencia si reaparece
1. Restaurar temporalmente última versión publicada estable desde History.
2. Reaplicar cambios en dos tandas:
   - Tanda 1: bootstrap defensivo + lazy routes.
   - Tanda 2: carga segura del cliente en páginas.
3. Publicar y validar entre tandas para aislar exactamente cualquier regresión.


Objetivo: cortar el bucle de errores con una solución única y estable para producción, garantizando dos cosas al mismo tiempo:
1) que nunca vuelva la pantalla blanca, y  
2) que la suscripción funcione en la URL publicada sin el toast rojo de “error inesperado”.

Diagnóstico (con base en el código actual)
- Hoy `Index.tsx`, `Unsubscribe.tsx` y `EmailPreview.tsx` ya usan import dinámico con ruta relativa (`../integrations/supabase/client`), así que el problema no es el alias `@/`.
- El punto frágil sigue siendo `src/integrations/supabase/client.ts`: ese módulo crea el cliente al importarse y depende de variables de entorno.
- Si en el build publicado esas variables no llegan correctamente, ese import rompe en runtime:
  - en handlers/efectos: termina en catch y muestra “error inesperado”;
  - en imports tempranos: puede terminar en pantalla blanca.

Plan de implementación definitivo
1) Crear una capa única de acceso al backend (sin depender del cliente auto-generado en UI)
- Nuevo módulo compartido (por ejemplo `src/lib/backendApi.ts`) con 3 funciones:
  - `subscribeEmail(email)`
  - `unsubscribeByToken(token)`
  - `getLatestEdition()`
- Esta capa resolverá configuración en este orden:
  - primero variables VITE del entorno;
  - si faltan en producción, fallback controlado con configuración pública del proyecto (solo credenciales publicables).
- Resultado: la UI deja de importar `src/integrations/supabase/client.ts` y eliminamos el punto que dispara el crash/intermitencia.

2) Reemplazar llamadas en páginas por la nueva capa
- `src/pages/Index.tsx`
  - reemplazar el import dinámico actual y usar `subscribeEmail`.
  - mapear errores a mensajes claros:
    - email duplicado → “Ya estás suscripto”
    - validación/email inválido → mensaje específico
    - backend no disponible → mensaje específico
  - eliminar el genérico “Ocurrió un error inesperado” salvo fallback final.
- `src/pages/Unsubscribe.tsx`
  - usar `unsubscribeByToken(token)` y mantener estados loading/success/error.
- `src/pages/EmailPreview.tsx`
  - usar `getLatestEdition()` para traer edición y renderizar preview.

3) Blindaje anti pantalla blanca
- Verificar que ningún archivo de páginas importe `integrations/supabase/client` directamente.
- Mantener `main.tsx` y `AppErrorBoundary` como red de seguridad.
- Si la capa detecta configuración inválida, devuelve error controlado (no excepción fatal al cargar app).

4) Verificación funcional completa (stage y publicado)
- Stage:
  - abrir `/` y confirmar render completo.
  - suscribir email nuevo: éxito.
  - repetir mismo email: mensaje de duplicado.
  - abrir `/preview-email`: carga edición o estado vacío válido.
  - abrir `/unsubscribe?token=...`: procesa correctamente.
- Publicado:
  - hard refresh (Ctrl/Cmd+Shift+R) para evitar caché de bundles viejos.
  - repetir el flujo de suscripción y confirmar que no aparece pantalla blanca.
  - confirmar en base de datos (entorno live) que se insertó el nuevo suscriptor.
  - validar desuscripción y preview también en live.

5) Criterios de aceptación
- No hay pantalla blanca al entrar al dominio publicado.
- El botón “Suscribirme” funciona en producción.
- No aparece más el toast rojo genérico de error inesperado para casos previsibles.
- El flujo completo (suscribir, preview, desuscribir) queda operativo en producción.

Riesgos y mitigación
- Riesgo: caché de assets viejos tras publicar.
  - Mitigación: prueba con hard refresh y verificación de flujo completo en live.
- Riesgo: configuración de entorno inconsistente entre stage/live.
  - Mitigación: capa única con fallback controlado + mensajes de error explícitos.
- Riesgo de seguridad:
  - solo se usarán credenciales publicables (no privadas), y no se toca el archivo auto-generado del cliente.

Notas técnicas
- No se requieren cambios de esquema ni migraciones de base de datos.
- No se edita `src/integrations/supabase/client.ts` (auto-generado).
- El cambio es de arquitectura de acceso desde frontend para hacer la publicación tolerante a diferencias de entorno.

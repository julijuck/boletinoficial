
Objetivo inmediato: eliminar la pantalla en blanco en producción y dejar el sitio publicado estable.

Diagnóstico realizado
- El código actual en preview sí renderiza correctamente (home visible, rutas cargando).
- El problema ocurre solo en la URL publicada.
- En la URL publicada, la respuesta que se obtiene es una página base con `#root` y badge, pero sin contenido de la app visible.
- Esto es consistente con fallo de arranque del frontend publicado (o snapshot publicado inválido), no con un problema visual menor.
- También hay acoplamiento temprano al backend en el primer render (`import` de cliente en páginas), que puede tumbar toda la app si algo falla al inicializar.

Do I know what the issue is?
- Sí, con alta probabilidad: el build/snapshot publicado no está arrancando la app correctamente, y además el frontend no tiene defensas para evitar “white screen” si falla una inicialización temprana.

Plan de implementación
1) Añadir un “Error Boundary” global para evitar pantalla en blanco
- Crear un componente de frontera de error para capturar errores de runtime en React.
- En vez de dejar la página vacía, mostrar un fallback claro (“Hubo un error al cargar la app”) con botón para recargar.
- Archivos:
  - `src/components/AppErrorBoundary.tsx` (nuevo)
  - `src/main.tsx` (envolver `<App />` con el boundary)

2) Quitar inicialización crítica del backend en el arranque de la home
- En `src/pages/Index.tsx`, reemplazar import estático del cliente por import dinámico dentro de `handleSubscribe`.
- Si falla la carga del cliente, mostrar toast de error sin romper el render de la landing.
- Resultado: la home siempre renderiza aunque haya un problema de inicialización del backend.

3) Aplicar el mismo patrón defensivo en rutas secundarias
- `src/pages/Unsubscribe.tsx`: mover acceso al cliente a import dinámico dentro de `useEffect` y manejar error de forma explícita.
- `src/pages/EmailPreview.tsx`: import dinámico al cargar datos; si falla, mostrar estado de error legible.
- Resultado: ningún fallo de inicialización en esas rutas debería tirar toda la SPA.

4) Reducir riesgo de fallo por providers globales
- Revisar provider stack en `src/App.tsx` y simplificar lo que no sea estrictamente necesario para el primer paint.
- Mantener toasts, pero asegurando que no bloqueen render inicial si algo falla en tema/contexto.

5) Forzar publicación con nuevo snapshot frontend
- Con los cambios anteriores, generar un nuevo snapshot de frontend y actualizar publicación.
- Esto también descarta que haya quedado “pegado” un snapshot previo defectuoso.

Validación (obligatoria)
1. Preview
- Abrir `/` y confirmar render completo.
- Probar suscripción (flujo normal y error).
- Abrir `/preview-email` y `/unsubscribe?token=test` verificando que nunca quede en blanco.

2. Publicado
- Abrir `https://boletinoficial.lovable.app` en incógnito y móvil.
- Confirmar que la home renderiza (hero + cards + footer).
- Confirmar que recarga dura (Ctrl/Cmd+Shift+R) mantiene render.

3. Criterio de éxito
- La URL publicada deja de mostrar pantalla en blanco en navegadores/dispositivos.
- Ante fallo de runtime, aparece fallback visible (no white screen).

Si aún persiste después del fix
- Usar History para volver temporalmente al último snapshot publicado que sí renderizaba.
- Luego reaplicar cambios de forma incremental (primero Error Boundary + lazy import en home, después rutas secundarias), publicando y verificando cada paso.

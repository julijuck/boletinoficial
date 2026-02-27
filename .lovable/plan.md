

## Fix: Error de suscripción en producción

### Problema
El helper `getSupabaseClient()` en `src/lib/loadBackendClient.ts` usa `await import("@/integrations/supabase/client")` (import dinámico). Vite no resuelve correctamente el alias `@/` en imports dinámicos del bundle de producción, lo que causa que el `catch` atrape el error y muestre "Ocurrió un error inesperado".

### Solución
Usar import estático directo del cliente en cada página. El Error Boundary en `main.tsx` ya protege contra pantalla blanca si el cliente falla al inicializarse, así que es seguro.

### Cambios

**1. `src/pages/Index.tsx`**
- Reemplazar `import { getSupabaseClient } from "@/lib/loadBackendClient"` por `import { supabase } from "@/integrations/supabase/client"`
- En `handleSubscribe`, usar `supabase` directamente en vez de `await getSupabaseClient()`

**2. `src/pages/Unsubscribe.tsx`**
- Mismo cambio: import estático del cliente, uso directo en el efecto/handler

**3. `src/pages/EmailPreview.tsx`**
- Mismo cambio: import estático del cliente, uso directo

**4. Eliminar `src/lib/loadBackendClient.ts`**
- Ya no se necesita

### Por qué funciona
- Los imports estáticos (`import { supabase } from "..."`) se resuelven correctamente en el bundle de Vite tanto en dev como en producción
- Los imports dinámicos (`await import("...")`) con alias `@/` no se resuelven igual en el bundle final
- El Error Boundary existente sigue protegiendo contra crashes que ocurran al importar el módulo del cliente

### Validación
- Probar suscripción en preview
- Publicar y probar suscripción en la URL publicada



## Fix definitivo: "supabaseUrl is required" en version publicada

### Problema raiz
La captura muestra el error **"supabaseUrl is required"**. Esto pasa porque:
1. Las variables de entorno (`VITE_SUPABASE_URL`) no estan disponibles en el build publicado
2. El archivo `client.ts` ejecuta `createClient(undefined, undefined)` al importarse, lo que tira ese error
3. Como las paginas importan el cliente de forma estatica (`import { supabase } from "..."`), el error ocurre al cargar la pagina, antes de que se vea algo

### Solucion
Mover la carga del cliente a imports dinamicos con **ruta relativa** (no alias `@/`), y solo cuando se necesita (al hacer click, en efectos). Asi la landing renderiza siempre, y el backend se carga solo al interactuar.

### Cambios concretos

**1. `src/pages/Index.tsx`**
- Quitar `import { supabase } from "@/integrations/supabase/client"` del top-level
- Dentro de `handleSubscribe`, cargar el cliente con:
  ```typescript
  const { supabase } = await import("../integrations/supabase/client");
  ```
- El `try/catch` existente ya maneja el error si falla

**2. `src/pages/Unsubscribe.tsx`**
- Mismo cambio: quitar import estatico, cargar dentro del `useEffect` con ruta relativa

**3. `src/pages/EmailPreview.tsx`**
- Mismo cambio: quitar import estatico, cargar dentro del `useEffect` con ruta relativa

### Detalle tecnico clave
- El intento anterior uso `await import("@/integrations/supabase/client")` con alias `@/`, que Vite no resuelve bien en imports dinamicos del bundle de produccion
- Esta vez usamos **ruta relativa** `"../integrations/supabase/client"` que funciona siempre
- No se toca ningun archivo autogenerado

### Resultado esperado
- La landing page carga y se ve completa, sin depender del backend
- Al suscribirse, se carga el cliente y se hace el insert
- Si las variables de entorno faltan, el formulario muestra un toast de error en vez de romper toda la app

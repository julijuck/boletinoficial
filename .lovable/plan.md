

## Fix: Error al suscribirse en version publicada

### Problema
El import dinamico `await import("@/integrations/supabase/client")` falla en el build de produccion. Vite resuelve los alias `@/` de forma distinta en el bundle final, lo que causa que el `catch` atrape un error de importacion y muestre "Ocurrio un error inesperado".

### Solucion
Revertir los imports dinamicos a imports estaticos en las 3 paginas. El Error Boundary que ya agregamos sigue protegiendo contra pantallas en blanco si el cliente falla al inicializar.

### Archivos a modificar

**1. `src/pages/Index.tsx`**
- Agregar `import { supabase } from "@/integrations/supabase/client"` al inicio
- En `handleSubscribe`, reemplazar `const { supabase } = await import(...)` por uso directo de `supabase`

**2. `src/pages/Unsubscribe.tsx`**
- Agregar import estatico del cliente
- Reemplazar import dinamico dentro del useEffect

**3. `src/pages/EmailPreview.tsx`**
- Agregar import estatico del cliente
- Reemplazar import dinamico dentro de la carga de datos

### Por que es seguro
- El Error Boundary en `main.tsx` captura cualquier crash de React y muestra un fallback legible
- Si el cliente de base de datos falla al inicializarse, el boundary lo atrapa en vez de mostrar pantalla en blanco
- Los imports estaticos funcionan correctamente tanto en desarrollo como en produccion

### Validacion
- Verificar que la suscripcion funcione en preview
- Publicar y verificar que funcione en la URL publicada

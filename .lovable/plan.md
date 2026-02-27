

## Plan: Usar URL con fecha específica para el scraping

### Problema raíz
La URL genérica `https://www.boletinoficial.gob.ar/seccion/primera` no siempre muestra la edición más reciente (actualmente muestra el 26/02 aunque el 27/02 ya está disponible). Sin embargo, la URL con fecha explícita `https://www.boletinoficial.gob.ar/seccion/primera/20260227` sí tiene la edición del 27/02.

### Solución
Modificar `supabase/functions/process-boletin/index.ts` para:

1. **Construir la URL con la fecha de hoy**: En lugar de usar la URL fija `/seccion/primera`, generar la URL con el formato `/seccion/primera/YYYYMMDD` usando la fecha del servidor.

2. **Simplificar la validación de fecha**: La fecha scrapeada debería coincidir con hoy porque estamos pidiendo explícitamente esa fecha. Si la página devuelve otra fecha o no tiene contenido, significa que la edición de hoy no existe (ej: fin de semana o feriado).

3. **Mantener la validación existente como fallback**: Si la fecha extraída del contenido no coincide con hoy, seguir sin enviar.

### Cambios técnicos

En `supabase/functions/process-boletin/index.ts`:

- Cambiar `BOLETIN_URL` de URL fija a una función que genera la URL con la fecha de hoy
- Formato de fecha para la URL: `YYYYMMDD` (ej: `20260227`)
- El resto de la lógica de validación de fecha se mantiene como está

```text
Antes:  https://www.boletinoficial.gob.ar/seccion/primera
Ahora:  https://www.boletinoficial.gob.ar/seccion/primera/20260227
```

### Acciones adicionales
1. Borrar la edición incorrecta del 27/02 si existe en la tabla `editions`
2. Desplegar la función corregida
3. Disparar manualmente para procesar la edición del 27/02

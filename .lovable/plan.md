

## Plan: Validar fecha del contenido scrapeado

### Problema
La función `process-boletin` siempre asigna la fecha del servidor como `edition_date`, sin verificar que el contenido scrapeado corresponda realmente a esa fecha. Si el Boletin Oficial todavia muestra la edicion del dia anterior cuando corre la funcion, se envia contenido viejo etiquetado como nuevo.

### Solucion

**Modificar `supabase/functions/process-boletin/index.ts`** para:

1. **Extraer la fecha real del contenido scrapeado**: La pagina del Boletin Oficial contiene un texto como "Edicion del 27 de febrero de 2026". Usar esa fecha extraida como `edition_date` en lugar de `new Date()`.

2. **Comparar con la fecha de hoy**: Si la fecha extraida del contenido NO coincide con hoy, no enviar el boletin. Retornar un mensaje indicando que la edicion de hoy aun no esta disponible. Esto evita enviar contenido viejo.

3. **Parsear la fecha en espanol**: Crear una funcion auxiliar que convierta "27 de febrero de 2026" a formato `2026-02-27`.

### Cambios tecnicos

En `scrapeBoletinOficial()`:
- Parsear el match `Edicion del DD de MES de YYYY` a una fecha ISO
- Retornar esa fecha parseada en lugar de `today`

En el handler principal (`serve`):
- Comparar la fecha retornada por el scraper con `today`
- Si no coinciden, retornar `{ success: true, message: "Today's edition not yet available" }` sin enviar emails

### Accion inmediata
- Borrar la edicion incorrecta del 27/02 (que tiene contenido del 26/02) de la tabla `editions`
- Desplegar la funcion corregida
- Disparar manualmente para intentar obtener la edicion correcta

### Resultado esperado
La funcion solo envia emails cuando el contenido scrapeado corresponde al dia actual. Si la edicion no esta publicada todavia, reintenta en la proxima ejecucion del cron sin enviar contenido erroneo.


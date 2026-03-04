

## Plan: Hacer el envío confiable para uso personal

### Contexto
Esto es para vos, no un producto público. Con `resend.dev` solo llegan emails a tu dirección verificada (`juliancolombo2@gmail.com`), y eso está bien. El problema es que algunos días no llega y no hay forma de saber por qué ni de reintentar fácilmente.

### Cambios

**1. Persistir resultados de envío en la base de datos**

Agregar columna `email_results` (jsonb) a `editions` para guardar la respuesta de Resend. Así siempre podés ver si el email fue aceptado o rechazado sin depender de logs que expiran.

```sql
ALTER TABLE editions ADD COLUMN email_results jsonb DEFAULT '[]';
```

Actualizar `process-boletin` para hacer UPDATE con los resultados después del envío.

**2. Crear función `resend-edition` para reenviar**

Una función que tome un `edition_date`, busque el contenido ya generado en `editions`, y reenvíe el email. Para los días que no llega, podés disparar un reenvío manualmente sin re-scrapear ni re-generar resúmenes.

**3. Agregar reintentos automáticos en `process-boletin`**

Si Resend devuelve error, reintentar el envío hasta 3 veces con un delay de 2 segundos entre intentos. Esto cubre fallos transitorios de la API.

### Archivos

| Archivo | Cambio |
|---|---|
| `editions` table | Nueva columna `email_results` |
| `process-boletin/index.ts` | Guardar resultados en DB + reintentos automáticos |
| `resend-edition/index.ts` | Nueva función para reenviar ediciones |
| `supabase/config.toml` | Registrar `resend-edition` |


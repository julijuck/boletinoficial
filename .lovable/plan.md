

## Plan: Actualizar footer y sugerencias pre-lanzamiento

### Cambio solicitado: Footer con credito

Modificar el footer en `src/pages/Index.tsx` para que diga:

"Resumen generado automaticamente con IA a partir del Boletin Oficial de la Republica Argentina.
Este servicio no tiene afiliacion oficial con el Gobierno Nacional.
Creado por Julian Colombo" (donde "Julian Colombo" es un link a https://x.com/julian_colombo)

### Archivo a modificar
- `src/pages/Index.tsx` -- solo el bloque del footer (lineas 128-132)

### Detalle tecnico
Reemplazar el footer actual por:

```tsx
<footer className="border-t border-border bg-muted/50 px-6 py-8 text-center text-sm text-muted-foreground">
  <p>Resumen generado automaticamente con IA a partir del Boletin Oficial de la Republica Argentina.</p>
  <p className="mt-1">Este servicio no tiene afiliacion oficial con el Gobierno Nacional.</p>
  <p className="mt-1">
    Creado por{" "}
    <a href="https://x.com/julian_colombo" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
      Julian Colombo
    </a>
  </p>
</footer>
```


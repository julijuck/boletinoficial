import { useSearchParams, Link } from "react-router-dom";

const MESSAGES: Record<string, string> = {
  "1": "¡Gracias! Vamos a priorizar normas similares. 👍",
  "-1": "¡Gracias! Vamos a mostrar menos normas como esta. 👎",
  error: "No pudimos guardar tu voto. Probá de nuevo.",
  invalid: "Link inválido.",
  notfound: "Suscriptor no encontrado.",
};

const Gracias = () => {
  const [params] = useSearchParams();
  const msg = MESSAGES[params.get("r") || ""] || MESSAGES.invalid;
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="max-w-sm rounded-lg border border-border bg-card p-8 text-center shadow-sm">
        <h1 className="mb-2 text-xl font-semibold text-foreground">📰 Boletín Oficial</h1>
        <p className="text-muted-foreground">{msg}</p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary underline">Ir al inicio</Link>
      </div>
    </div>
  );
};

export default Gracias;

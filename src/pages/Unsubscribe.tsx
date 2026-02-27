import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { MailX, Loader2 } from "lucide-react";
import { unsubscribeByToken } from "@/lib/backendApi";


const Unsubscribe = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    const unsubscribe = async () => {
      try {
        
        const { supabase } = await import("../integrations/supabase/client");
        const { error } = await supabase
          .from("subscribers")
          .update({ is_active: false })
          .eq("unsubscribe_token", token);
        setStatus(error ? "error" : "success");
      } catch {
        setStatus("error");
      }
    };

    unsubscribe();
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="max-w-md">
        <CardContent className="p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Procesando...</p>
            </>
          )}
          {status === "success" && (
            <>
              <MailX className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h1 className="mb-2 text-2xl font-bold text-foreground">Desuscripto</h1>
              <p className="text-muted-foreground">
                Ya no vas a recibir más resúmenes del Boletín Oficial.
              </p>
            </>
          )}
          {status === "error" && (
            <>
              <MailX className="mx-auto mb-4 h-12 w-12 text-destructive" />
              <h1 className="mb-2 text-2xl font-bold text-foreground">Error</h1>
              <p className="text-muted-foreground">
                No se pudo procesar la desuscripción. El enlace puede ser inválido.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;

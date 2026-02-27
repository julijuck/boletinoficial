import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { FileText, Mail, Sparkles, Clock } from "lucide-react";
import { subscribeEmail } from "@/lib/backendApi";


const Index = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      
      const { supabase } = await import("../integrations/supabase/client");
      const { error } = await supabase
        .from("subscribers")
        .insert({ email: email.trim().toLowerCase() });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Ya estás suscripto", description: "Este email ya está registrado." });
        } else {
          toast({ title: "Error", description: "No se pudo completar la suscripción.", variant: "destructive" });
        }
        return;
      }

      setSubscribed(true);
      toast({ title: "¡Suscripción exitosa!", description: "Vas a recibir el resumen cada día hábil." });
    } catch {
      toast({ title: "Error", description: "Ocurrió un error inesperado.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: FileText,
      title: "Primera Sección",
      description: "Leyes, decretos, resoluciones y disposiciones del día.",
    },
    {
      icon: Sparkles,
      title: "Resumen con IA",
      description: "Extractos claros de 2 renglones para cada normativa.",
    },
    {
      icon: Clock,
      title: "Cada nueva edición",
      description: "Automático con cada nueva publicación, sin feriados ni fines de semana.",
    },
    {
      icon: Mail,
      title: "En tu correo",
      description: "Llegá preparado cada mañana sin buscar nada.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-primary" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        }} />
        <div className="relative mx-auto max-w-3xl px-6 py-20 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-secondary/20 px-4 py-1.5 text-sm font-medium text-primary-foreground">
            <FileText className="h-4 w-4" />
            Boletín Oficial · Primera Sección
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-primary-foreground md:text-5xl lg:text-6xl">
            Boletín Oficial:<br />Tu resumen diario
          </h1>
          <p className="mb-10 text-lg text-primary-foreground/80 md:text-xl">
            Recibí un resumen con IA de cada nueva edición. Títulos, extractos concisos y links directos en tu correo.
          </p>

          {subscribed ? (
            <Card className="mx-auto max-w-md border-0 bg-primary-foreground/10 backdrop-blur-sm">
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                  <Mail className="h-8 w-8 text-secondary-foreground" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-primary-foreground">¡Listo!</h3>
                <p className="text-primary-foreground/80">
                  Ya estás suscripto. Vas a recibir el próximo resumen en tu correo.
                </p>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubscribe} className="mx-auto flex max-w-md gap-3">
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 border-0 bg-primary-foreground/95 text-foreground placeholder:text-muted-foreground"
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 bg-secondary px-6 text-secondary-foreground hover:bg-secondary/90"
              >
                {isLoading ? "..." : "Suscribirme"}
              </Button>
            </form>
          )}
          <p className="mt-4 text-xs text-primary-foreground/60">
            Gratis · Sin spam · Te podés desuscribir en cualquier momento
          </p>
        </div>
      </header>

      {/* Features */}
      <section className="mx-auto max-w-4xl px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold text-foreground">
          ¿Qué recibís?
        </h2>
        <div className="grid gap-6 sm:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50 bg-card shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="flex gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent">
                  <feature.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-card-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/50 px-6 py-8 text-center text-sm text-muted-foreground">
        <p>Resumen generado automáticamente con IA a partir del Boletín Oficial de la República Argentina.</p>
        <p className="mt-1">Este servicio no tiene afiliación oficial con el Gobierno Nacional.</p>
        <p className="mt-1">
          Creado por{" "}
          <a href="https://x.com/julian_colombo" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
            Julián Colombo
          </a>
        </p>
      </footer>
    </div>
  );
};

export default Index;

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

interface NormEntry {
  category: string;
  title: string;
  description: string;
  url: string;
}

function buildEmailHtml(entries: NormEntry[], date: string): string {
  const formattedDate = new Date(date + "T12:00:00").toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const categorizedEntries = new Map<string, NormEntry[]>();
  for (const entry of entries) {
    const cat = entry.category || "OTROS";
    if (!categorizedEntries.has(cat)) categorizedEntries.set(cat, []);
    categorizedEntries.get(cat)!.push(entry);
  }

  let entriesHtml = "";
  for (const [category, items] of categorizedEntries) {
    entriesHtml += `
      <tr>
        <td style="padding: 16px 24px 8px; background-color: #1e3a5f; color: #ffffff; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
          ${category}
        </td>
      </tr>`;
    for (const item of items) {
      entriesHtml += `
      <tr>
        <td style="padding: 12px 24px; border-bottom: 1px solid #eee;">
          <a href="${item.url}" style="color: #1e3a5f; font-weight: 600; font-size: 14px; text-decoration: none;">${item.title}</a>
          <p style="margin: 4px 0 0; color: #555; font-size: 13px; line-height: 1.5;">${item.description}</p>
        </td>
      </tr>`;
    }
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background-color:#1e3a5f;padding:24px 24px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;">📰 Boletín Oficial</h1>
            <p style="margin:6px 0 0;color:#ccd6e0;font-size:14px;">Primera Sección · ${formattedDate}</p>
          </td>
        </tr>
        ${entriesHtml}
        <tr>
          <td style="padding:20px 24px;text-align:center;border-top:2px solid #eee;">
            <p style="margin:0;color:#999;font-size:12px;">
              Resumen generado con IA · <a href="#" style="color:#999;text-decoration:underline;">Desuscribirme</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const EmailPreview = () => {
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editionDate, setEditionDate] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase
          .from("editions")
          .select("edition_date, summary_content")
          .order("edition_date", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (data?.summary_content) {
        const entries = data.summary_content as unknown as NormEntry[];
        setEditionDate(data.edition_date);
        setHtml(buildEmailHtml(entries, data.edition_date));
      }
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-muted p-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center gap-3">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-1 h-4 w-4" /> Volver
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-foreground">
            Preview del email {editionDate && `· ${editionDate}`}
          </h1>
        </div>
        {loading ? (
          <p className="text-muted-foreground">Cargando...</p>
        ) : html ? (
          <iframe
            srcDoc={html}
            className="w-full rounded-lg border border-border bg-white shadow-sm"
            style={{ height: "80vh" }}
            title="Email preview"
          />
        ) : (
          <p className="text-muted-foreground">No hay ediciones disponibles.</p>
        )}
      </div>
    </div>
  );
};

export default EmailPreview;

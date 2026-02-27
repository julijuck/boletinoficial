import "./index.css";

async function bootstrap() {
  try {
    const { createRoot } = await import("react-dom/client");
    const { default: AppErrorBoundary } = await import("./components/AppErrorBoundary");
    const { default: App } = await import("./App");

    createRoot(document.getElementById("root")!).render(
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    );
  } catch (err) {
    console.error("BOOTSTRAP_ERROR", err);
    const root = document.getElementById("root");
    if (root) {
      root.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif;padding:2rem;text-align:center">
          <div>
            <h1 style="font-size:1.5rem;margin-bottom:.5rem">Hubo un error al cargar la app</h1>
            <p style="color:#666;margin-bottom:1.5rem">${err instanceof Error ? err.message : "Error desconocido"}</p>
            <button onclick="location.reload()" style="padding:.5rem 1.5rem;font-size:1rem;cursor:pointer;border-radius:6px;border:1px solid #ccc;background:#f5f5f5">Recargar</button>
          </div>
        </div>`;
    }
  }
}

bootstrap();

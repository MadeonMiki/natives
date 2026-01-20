import { groqServices } from "./services/groq";
const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  hostname:"0.0.0.0",
  async fetch(req) {
    const url = new URL(req.url);

    // Configuración de cabeceras para permitir a la extensión conectarse
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    // Responder a las peticiones "preflight" (OPTIONS)
    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }
    // Tu ruta de la API
    if (url.pathname === "/datos") {
      let text = '';
      try {
        if (req.method === 'POST') {
          const body = await req.json() as { text?: string };
          console.log('Server received body:', body);
          text = String(body.text ?? '');
        } else {
          text = url.searchParams.get('text') ?? '';
        }
      } catch (e) {
        console.error('Error parsing request body:', e);
        text = '';
      }

      const prompt = text;
      try {
        const stream = await groqServices.chat(prompt);
        return new Response(JSON.stringify({
          mensaje: stream,
          timestamp: Date.now(),
          received: prompt,
        }), { headers });
      } catch (err) {
        console.error('Error from groqServices.chat:', err);
        return new Response(JSON.stringify({ error: String(err), received: prompt }), { status: 500, headers });
      }
    }

    return new Response("No encontrado", { status: 404, headers });
  },
});

console.log(`API escuchando en http://localhost:${server.port}`);
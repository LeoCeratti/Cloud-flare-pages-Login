   export async function onRequestGet({ request, env }) {
     const nome = new URL(request.url).searchParams.get("nome");
     const r = await env.DB.prepare(`SELECT * FROM sessions WHERE email = '${nome}'`).all();
     return Response.json(r.results);
   }

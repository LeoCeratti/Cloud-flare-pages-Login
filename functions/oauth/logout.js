import { lerCookies, COOKIE_SESSAO, apagarCookieSessao, SEM_CACHE, resposta } from "../_shared/cookies.js";
import { resumoHex } from "../_shared/crypto.js";

export async function onRequestPost({ request, env }) {
  if (request.headers.get("Origin") !== env.PUBLIC_BASE_URL) return resposta(403, "Origem não permitida");

  const valor = lerCookies(request)[COOKIE_SESSAO];
  if (valor) {
    await env.DB.prepare("DELETE FROM sessions WHERE id_hash = ?").bind(await resumoHex(valor)).run();
  }

  const headers = new Headers(SEM_CACHE);
  headers.set("Location", `${env.PUBLIC_BASE_URL}/`);
  headers.append("Set-Cookie", apagarCookieSessao());
  return new Response(null, { status: 303, headers });
}

// qualquer outro método
export function onRequest() {
  return resposta(405, "Método não permitido");
}

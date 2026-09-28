import { lerCookies, COOKIE_SESSAO, SEM_CACHE } from "../_shared/cookies.js";
import { resumoHex } from "../_shared/crypto.js";

export async function onRequestGet({ request, env }) {
  const valor = lerCookies(request)[COOKIE_SESSAO];
  if (!valor) return Response.json({ erro: "sem sessão" }, { status: 401, headers: SEM_CACHE });

  const idHash = await resumoHex(valor);
  const agora = Math.floor(Date.now() / 1000);
  const linha = await env.DB
    .prepare("SELECT issuer, email, display_name FROM sessions WHERE id_hash = ? AND expires_at > ?")
    .bind(idHash, agora)
    .first();

  if (!linha) return Response.json({ erro: "sem sessão" }, { status: 401, headers: SEM_CACHE });

  return Response.json(
    { issuer: linha.issuer, email: linha.email, displayName: linha.display_name },
    { headers: SEM_CACHE }
  );
}

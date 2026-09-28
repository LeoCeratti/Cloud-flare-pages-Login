import { obterProvedor, trocarCodigo, identidadeGithub } from "../../_shared/providers.js";
import { validarIdTokenGoogle } from "../../_shared/oidc.js";
import { gerarSegredoAleatorio, resumoHex, iguaisEmTempoConstante } from "../../_shared/crypto.js";
import {
  lerCookies, COOKIE_TRANSACAO, criarCookieSessao, apagarCookieTransacao, SEM_CACHE, resposta,
} from "../../_shared/cookies.js";

function recusar() {
  const r = resposta(400, "Falha na autenticação");
  r.headers.append("Set-Cookie", apagarCookieTransacao());
  return r;
}

export async function onRequestGet({ request, params, env }) {
  const nome = params.provider;
  if (!obterProvedor(nome)) return resposta(404, "Não encontrado");

  const url = new URL(request.url);
  const codigo = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (url.searchParams.get("error") || !codigo || !state) return recusar();

  const cookieTx = lerCookies(request)[COOKIE_TRANSACAO];
  if (!cookieTx) return recusar();

  const idHash = await resumoHex(cookieTx);
  const agora = Math.floor(Date.now() / 1000);
  const tx = await env.DB
    .prepare("SELECT provider, state_hash, nonce, code_verifier FROM oauth_transactions WHERE id_hash = ? AND expires_at > ?")
    .bind(idHash, agora)
    .first();
  if (!tx) return recusar();

  // a transação é consumida antes de qualquer outra verificação
  await env.DB.prepare("DELETE FROM oauth_transactions WHERE id_hash = ?").bind(idHash).run();

  if (tx.provider !== nome) return recusar();
  if (!iguaisEmTempoConstante(await resumoHex(state), tx.state_hash)) return recusar();

  let identidade = null;
  try {
    const tokens = await trocarCodigo({ nome, env, codigo, verificador: tx.code_verifier });
    if (!tokens) return recusar();
    identidade =
      nome === "google"
        ? await validarIdTokenGoogle(tokens.id_token, env, tx.nonce)
        : await identidadeGithub(tokens, env);
  } catch {
    return recusar();
  }
  if (!identidade) return recusar();

  const sessaoBruta = gerarSegredoAleatorio();
  await env.DB
    .prepare("INSERT INTO sessions (id_hash, issuer, subject, email, display_name, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(await resumoHex(sessaoBruta), identidade.issuer, identidade.subject, identidade.email, identidade.nome, agora + 28800, agora)
    .run();

  const headers = new Headers(SEM_CACHE);
  headers.set("Location", `${env.PUBLIC_BASE_URL}/`);
  headers.append("Set-Cookie", criarCookieSessao(sessaoBruta));
  headers.append("Set-Cookie", apagarCookieTransacao());
  return new Response(null, { status: 302, headers });
}

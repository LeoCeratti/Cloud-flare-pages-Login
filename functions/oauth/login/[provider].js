import { obterProvedor, montarUrlAutorizacao } from "../../_shared/providers.js";
import { gerarSegredoAleatorio, resumoHex, desafioPkce } from "../../_shared/crypto.js";
import { criarCookieTransacao, resposta, SEM_CACHE } from "../../_shared/cookies.js";

export async function onRequestGet({ params, env }) {
  const nome = params.provider;
  if (!obterProvedor(nome)) return resposta(404, "Não encontrado");

  const cookieBruto = gerarSegredoAleatorio();
  const state = gerarSegredoAleatorio();
  const verificador = gerarSegredoAleatorio();
  const nonce = nome === "google" ? gerarSegredoAleatorio() : null;
  const desafio = await desafioPkce(verificador);
  const agora = Math.floor(Date.now() / 1000);

  // limpeza oportunista de transações vencidas
  await env.DB.prepare("DELETE FROM oauth_transactions WHERE expires_at < ?").bind(agora).run();

  await env.DB
    .prepare(
      "INSERT INTO oauth_transactions (id_hash, provider, state_hash, nonce, code_verifier, expires_at) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(await resumoHex(cookieBruto), nome, await resumoHex(state), nonce, verificador, agora + 600)
    .run();

  const headers = new Headers(SEM_CACHE);
  headers.set("Location", montarUrlAutorizacao({ nome, env, state, desafio, nonce }));
  headers.append("Set-Cookie", criarCookieTransacao(cookieBruto));
  return new Response(null, { status: 302, headers });
}

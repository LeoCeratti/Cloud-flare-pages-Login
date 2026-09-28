// Cookies e respostas padronizadas.
export const COOKIE_TRANSACAO = "__Host-oauth-tx";
export const COOKIE_SESSAO = "__Host-session";

export function lerCookies(request) {
  const bruto = request.headers.get("Cookie") || "";
  const mapa = {};
  for (const par of bruto.split(";")) {
    const i = par.indexOf("=");
    if (i < 0) continue;
    mapa[par.slice(0, i).trim()] = par.slice(i + 1).trim();
  }
  return mapa;
}

export const criarCookieTransacao = (valor) =>
  `${COOKIE_TRANSACAO}=${valor}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`;

export const apagarCookieTransacao = () =>
  `${COOKIE_TRANSACAO}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;

export const criarCookieSessao = (valor) =>
  `${COOKIE_SESSAO}=${valor}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;

export const apagarCookieSessao = () =>
  `${COOKIE_SESSAO}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

export const SEM_CACHE = { "Cache-Control": "no-store" };

export function resposta(status, texto) {
  return new Response(texto, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8", ...SEM_CACHE },
  });
}

// Validação do id_token do Google sem bibliotecas externas.
import { deBase64Url } from "./crypto.js";

const DESCOBERTA = "https://accounts.google.com/.well-known/openid-configuration";
const EMISSORES = ["https://accounts.google.com", "accounts.google.com"];
const decodificador = new TextDecoder();

function jsonDe(parteBase64Url) {
  return JSON.parse(decodificador.decode(deBase64Url(parteBase64Url)));
}

export async function validarIdTokenGoogle(idToken, env, nonceEsperado) {
  if (typeof idToken !== "string") return null;
  const partes = idToken.split(".");
  if (partes.length !== 3) return null;
  const [cabecalhoB64, cargaB64, assinaturaB64] = partes;

  const cabecalho = jsonDe(cabecalhoB64);
  if (cabecalho.alg !== "RS256" || !cabecalho.kid) return null;

  const descoberta = await (await fetch(DESCOBERTA)).json();
  if (!EMISSORES.includes(descoberta.issuer)) return null;

  const jwks = await (await fetch(descoberta.jwks_uri)).json();
  const jwk = (jwks.keys || []).find((k) => k.kid === cabecalho.kid);
  if (!jwk) return null;

  const chave = await crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const valido = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    chave,
    deBase64Url(assinaturaB64),
    new TextEncoder().encode(`${cabecalhoB64}.${cargaB64}`)
  );
  if (!valido) return null;

  const c = jsonDe(cargaB64);
  const agora = Math.floor(Date.now() / 1000);
  const audiencias = Array.isArray(c.aud) ? c.aud : [c.aud];

  if (!EMISSORES.includes(c.iss)) return null;
  if (!audiencias.includes(env.GOOGLE_CLIENT_ID)) return null;
  if (typeof c.exp !== "number" || c.exp <= agora) return null;
  if (typeof c.iat !== "number" || c.iat > agora + 60) return null;
  if (!nonceEsperado || c.nonce !== nonceEsperado) return null;
  if (!c.sub) return null;

  return {
    issuer: "https://accounts.google.com",
    subject: String(c.sub),
    email: c.email ?? null,
    nome: c.name ?? null,
  };
}

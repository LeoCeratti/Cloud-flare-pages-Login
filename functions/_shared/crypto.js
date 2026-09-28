// Utilitários de Web Crypto: valores aleatórios, resumos SHA-256 e Base64URL.
const codificador = new TextEncoder();

export function paraBase64Url(bytes) {
  let texto = "";
  for (const b of bytes) texto += String.fromCharCode(b);
  return btoa(texto).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function deBase64Url(texto) {
  const base = texto.replace(/-/g, "+").replace(/_/g, "/");
  const completo = base + "=".repeat((4 - (base.length % 4)) % 4);
  const binario = atob(completo);
  return Uint8Array.from(binario, (c) => c.charCodeAt(0));
}

// 32 bytes aleatórios -> 43 caracteres Base64URL
export function gerarSegredoAleatorio() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return paraBase64Url(bytes);
}

async function digestSha256(texto) {
  const buffer = await crypto.subtle.digest("SHA-256", codificador.encode(texto));
  return new Uint8Array(buffer);
}

// Resumo em hexadecimal (é o que fica guardado no D1)
export async function resumoHex(texto) {
  const bytes = await digestSha256(texto);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// code_challenge = BASE64URL(SHA256(code_verifier))
export async function desafioPkce(verificador) {
  return paraBase64Url(await digestSha256(verificador));
}

export function iguaisEmTempoConstante(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) diferenca |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diferenca === 0;
}

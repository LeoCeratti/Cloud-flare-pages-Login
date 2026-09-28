// Configuração e chamadas específicas de cada provedor.
const PROVEDORES = {
  google: {
    autorizacao: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    varId: "GOOGLE_CLIENT_ID",
    varSegredo: "GOOGLE_CLIENT_SECRET",
  },
  github: {
    autorizacao: "https://github.com/login/oauth/authorize",
    token: "https://github.com/login/oauth/access_token",
    varId: "GITHUB_CLIENT_ID",
    varSegredo: "GITHUB_CLIENT_SECRET",
  },
};

export function obterProvedor(nome) {
  return Object.prototype.hasOwnProperty.call(PROVEDORES, nome) ? PROVEDORES[nome] : null;
}

export const urlRetorno = (env, nome) => `${env.PUBLIC_BASE_URL}/oauth/callback/${nome}`;

export function montarUrlAutorizacao({ nome, env, state, desafio, nonce }) {
  const p = PROVEDORES[nome];
  const url = new URL(p.autorizacao);
  url.searchParams.set("client_id", env[p.varId]);
  url.searchParams.set("redirect_uri", urlRetorno(env, nome));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", desafio);
  url.searchParams.set("code_challenge_method", "S256");
  if (nome === "google") {
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("nonce", nonce);
  }
  return url.toString();
}

// Troca o código pelos tokens. Nunca registra corpo nem resposta.
export async function trocarCodigo({ nome, env, codigo, verificador }) {
  const p = PROVEDORES[nome];
  const corpo = new URLSearchParams({
    grant_type: "authorization_code",
    code: codigo,
    redirect_uri: urlRetorno(env, nome),
    client_id: env[p.varId],
    client_secret: env[p.varSegredo],
    code_verifier: verificador,
  });
  const r = await fetch(p.token, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: corpo,
  });
  if (!r.ok) return null;
  return await r.json();
}

// GitHub: consulta o perfil e revoga a autorização antes de devolver a identidade.
export async function identidadeGithub(tokens, env) {
  if (!tokens || typeof tokens.access_token !== "string") return null;
  if (String(tokens.token_type || "").toLowerCase() !== "bearer") return null;

  const perfilResp = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2026-03-10",
      "User-Agent": "oauth-pages-lab",
    },
  });
  if (perfilResp.status !== 200) return null;
  const perfil = await perfilResp.json();
  if (!Number.isInteger(perfil.id)) return null;

  const basic = btoa(`${env.GITHUB_CLIENT_ID}:${env.GITHUB_CLIENT_SECRET}`);
  const revogacao = await fetch(
    `https://api.github.com/applications/${env.GITHUB_CLIENT_ID}/grant`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${basic}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2026-03-10",
        "Content-Type": "application/json",
        "User-Agent": "oauth-pages-lab",
      },
      body: JSON.stringify({ access_token: tokens.access_token }),
    }
  );
  if (revogacao.status !== 204) return null;

  return {
    issuer: "https://github.com",
    subject: String(perfil.id),
    email: perfil.email ?? null,
    nome: perfil.name || perfil.login || null,
  };
}

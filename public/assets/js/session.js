
// estáticos continuam públicos; este script só ajusta o menu conforme a sessão.
(function () {
  function achar(texto) {
    var alvo = null;
    document.querySelectorAll("span.no-icon").forEach(function (s) {
      if (s.textContent.trim() === texto) alvo = s;
    });
    return alvo;
  }
  var sair = achar("Sair");
  var conta = achar("Conta");
  var linkSair = sair ? sair.closest("a") : null;

  fetch("/api/me", { credentials: "same-origin" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (user) {
      if (user) {
        if (conta) conta.textContent = user.email || user.displayNome || "Conta";
        if (sair && linkSair) {
          sair.textContent = "Sair";
          linkSair.addEventListener("click", function (e) {
            e.preventDefault();
            var f = document.createElement("form");
            f.method = "post";
            f.action = "/oauth/logout";
            document.body.appendChild(f);
            f.submit();
          });
        }
      } else if (sair && linkSair) {
        sair.textContent = "Entrar";
        linkSair.setAttribute("href", "/");
      }
    })
    .catch(function () {});
})();

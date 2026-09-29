# Testes de falha

## Caso 1: retorno sem cookie temporário
- Preparação: janela privativa, sem sessão e sem o cookie __Host-oauth-tx. Teste executado por script no console do navegador.
- Pedido enviado: GET /oauth/callback/google?code=teste&state=teste, com credentials: "omit" (sem cookies).
- Resultado esperado: retorno recusado (400) e nenhuma sessão criada.
- Resultado observado: 400 (Bad Request). Em seguida GET /api/me respondeu 401, então nenhuma sessão foi criada.

## Caso 2: state alterado
- Preparação: janela privativa. Uma transação foi criada com GET /oauth/login/google e, em seguida, o callback foi chamado com um state que não corresponde ao da transação. Teste executado por script no console do navegador.
- Pedido enviado: GET /oauth/callback/google?code=teste&state=estado-alterado.
- Resultado esperado: retorno recusado antes da troca do código.
- Resultado observado: 400 (Bad Request). Em seguida GET /api/me respondeu 401, então nenhuma sessão foi criada.

## Caso 3: reutilização da transação
- Preparação: após um login bem-sucedido com GitHub, copiei a URL da requisição de retorno (callback) no painel Network.
- Pedido enviado: abri a mesma URL novamente na barra de endereço.
- Resultado esperado: falha, pois a transação já foi removida.
- Resultado observado: 400 (Bad Request), com a página exibindo "Falha na autenticação".

## Caso 4: sessão expirada
- Preparação: fiz login novamente e, com a sessão criada, executei no console D1: UPDATE sessions SET expires_at = 0;
- Pedido enviado: GET /api/me.
- Resultado esperado: 401.
- Resultado observado: 401 (Unauthorized), com o corpo {"erro":"sem sessão"}.

## Caso 5: origem inválida na saída
- Preparação: sessão válida aberta na URL do projeto; abri outra aba em https://example.com.
- Pedido enviado: fetch POST para /oauth/logout com credentials: "include", executado no console da aba de https://example.com.
- Resultado esperado: operação recusada e sessão original permanece válida.
- Resultado observado: a requisição POST /oauth/logout respondeu 403 (Forbidden). O console também exibiu erro de CORS e "Failed to fetch", comportamento do navegador. A aba do projeto continuou exibindo a sessão ativa.

## Caso 6: reutilização do cookie revogado
- Preparação: em sessão exclusiva do laboratório, copiei temporariamente o cookie __Host-session, fiz logout e restaurei o mesmo valor pelo console do navegador (valor não registrado aqui).
- Pedido enviado: GET /api/me, com o cookie restaurado.
- Resultado esperado: 401.
- Resultado observado: 401 (Unauthorized), e a página continuou exibindo "Nenhuma sessão neste navegador."

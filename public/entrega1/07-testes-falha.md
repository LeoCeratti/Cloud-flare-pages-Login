# Testes de falha

## Caso 1: retorno sem cookie temporário
- Preparação: iniciei o login em janela comum e copiei a URL de autorização do provedor para uma janela privativa.
- Pedido enviado: concluí o login na janela privativa (sem o cookie __Host-oauth-tx).
- Resultado esperado: retorno recusado (400) e nenhuma sessão criada.
- Resultado observado: [PREENCHER]

## Caso 2: state alterado
- Preparação: iniciei outro login e parei na página do provedor.
- Pedido enviado: alterei um caractere do parâmetro state e prossegui.
- Resultado esperado: retorno recusado antes da troca do código.
- Resultado observado: [PREENCHER]

## Caso 3: reutilização da transação
- Preparação: após um login bem-sucedido, copiei a URL da requisição de retorno no painel Network.
- Pedido enviado: abri a URL novamente.
- Resultado esperado: falha, pois a transação já foi removida.
- Resultado observado: [PREENCHER]

## Caso 4: sessão expirada
- Preparação: com uma sessão criada, executei no console D1: UPDATE sessions SET expires_at = 0;
- Pedido enviado: recarreguei a página (GET /api/me).
- Resultado esperado: 401.
- Resultado observado: [PREENCHER]

## Caso 5: origem inválida na saída
- Preparação: sessão válida aberta na URL do projeto; abri outra origem (https://example.com).
- Pedido enviado: fetch POST para /oauth/logout com credentials: "include".
- Resultado esperado: operação recusada e sessão original permanece válida.
- Resultado observado: [PREENCHER]

## Caso 6: reutilização do cookie revogado
- Preparação: em sessão exclusiva do laboratório, copiei temporariamente o cookie __Host-session, fiz logout e tentei restaurar o valor (valor NÃO registrado aqui).
- Pedido enviado: GET /api/me.
- Resultado esperado: 401.
- Resultado observado: [PREENCHER]

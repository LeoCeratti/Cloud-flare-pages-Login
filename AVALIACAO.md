# Avaliação: GitHub Actions com IA

Repositório: https://github.com/LeoCeratti/Cloud-flare-pages-Login

## Tarefa 1: CI a cada commit

- Execução verde: https://github.com/LeoCeratti/Cloud-flare-pages-Login/actions/runs/38648504068
- Execução vermelha: https://github.com/LeoCeratti/Cloud-flare-pages-Login/actions/runs/38648708316
- Linha do log com o erro (passo "Aplica as migrações D1"):

```
Parse error near line 1: near "TABL": syntax error
  CREATE TABL x (id INTEGER);
         ^--- error here
Error: Process completed with exit code 1.
```

- Por que testar a migração em SQLite antes do D1: um erro de sintaxe aplicado direto no D1 remoto pode deixar o banco de produção quebrado ou pela metade, e no SQLite local o erro aparece no CI sem risco.
- Observação 1: o template Bootstrap (`public/examples/` e `public/assets/`) foi excluído da validação de HTML (`--ignore`), porque é código de terceiros e a primeira execução falhou só por causa dele.
- Observação 2: a execução vermelha foi feita com um commit direto na `main`, antes de a proteção da Tarefa 2 existir. O arquivo com erro foi removido em seguida.

## Tarefa 2: main protegida

- PR bloqueado (checks `verificar` falhando) e depois liberado (checks verdes), na mesma ramificação: https://github.com/LeoCeratti/Cloud-flare-pages-Login/pull/1
- Saída do push direto recusado:

```
remote: error: GH013: Repository rule violations found for refs/heads/main.
remote: - Changes must be made through a pull request.
remote: - Required status check "verificar" is expected.
To https://github.com/LeoCeratti/Cloud-flare-pages-Login
 ! [remote rejected] main -> main (push declined due to repository rule violations)
error: failed to push some refs to 'https://github.com/LeoCeratti/Cloud-flare-pages-Login'
```

## Tarefa 3: revisão por IA

- PR com os dois comentários da IA (um com o SQL concatenado e outro depois da correção com `prepare().bind()`), fechado sem merge: https://github.com/LeoCeratti/Cloud-flare-pages-Login/pull/3
- Execução com erro de permissão (sem `pull-requests: write`): https://github.com/LeoCeratti/Cloud-flare-pages-Login/actions/runs/38773536481/job/116555238292

```
Run gh pr comment 3 --body-file "/tmp/modelResponse--2132-oZC12cOamLHW-.txt"
GraphQL: Resource not accessible by integration (addComment)
Error: Process completed with exit code 1.
```

- Depois de restaurar `pull-requests: write`, a execução seguinte voltou a passar e publicou o comentário.
- Observação: o enunciado usa `actions/ai-inference@v1`, mas essa versão rodou um modo antigo e falhou com "Cannot use 'in' operator to search for 'choices' in OK". Foi preciso usar `@v2` com `provider: copilot`.
- Crítica à IA:

  A IA acertou o principal: no primeiro comentário do PR #3 ela marcou a injeção de SQL como HIGH, com confiança 9/10, mostrou que um valor como `' OR 1=1 --` faria a rota devolver todas as sessões e sugeriu usar `?` com `bind()`. O resto do comentário, porém, tinha falhas. Ela mandou criar e commitar um arquivo `SECURITY-REVIEW.md`, uma tarefa que ninguém pediu e que não cabe num comentário de revisão. A tabela veio quebrada no meio do texto e a frase "não identifiquei segredos expostos nem outros erros lógicos" apareceu duas vezes. A afirmação que considero errada é justamente essa: ela disse que não havia outros erros lógicos, e só no segundo comentário, depois que o SQL foi corrigido, percebeu que a rota devolve todas as colunas de `sessions` para qualquer pessoa, sem autenticação. Esse problema já existia na primeira versão e passou despercebido. Concluo que a IA ajuda como segunda leitura, mas muda de conclusão de uma rodada para outra e não deve ser a única proteção.

## Tarefa 4: migrações D1

- Execução do merge que alterou `migrations/` (PR #5, migração `0002_adiciona_coluna.sql`): https://github.com/LeoCeratti/Cloud-flare-pages-Login/actions/runs/38815149451
- Saída do `PRAGMA table_info(sessions)` no D1 remoto:

```
cid | name          | type    | notnull | dflt_value | pk
0   | id_hash       | TEXT    | 0       | null       | 1
1   | issuer        | TEXT    | 1       | null       | 0
2   | subject       | TEXT    | 1       | null       | 0
3   | email         | TEXT    | 0       | null       | 0
4   | display_name  | TEXT    | 0       | null       | 0
5   | expires_at    | INTEGER | 1       | null       | 0
6   | created_at    | INTEGER | 1       | null       | 0
7   | ultimo_acesso | INTEGER | 0       | null       | 0
```

- Merge que não tocou `migrations/` (PR #4, que só adicionou o `migrar.yml`): o workflow `migrar` não rodou, e a execução do commit de merge foi só do `ci`: https://github.com/LeoCeratti/Cloud-flare-pages-Login/actions/runs/38814658654
- O merge do PR de entrega, que só adiciona este arquivo, também não altera `migrations/` e não deve disparar o `migrar`.

## Perguntas

1. Quando faço push numa ramificação que já tem PR aberto, o GitHub dispara dois eventos: o `push` da ramificação e o `pull_request` do PR. Por isso o `ci.yml` roda duas vezes. No PR #1 vi os dois checks (`ci / verificar (push)` e `ci / verificar (pull_request)`) marcados como Required, então a regra da `main` esperava os dois ficarem verdes antes de liberar o merge. Na prática o do `pull_request` é o que mais importa, porque testa o código já combinado com a `main`.

2. Num PR de fork, o workflow roda com o código de quem abriu o PR, que pode ser qualquer pessoa. Se esse código pudesse ler `secrets.COPILOT_PAT`, bastaria alterar o workflow para imprimir ou enviar o segredo para fora e o roubo estaria feito. Por isso o GitHub não entrega os segredos do repositório de destino a PRs de fork, e essa regra impede o vazamento de credenciais por um colaborador mal-intencionado.

3. Declarar `permissions` limita o `GITHUB_TOKEN` ao mínimo que o job precisa: ler o conteúdo e escrever comentários em PRs. As permissões padrão podem ser mais amplas do que isso, e um workflow comprometido teria mais poder para causar estrago. Vi o efeito no teste: sem `pull-requests: write`, o passo "Comenta no PR" falhou com `Resource not accessible by integration`, ou seja, o token não podia fazer nada além do que foi declarado.

4. Não pode. No PR #3 a IA se contradisse entre as duas revisões, primeiro dizendo que não havia outros erros lógicos e depois apontando a falta de autenticação na rota, além de sugerir um arquivo que ninguém pediu. Também o comentário dela não bloqueia o merge, enquanto o status check obrigatório sim. O check dá sempre a mesma resposta para o mesmo código; a IA varia, então serve de apoio, não de substituto.

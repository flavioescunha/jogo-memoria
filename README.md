# Jogo da Memória - Matemática

Estrutura sugerida para o repositório `jogo-memoria-matematica`.

## Arquivos

- `index.html` → estrutura visual principal e carregamento do app.
- `js/app.js` → lógica do jogo, seleção de tópicos, rodadas e revisão final.
- `js/topics.js` → cadastro dos tópicos existentes.
- `js/cards-porcentagem.js` → cards do tópico de porcentagem.
- `js/cards-mmc-mdc.js` → cards do tópico de MMC e MDC.

## Como adicionar um novo tópico

1. Crie um arquivo novo em `js/`, por exemplo `cards-fracoes.js`.
2. Exporte um array de cards no mesmo formato dos outros arquivos.
3. Importe esse array em `js/topics.js`.
4. Adicione um novo objeto no array `TOPICS` com `id`, `title`, `description`, `pairsPerRound` e `cards`.

## Publicação no GitHub Pages

Suba todos os arquivos para a branch `main` e ative em:

- **Settings > Pages**
- **Source: Deploy from a branch**
- **Branch: main / (root)**

# Manutenção do Vale Verde

## Entrada do jogo

`index.html` carrega `src/bootstrap.js` (menu), que importa `game.js` ao entrar em um mundo. O jogo ativo usa Three.js diretamente. `legacy/` contém o protótipo React e scripts históricos; não é uma segunda implementação a atualizar.

## Onde alterar

| Mudança | Arquivo em `src/game/`, salvo indicação |
| --- | --- |
| Menu inicial | `src/bootstrap.js` |
| Criar, renomear, excluir e salvar mundos | `worlds.js` |
| Regras de progressão e validação dos dados salvos | `rules.js` |
| Montagem da partida, entradas, coleta e loop principal | `game.js` na raiz |
| Catálogo e geometria das construções | `buildings.js` |
| Catálogo de animais, árvores e mobília | `catalogs.js` |
| Modelos dos itens do catálogo | `models.js` |
| Ferramentas de edição e interações criativas | `creative.js` |
| Dados persistidos do editor | `creative-state.js` |
| Limites, terreno regional e regras de navegação | `region.js` |
| Cenário, lago e região oeste | `world-detail.js`, `lake-region.js`, `west-region.js` |
| Barco e embarque | `boating.js` |
| Animais, família e rotinas | `wildlife.js`, `family.js`, `routines.js` |
| Clima, céu e vegetação próxima | `environment.js`, `sky.js`, `ground-life.js` |
| Som | `audio.js` |
| Câmera e efeitos da experiência | `experience.js` |
| Interface visual | `style.css`, `src/creative.css`, `src/rpg.css` |

## Limites entre módulos

`buildings.js` cria modelos e registra suas hortas na coleção recebida. `game.js` registra os objetos editáveis, aplica o agrupamento de geometrias e conecta o editor. O barco tem seu próprio modelo e controlador.

`worlds.js` concentra o acesso à lista persistida. A interface chama suas funções e apresenta erros de armazenamento. Não copie operações de `localStorage` para os botões do menu.

Prefira funções pequenas com dependências explícitas. Preserve os módulos existentes quando já representarem um sistema claro. Não transforme cada trecho em uma classe ou camada adicional.

## Compatibilidade a preservar

- Não altere as chaves de armazenamento ou os identificadores de objetos existentes sem migração.
- A sequência aleatória do cenário original determina os identificadores de árvores e rochas. Não mude sua ordem inadvertidamente.
- Dados antigos de escavação continuam sendo preservados, embora o paredão não apareça na partida.
- As coordenadas dos itens devem continuar exatas; não arredonde para uma grade.
- Respeite pausa, qualidade gráfica e exclusão dos objetos ao acrescentar animações.

## Validação

Execute `npm test` e `npm run build`. Para alterações na cena ou interface, abra `npm run dev` e confira: criar/retomar mundo, construir e mover objeto, colher, embarcar/desembarcar, pausar e salvar/reabrir. Os testes de Node não substituem essa conferência visual.

Antes desta reorganização foi criada a cópia `maintenance-backup/before-refactor.zip`. Ela contém os arquivos de código anteriores, não os mundos armazenados no navegador.

## Complexidade restante

`game.js` ainda coordena vários sistemas e `creative.js` reúne interface e ações do editor. Futuras extrações devem acompanhar mudanças concretas, com testes de comportamento, evitando criar muitos arquivos que apenas repassem chamadas.

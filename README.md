# Meu Mundo · Vale Verde

Para alterar o código, consulte o [guia de manutenção](docs/MAINTENANCE.md): pontos de entrada, responsabilidades dos módulos e cuidados com os salvamentos. O protótipo anterior e os scripts históricos ficam em `legacy/`.

Execute `npm run dev` e abra **http://127.0.0.1:5173/**. Para gerar a versão de distribuição, use `npm run build`. Os testes rodam com `npm test`.

## Movimentos e mundo vivo

- A passada acompanha a distância percorrida, suaviza paradas e a postura sentada, e ajusta a altura dos pés ao terreno.
- Clique no cachorro e escolha **Jogar bolinha** em uma área aberta. Ele busca e traz a bola de volta; a brincadeira é temporária e pausa junto com o jogo.
- Familiares novos começam em **Rotina livre**. Crianças passeiam e brincam, adultos se aproximam da família, todos procuram assentos ao meio-dia, abrigo na chuva e a proximidade de uma casa à noite. Clique para **Acompanhar**, **Ficar aqui**, retomar a rotina ou **Conversar**. Familiares antigos mantêm sua preferência salva. Conversas são falas curtas, sem sistema de relacionamentos.
- Animais terrestres procuram margens para beber ou árvores para descansar no período quente, abrigo na chuva e espaço quando alguém chega muito perto. Destinos dependem dos elementos disponíveis nas proximidades; o desvio continua local, sem planejamento de trajetos por todo o mapa.
- Capim, flores e pedrinhas decorativos aparecem em lotes reutilizados perto do observador, respeitando água, caminhos centrais e construções. A qualidade baixa reduz a quantidade. Poças superficiais surgem na chuva e secam gradualmente.
- A água ganhou reflexo estilizado da cor do céu e pequenas variações nas normais das ondas; não é um espelho completo de todos os objetos. O barco e a cachoeira mantêm seus rastros e ondulações.
- O vento aumenta em altitude e na chuva, a vegetação e o lenço reagem ao clima, passos mudam no solo molhado e sons de animais próximos variam em volume e posição estéreo.

## Vale oeste, céu e família

O mapa agora mede **344 × 86**: a área anterior foi duplicada para oeste, com vale, trilha e uma subida até o mirante a 72 metros. O horizonte decorativo se estende por quilômetros; a área caminhável continua delimitada pelo mapa. Em **Explorar**, use **Visitar mirante**, **Ver pôr do sol no mirante** ou **Ver céu noturno no mirante**. Os dois últimos atalhos também mudam o horário do mundo. O deck tem bancos, guarda-corpo e lanternas noturnas.

A chuva deixa o céu cinza, com nuvens carregadas. No tempo aberto, o céu mostra pôr do sol, lua com crateras, estrelas e estrelas cadentes ocasionais à noite.

A pesquisa do catálogo procura em todas as categorias, inclusive construções, biomas e ações, e aceita palavras sem acentos. Em **Família**, adicione uma esposa e escolha a quantidade e o gênero das crianças. Não existe um limite fixo de filhos; a adição depende de espaço livre e dos recursos do aparelho. Familiares caminham e podem acompanhar o personagem ou ficar no local, além de serem movidos e excluídos pelo menu de clique. A família é salva com o mundo.

O paredão escavável e suas ferramentas foram retirados. Dados antigos de escavação são preservados no salvamento para compatibilidade, mas não geram a rocha.

## Lago, navegação e revisão

A área explorável passou de 86 × 86 para 172 × 86, ampliada para leste. A região original e os identificadores das árvores e pedras foram preservados. O lago novo tem margem, leito, montanha, cachoeira animada e deck fixo. Os nomes flutuantes de locais e as distâncias foram removidos.

Em **Explorar**, use **Visitar lago** para chegar ao deck e **Trazer barco ao deck** para criar ou recuperar seu barco. **Colocar barco** permite escolher um ponto do lago com o mouse. Aproxime-se e pressione **E** para embarcar; navegue com **WASD ou setas**, orientadas pela câmera, e pressione **E** perto do deck para atracar e desembarcar. Também é possível sair junto a uma margem livre. **V** alterna a câmera. Existe um barco por mundo, salvo com posição, direção e estado de embarque.

A revisão corrigiu o limite antigo de construção/salvamento, a saída insegura do barco, a atracação que prendia o movimento, o tom do bioma durante a chuva, a câmera atravessando obstáculos e posições presas ao mover/excluir mobília. O atalho M abre o mapa dentro do painel lateral. A navegação usa colisão geométrica e remos animados; não é uma simulação física de embarcações.

## O que entrou nesta versão

- Direção visual de RPG cartunesco: materiais com sombras em faixas, cores mais vivas, árvores e montanhas arredondadas, personagem com rosto expressivo e equipamento de aventureiro. Casas com venezianas, vasos, janela redonda e lanterna; nuvens, bandeirolas e borboletas animadas. Menu inicial ilustrado e interface clara em tons de creme e turquesa.

- Menu inicial sem login, criação de mundos, retomada e renomeação. O salvamento anterior é importado sem apagar a cópia original.
- Salvamento automático a cada 10 segundos, ao pausar e ao sair; botão Salvar e retorno à seleção de mundos.
- Catálogos na lateral esquerda: 58 animais, 12 árvores, 20 móveis e objetos, cinco ambientes e ferramentas de exploração.
- Clique em árvores, pedras, construções, hortas ou animais para mover ou excluir. Os itens do catálogo são colocados na coordenada do clique, sem arredondamento para uma grade.
- Clique no rio ou em um lago para colocar peixes ou excluir os que estão a até cinco metros do clique.
- Cachoeira na montanha do lago, música ambiente sintetizada, pássaros e água com intensidade conforme a proximidade da queda.
- Animais passeiam perto de onde foram colocados, com pausas e animação de patas e caudas. Peixes nadam dentro da água; cachorros acompanham o personagem próximo, mantendo uma pequena distância. Animais diurnos descansam à noite.
- Nove passarinhos ambientais voam em pequenos grupos durante o dia, com asas animadas. Surgem gradualmente ao amanhecer e desaparecem ao anoitecer. Grilos bem suaves entram à noite, com transição gradual e o mesmo controle de volume e pausa do restante do ambiente.
- Passarinhos bem pequenos fazem voos rápidos e se reúnem e dispersam em bandos. Cachorros correm, abanam o rabo e brincam em volta do personagem, alternando com pequenas pausas.
- Fogueira disponível em **Explorar → Fogueira** e **Mobília → Iluminação**: círculo de pedras, lenha, chamas animadas e luz quente com alcance de até 22 metros, diminuindo com a distância.
- Primeira pessoa, seleção de bioma, pintura e remoção de água. Poças vizinhas se unem em um lago com nível compartilhado.

## Controles

| Ação | Controle |
| --- | --- |
| Caminhar / correr | WASD ou setas / Shift |
| Olhar ao redor | Arrastar no mundo; na primeira pessoa também olha para cima e para baixo |
| Alternar câmera | V ou botão Primeira pessoa |
| Posicionar item | Selecionar no catálogo e clicar no chão |
| Girar item do catálogo | R antes de colocar |
| Interagir com um elemento | Clique, sem ferramenta selecionada |
| Criar lago | Bioma → Pintar água; clicar repetidamente no terreno |
| Cancelar / pausar | Esc cancela a seleção; outro Esc pausa |
| Coletar recursos | E |

A música do menu começa pelo botão “Ativar música e natureza”, respeitando a exigência de interação do navegador. Volume e qualidade ficam na pausa. Os catálogos criativos são livres; construções continuam usando os recursos e as descobertas do jogo anterior.

## Estado da implementação

Esta é uma primeira versão com modelos procedurais: os animais usam famílias de formas, movimentos articulados e passeios locais com desvio simples de obstáculos, sem planejamento de rotas longas. O local escolhido ao colocar ou mover um animal funciona como seu ponto de referência; ao reabrir o mundo ele retoma os passeios a partir desse local. Os lagos usam uma malha de células e não uma simulação física de fluidos. Os biomas alteram as cores do terreno e da vegetação existente.

Os dados ficam no armazenamento local do navegador, separados por endereço. Abrir em outro navegador, outra porta ou apagar os dados do site não transfere os mundos. Falhas de armazenamento são informadas e impedem o botão Mundos de abandonar uma partida ainda não salva.

Testes automatizados cobrem salvamentos, migração, isolamento entre mundos, catálogos, geometria, união de lagos, persistência de edições, colisão, escavação e detalhes animados do cenário. O menu ilustrado e a cena cartunesca foram conferidos no navegador, incluindo primeira pessoa, salvamento e retomada de um mundo de prévia. A qualidade visual em diferentes aparelhos e resoluções ainda pode precisar de ajustes.

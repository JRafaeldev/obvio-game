# ÓBVIO? — com Pisco e Fino

**ÓBVIO?** é um jogo de perguntas, pegadinhas, lógica e memória com os mascotes Pisco e Fino. Foi feito com HTML5, CSS3 e JavaScript puro, sem etapa de build.

Há 49 desafios aprovados: as fases 01–47, 49 e 50. A fase 48 está reservada para uma pergunta ainda não definida. No modo público, a partida começa na fase 01, segue sem checkpoints e termina após a fase 47 com uma mensagem de conteúdo em preparação.

## Funcionalidades

- Uma vida por tentativa: ao errar, a próxima partida recomeça na fase 01.
- Questões de múltipla escolha, alvos visuais, arrastar, sequências, memória e tempo.
- Recorde da maior fase alcançada e preferência de som salvos no navegador via LocalStorage.
- Layout responsivo com artes oficiais de Pisco e Fino; um retrato alternado por fase.
- Modais de instruções e créditos e modo local de teste de fases.

## Executar localmente

Na pasta `obvio-game`, inicie qualquer servidor estático, por exemplo:

```bash
python -m http.server 8000
```

Acesse `http://localhost:8000`. Todos os caminhos do projeto são relativos e funcionam em hospedagem estática, sem etapa de build.

## Fases e testes

As regras e cenas estão em `js/phases.js`; o fluxo de avanço, derrota, vitória, limpeza de eventos e temporizadores fica em `js/game.js`. Há desafios de escolha, alvo, arrastar, sequência, memória e tempo. As artes oficiais de Pisco e Fino são usadas sem alterações.

Para abrir qualquer fase em desenvolvimento, use `http://localhost:8000/?dev=1&phase=25` (troque 25 pelo número desejado). As fases 49 e 50 continuam acessíveis por esse modo enquanto a 48 não é definida. O seletor e os botões de teste de acerto/erro aparecem apenas em `localhost` ou `127.0.0.1` com `?dev=1`; não aparecem no site publicado. As fases abertas em modo de teste não aumentam o recorde.

Para executar a validação automatizada das 49 soluções aprovadas e dos caminhos de erro:

```bash
node tests/phases.test.mjs
```

## Mascotes oficiais

**Pisco** é a mascote principal: uma personagem feminina cartoon retrô, de cabelo preto comprido, terno preto elegante, luvas brancas, laço e bengala dourados. É debochada, carismática e inteligente.

**Fino** é o mascote coadjuvante: um feneco cartoon retrô, esguio, de orelhas grandes, cauda volumosa, terno vermelho e gravata-borboleta preta. É elegante, sarcástico e sofisticado.

Os PNGs oficiais estão em `assets/images/pisco.png`, `assets/images/fino.png`, `assets/images/piscoretrato.png` e `assets/images/finoretrato.png`. A home exibe as ilustrações de corpo inteiro diretamente sobre o fundo creme; as perguntas alternam os retratos no alto do card.

`assets/sounds/` está preparado para os efeitos futuros. O botão de som salva a preferência, mas nenhum áudio é reproduzido sem arquivos de áudio.

Antes da primeira partida, o recorde aparece como `00`. O controle de som está disponível na home e durante as fases.

const node = (tag, className = '', text = '') => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
};
const add = (parent, tag, className = '', text = '') => {
  const element = node(tag, className, text);
  parent.append(element);
  return element;
};
const button = (ctx, parent, label, action, className = 'scene-button') => {
  const element = add(parent, 'button', className, label);
  element.type = 'button';
  ctx.on(element, 'click', action);
  return element;
};
const mascot = (parent, name, className = '') => {
  const image = add(parent, 'img', `stage-mascot ${className}`);
  image.src = `./assets/images/${name}.png`;
  image.alt = name === 'pisco' ? 'Pisco' : 'Fino';
  image.width = 1086;
  image.height = 1448;
  return image;
};

const errorByType = {
  'multiple-choice': 'Escolher qualquer alternativa diferente da solução.',
  'click-target': 'Tocar em um alvo incorreto.',
  'drag-drop': 'Soltar fora do destino devolve a peça; a fase só avança ao completar o gesto.',
  sequence: 'Confirmar uma ordem incorreta ou tocar fora da sequência, quando aplicável.',
  memory: 'Escolher ou repetir uma resposta incorreta após a exibição.',
  'timed-action': 'Tocar em um alvo incorreto quando houver; aguardar não penaliza.',
  'interactive-scene': 'Tocar em uma opção incorreta quando houver.',
  'special-character': 'Tocar em um alvo incorreto quando houver.'
};
const phase = (number, title, prompt, type, solution, render) => ({
  id: `phase-${String(number).padStart(2, '0')}`,
  number, title, prompt, type, solution,
  elements: title,
  winCondition: solution,
  errorCondition: errorByType[type],
  render,
  cleanup(ctx) { ctx.cleanup(); }
});
const choicePhase = (number, title, prompt, options, correct, scene) =>
  phase(number, title, prompt, 'multiple-choice', String(options[correct]), ctx => {
    scene?.(ctx);
    ctx.choices(options, correct);
  });

// Drag with Pointer Events; tapping the source and then the target is an equivalent touch/keyboard path.
function dragTo(ctx, source, target, onSuccess) {
  let startX = 0;
  let startY = 0;
  let moved = false;
  let selected = false;
  ctx.on(source, 'pointerdown', event => {
    startX = event.clientX;
    startY = event.clientY;
    moved = false;
    source.setPointerCapture?.(event.pointerId);
  });
  ctx.on(source, 'pointermove', event => {
    if (!source.hasPointerCapture?.(event.pointerId)) return;
    const x = event.clientX - startX;
    const y = event.clientY - startY;
    moved ||= Math.abs(x) + Math.abs(y) > 8;
    if (moved) source.style.transform = `translate(${x}px, ${y}px)`;
  });
  ctx.on(source, 'pointerup', event => {
    if (!moved) return;
    const rect = target.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right
      && event.clientY >= rect.top && event.clientY <= rect.bottom;
    source.style.transform = '';
    if (inside) onSuccess();
  });
  ctx.on(source, 'click', () => {
    if (moved) { moved = false; return; }
    selected = !selected;
    source.classList.toggle('is-selected', selected);
  });
  ctx.on(target, 'click', () => { if (selected) onSuccess(); });
}



const newScenes = {
  espanha: ctx => {
    const label = ctx.phaseLabel;
    label.replaceChildren();
    const target = button(ctx, label, 'FASE 02', ctx.win, 'phase-number-target');
    target.setAttribute('aria-label', 'Fase 2');
    ctx.choices(['1','3','4','5'], -1);
  },
  corazul: ctx => memoryWord(ctx, 'VERDE', 'blue', 'Qual era a cor da palavra?', ['Azul','Blu','Verde','Green'], 0),
  corlaranja: ctx => memoryWord(ctx, 'AMARELO', 'orange', 'Qual palavra apareceu?', ['Amarelo','Laranja','Yellou','Dourado'], 0)
};
function memoryWord(ctx, word, color, prompt, options, answer) {
  const display = add(ctx.scene, 'div', `memory-word memory-word--${color}`, word);
  ctx.delay(() => {
    display.remove();
    ctx.setPrompt(prompt);
    ctx.choices(options, answer);
  }, 2500);
}
const newChoices = {
  idade: ['Uma pessoa tinha 15 anos em 2015. Quantos anos ela completou em 2026?', ['25','26','27','36'], 1],
  feijao: ['Quantos grãos de feijão-carioca existem aproximadamente em 1 kg?', ['3.500','1.032','10.000','25.000'], 0],
  matematica: ['2 + 2 × 6(3/3) = ?', ['14','24','2','41'], 0],
  futebol: ['5 gols em 9 minutos. Quem?', ['Lewandowski','Levandovisque','Lewandowske','Caça-Rato'], 0],
  nome: ['Qual é o nome deste jogo?', ['OBVIO','ÓBVIO?','OBVÍO','ÓBVIO'], 1],
  duzia: ['Quanto é meia dúzia mais meia dúzia?', ['6','12','18','24'], 1],
  dias: ['S, T, Q, Q, S, S, ?', ['D','S','T','Q'], 0],
  meses28: ['Quais meses têm 28 dias?', ['Fevereiro','Os meses pares','Todos os meses','Janeiro e fevereiro'], 2],
  aviao: ['Quem pilotou o 14-bis no primeiro voo público de um avião na Europa, em 1906?', ['Santos-Dumont','Irmãos Wright','Louis Blériot','Leonardo da Vinci'], 0],
  romano49: ['Qual número romano representa 49?', ['IL','XLIX','XXXXIX','LIX'], 1],
  letras: ['Quantas vezes a letra A aparece em PARALELO?', ['1','2','3','4'], 1],
  dicionario: ['Qual palavra está escrita incorretamente em todos os dicionários?', ['Dicionário','Errada','Incorretamente','Ortografia'], 2],
  contrario: ['Qual é o contrário de nunca?', ['Às vezes','Sempre','Jamais','Ontem'], 1],
  corrida: ['Você ultrapassou o terceiro colocado. Em que posição ficou?', ['Segundo lugar','Terceiro lugar','Quarto lugar','Primeiro lugar'], 1],
  palavra46: ['Quantas letras tem a maior palavra técnica dicionarizada da língua portuguesa?', ['22','46','43','100'], 1],
  geografia: ['Qual destes países não faz fronteira com o Brasil?', ['Uruguai','Equador','Peru','Bolívia'], 1],
  bissexto: ['Qual destes anos teve 29 de fevereiro?', ['1900','2000','2100','2023'], 1],
  mesesseq: ['J, F, M, A, M, J, J, A, ?', ['O','S','N','D'], 1],
  relogio: ['Quantas vezes por dia um relógio analógico de 12 horas, parado, marca a hora certa?', ['1','2','12','24'], 1],
  familia: ['Um pai tem três filhos. Cada filho tem duas irmãs. Quantos filhos ele tem?', ['3','5','6','9'], 1],
  romanos: ['Qual destes números romanos é maior?', ['IX','XI','VI','IV'], 1],
  memoria3: ['A resposta da pergunta 3, multiplicada por duas meias dúzias, é quanto?', ['312','400','17.000','1.000.000'], 0],
  significado: ['A maior palavra técnica dicionarizada da língua portuguesa está relacionada a quê?', ['Um objeto','Uma doença','Um animal','Um esporte'], 1]
};


const phases = [];

phases.push(choicePhase(1, 'Tiradentes', '21/04?', ['Gorro de Natal', 'Dente', 'Bandeira do Brasil', 'Bolo de aniversário'], 1));

phases.push(phase(2, 'Espanha', 'Títulos mundiais da Espanha (seleção masculina)', 'click-target', 'Número da fase: 2', newScenes.espanha));

phases.push(choicePhase(3, 'Idade', ...newChoices.idade));

phases.push(choicePhase(4, 'Feijão', ...newChoices.feijao));

phases.push(phase(5, 'A estrela', 'Clique na estrela que não está brilhando.', 'click-target', 'A quarta estrela, estática', ctx => {
  const row = add(ctx.scene, 'div', 'star-row');
  for (let index = 0; index < 4; index++) {
    const star = button(ctx, row, '★', index === 3 ? ctx.win : ctx.lose, `star-button ${index === 3 ? '' : 'is-shining'}`);
    star.setAttribute('aria-label', `Estrela ${index + 1}${index === 3 ? ', sem brilho' : ', brilhando'}`);
  }
}));

phases.push(choicePhase(6, 'Matemática', ...newChoices.matematica));

phases.push(choicePhase(7, 'Futebol', ...newChoices.futebol));

phases.push(choicePhase(8, 'Nome do jogo', ...newChoices.nome));

phases.push(phase(9, 'Cor ou palavra?', 'Clique no texto que está pintado de azul.', 'click-target', 'VERDE, pintado de azul', ctx => {
  const row = add(ctx.scene, 'div', 'color-words');
  [['AZUL', 'red'], ['VERDE', 'blue'], ['VERMELHO', 'green'], ['AMARELO', 'yellow']].forEach(([label, color]) => {
    button(ctx, row, label, color === 'blue' ? ctx.win : ctx.lose, `color-word color-word--${color}`);
  });
}));

phases.push(choicePhase(10, 'Uma dúzia', ...newChoices.duzia));

phases.push(choicePhase(11, 'Dias da semana', ...newChoices.dias));

phases.push(phase(12, 'Duas metades', 'Faça um coração.', 'drag-drop', 'Unir as duas metades', ctx => {
  const row = add(ctx.scene, 'div', 'drag-row');
  const left = button(ctx, row, '♥', () => {}, 'heart-half heart-half--left');
  const right = button(ctx, row, '♥', () => {}, 'heart-half heart-half--right drop-zone');
  left.setAttribute('aria-label', 'Metade esquerda do coração');
  right.setAttribute('aria-label', 'Metade direita do coração');
  dragTo(ctx, left, right, () => {
    row.classList.add('is-united');
    ctx.delay(ctx.win, 280);
  });
}));

phases.push(choicePhase(13, 'Meses', ...newChoices.meses28));

phases.push(choicePhase(14, 'Quantos?', 'Quantos números aparecem nesta pergunta?', ['2', '3', '8', '11'], 0, ctx => {
  add(ctx.scene, 'p', 'equation', '8 + 3 = ?');
}));

phases.push(phase(15, 'A resposta fugiu', 'Não deixe a resposta escapar.', 'timed-action', 'Tocar na resposta que muda de posição', ctx => {
  const track = add(ctx.scene, 'div', 'moving-track');
  const answer = button(ctx, track, 'RESPOSTA', ctx.win, 'scene-button moving-answer');
  let position = 0;
  const positions = ['0', 'calc(50% - 70px)', 'calc(100% - 140px)'];
  ctx.every(() => {
    position = (position + 1) % 3;
    answer.style.left = positions[position];
  }, 430);
}));

phases.push(choicePhase(16, 'Avião', ...newChoices.aviao));

phases.push(phase(17, 'Memória de cor e palavra', 'Observe a palavra.', 'memory', 'Azul', newScenes.corazul));

phases.push(choicePhase(18, 'Número romano', ...newChoices.romano49));

phases.push(choicePhase(19, 'A sequência', 'Complete a sequência: 2, 4, 8, 16, ?', ['18', '24', '32', '64'], 2));

phases.push(choicePhase(20, 'Letras', ...newChoices.letras));

phases.push(choicePhase(21, 'A metade e o dobro', 'Qual é a metade de 8 mais o dobro dessa metade, tudo multiplicado por um quarto de 8?', ['64','24','16','4'], 1));

phases.push(choicePhase(22, 'Quantos triângulos?', 'Quantos triângulos existem?', ['2', '3', '4', '5'], 1, ctx => {
  ctx.scene.insertAdjacentHTML('beforeend', '<svg class="triangle-diagram" viewBox="0 0 220 160" role="img" aria-label="Um triângulo grande dividido do vértice até a base em dois menores"><path d="M110 12 L12 146 L208 146 Z M110 12 L110 146" fill="none" stroke="currentColor" stroke-width="6" stroke-linejoin="round"/></svg>');
}));

phases.push(choicePhase(23, 'Dicionário', ...newChoices.dicionario));

phases.push(choicePhase(24, 'Contrário', ...newChoices.contrario));

phases.push(phase(25, 'Sorriso escondido', 'Encontre a carinha feliz.', 'click-target', 'A quarta carinha, com sorriso e olhos alegres', ctx => {
  const row = add(ctx.scene, 'div', 'faces-row');
  ['sad', 'sleepy', 'flat', 'happy', 'surprised', 'angry'].forEach((mood, index) => {
    const face = button(ctx, row, '', mood === 'happy' ? ctx.win : ctx.lose, `face-button face-button--${mood}`);
    face.setAttribute('aria-label', `Carinha ${index + 1}, ${mood === 'happy' ? 'feliz' : 'outra expressão'}`);
    add(face, 'span', 'face-eyes');
    add(face, 'span', 'face-mouth');
  });
}));

phases.push(phase(26, 'A senha', 'A senha é o número de lados de um quadrado.', 'sequence', 'Digitar 4 e confirmar', ctx => {
  const display = add(ctx.scene, 'output', 'keypad-display', '—');
  display.setAttribute('aria-label', 'Senha digitada');
  const pad = add(ctx.scene, 'div', 'keypad');
  let entered = '';
  for (let digit = 1; digit <= 9; digit++) {
    button(ctx, pad, String(digit), () => { entered = String(digit); display.textContent = entered; }, 'keypad-key');
  }
  button(ctx, pad, 'LIMPAR', () => { entered = ''; display.textContent = '—'; }, 'keypad-key keypad-key--clear');
  button(ctx, pad, '0', () => { entered = '0'; display.textContent = entered; }, 'keypad-key');
  button(ctx, pad, 'OK', () => entered === '4' ? ctx.win() : ctx.lose(), 'keypad-key keypad-key--ok');
}));

phases.push(phase(27, 'Ordem correta', 'Coloque os números em ordem crescente.', 'drag-drop', 'Ordenar 1, 2, 3, 4', ctx => {
  const row = add(ctx.scene, 'div', 'sort-row');
  const cards = [4, 1, 3, 2].map(number => button(ctx, row, String(number), () => {}, 'sort-card'));
  let selected = null;
  let dragged = false;
  const swap = (a, b) => {
    [a.textContent, b.textContent] = [b.textContent, a.textContent];
    a.classList.remove('is-selected');
    b.classList.remove('is-selected');
    selected = null;
  };
  cards.forEach(card => {
    let startX = 0;
    let startY = 0;
    ctx.on(card, 'pointerdown', event => {
      startX = event.clientX;
      startY = event.clientY;
      dragged = false;
      card.setPointerCapture?.(event.pointerId);
    });
    ctx.on(card, 'pointermove', event => {
      if (!card.hasPointerCapture?.(event.pointerId)) return;
      const x = event.clientX - startX;
      const y = event.clientY - startY;
      dragged ||= Math.abs(x) + Math.abs(y) > 8;
      if (dragged) card.style.transform = `translate(${x}px, ${y}px)`;
    });
    ctx.on(card, 'pointerup', event => {
      if (!dragged) return;
      card.style.transform = '';
      const target = cards.find(other => other !== card && (() => {
        const rect = other.getBoundingClientRect();
        return event.clientX >= rect.left && event.clientX <= rect.right
          && event.clientY >= rect.top && event.clientY <= rect.bottom;
      })());
      if (target) swap(card, target);
    });
    ctx.on(card, 'click', () => {
      if (dragged) { dragged = false; return; }
      if (selected === card) { card.classList.remove('is-selected'); selected = null; return; }
      if (selected) swap(selected, card);
      else { selected = card; card.classList.add('is-selected'); }
    });
  });
  button(ctx, ctx.scene, 'CONFERIR ORDEM', () => cards.map(card => card.textContent).join('') === '1234' ? ctx.win() : ctx.lose(), 'scene-button');
}));

phases.push(phase(28, 'Cinco inversões', 'Qual é o lado direito ao contrário, invertido 5 vezes?', 'click-target', 'Seta para direita', ctx => {
  add(ctx.scene, 'p', 'inversion-start', '←  × 5 inversões');
  const row = add(ctx.scene, 'div', 'arrow-row');
  [['↑','cima'],['←','esquerda'],['↓','baixo'],['→','direita']].forEach(([arrow,label]) => {
    const target = button(ctx, row, arrow, label === 'direita' ? ctx.win : ctx.lose, 'arrow-frame');
    target.setAttribute('aria-label', `Seta para ${label}`);
  });
}));

phases.push(phase(29, 'A menor distância', 'Qual caminho é mais curto?', 'click-target', 'Caminho reto, número 2', ctx => {
  const list = add(ctx.scene, 'div', 'paths-list');
  const paths = ['M12 38 C60 0 90 76 130 38 S195 0 208 38', 'M12 38 L208 38', 'M12 38 L65 12 L112 64 L160 12 L208 38'];
  paths.forEach((path, index) => {
    const item = button(ctx, list, '', index === 1 ? ctx.win : ctx.lose, 'path-choice');
    item.setAttribute('aria-label', `Caminho ${index + 1}`);
    add(item, 'span', 'path-choice__number', String(index + 1));
    item.insertAdjacentHTML('beforeend', `<svg viewBox="0 0 220 76" aria-hidden="true"><text x="0" y="46">A</text><path d="${path}" fill="none" stroke="currentColor" stroke-width="5"/><text x="210" y="46">B</text></svg>`);
  });
}));

phases.push(choicePhase(30, 'Maior palavra', ...newChoices.palavra46));

phases.push(phase(31, 'Lembre da cor', 'Observe os cartões por quatro segundos.', 'memory', 'A cor central era dourada', ctx => {
  const row = add(ctx.scene, 'div', 'memory-cards');
  ['terracota', 'dourado', 'azul'].forEach(color => add(row, 'div', `memory-card memory-card--${color}`));
  ctx.delay(() => {
    row.hidden = true;
    ctx.setPrompt('Qual era a cor do cartão central?');
    ctx.choices(['Azul', 'Dourado', 'Terracota', 'Verde'], 1);
  }, 4000);
}));

phases.push(phase(32, 'A ordem', 'Observe a ordem dos símbolos.', 'memory', 'Estrela, coração e lua', ctx => {
  const display = add(ctx.scene, 'div', 'memory-display', '★');
  display.setAttribute('aria-live', 'polite');
  ctx.delay(() => { display.textContent = '♥'; }, 900);
  ctx.delay(() => { display.textContent = '☾'; }, 1800);
  ctx.delay(() => {
    display.hidden = true;
    ctx.setPrompt('Toque os símbolos na ordem em que apareceram.');
    const row = add(ctx.scene, 'div', 'symbol-row');
    let step = 0;
    [['☾', 2], ['★', 0], ['♥', 1]].forEach(([symbol, order]) => {
      button(ctx, row, symbol, () => {
        if (order !== step) { ctx.lose(); return; }
        step++;
        ctx.setFeedback(`${step} de 3`);
        if (step === 3) ctx.win();
      }, 'symbol-button');
    });
  }, 2700);
}));

phases.push(phase(33, 'Piscou, perdeu', 'Quantas vezes a estrela piscou?', 'memory', 'Quatro piscadas', ctx => {
  const star = add(ctx.scene, 'div', 'blink-star', '★');
  star.setAttribute('aria-label', 'Estrela que pisca quatro vezes');
  const replay = button(ctx, ctx.scene, 'VER NOVAMENTE', () => run(), 'scene-button replay-button');
  let scheduled = [];
  function run() {
    scheduled.forEach(ctx.clearTimer);
    scheduled = [];
    star.classList.remove('is-off');
    ctx.answers.replaceChildren();
    for (let index = 0; index < 4; index++) {
      scheduled.push(ctx.delay(() => star.classList.add('is-off'), 500 + index * 850));
      scheduled.push(ctx.delay(() => star.classList.remove('is-off'), 750 + index * 850));
    }
    scheduled.push(ctx.delay(() => ctx.choices(['3', '4', '5', '6'], 1), 3900));
  }
  run();
}));

phases.push(choicePhase(34, 'Geografia', ...newChoices.geografia));

phases.push(choicePhase(35, 'Ano bissexto', ...newChoices.bissexto));

phases.push(phase(36, 'A peça diferente', 'Observe as quatro peças.', 'memory', 'A segunda peça mudou de círculo para losango', ctx => {
  const stage = add(ctx.scene, 'div', 'pieces-stage');
  const row = add(stage, 'div', 'pieces-row');
  const pieces = ['●', '●', '■', '▲'].map((shape, index) => add(row, 'div', 'memory-piece', shape));
  const curtain = add(stage, 'div', 'memory-curtain', 'Um instante...');
  curtain.hidden = true;
  ctx.delay(() => { curtain.hidden = false; }, 3000);
  ctx.delay(() => {
    pieces[1].textContent = '◆';
    curtain.hidden = true;
    ctx.setPrompt('Qual peça mudou?');
    ctx.choices(['1', '2', '3', '4'], 1);
  }, 3800);
}));

phases.push(choicePhase(37, 'O padrão', 'Qual figura completa o padrão?', ['●', '■', '▲', '◆'], 0, ctx => {
  add(ctx.scene, 'p', 'pattern-line', '●  ■  ●  ■  ?');
}));

phases.push(phase(38, 'Olhe novamente', 'Observe os símbolos.', 'memory', 'A estrela apareceu primeiro', ctx => {
  const display = add(ctx.scene, 'div', 'memory-display', '★');
  display.setAttribute('aria-live', 'polite');
  ctx.delay(() => { display.textContent = '☾'; }, 1000);
  ctx.delay(() => { display.textContent = 'ϟ'; }, 2000);
  ctx.delay(() => {
    display.hidden = true;
    ctx.setPrompt('Qual símbolo apareceu primeiro?');
    ctx.choices(['Lua', 'Raio', 'Estrela', 'Nenhum'], 2);
  }, 3000);
}));

phases.push(phase(39, 'Setas', 'Observe e repita a sequência.', 'sequence', 'Cima, baixo, direita, esquerda', ctx => {
  const display = add(ctx.scene, 'div', 'memory-display', '↑');
  display.setAttribute('aria-live', 'polite');
  ['↓', '→', '←'].forEach((arrow, index) => ctx.delay(() => { display.textContent = arrow; }, (index + 1) * 800));
  ctx.delay(() => {
    display.hidden = true;
    ctx.setPrompt('Repita a sequência.');
    const row = add(ctx.scene, 'div', 'arrow-row');
    const sequence = ['↑', '↓', '→', '←'];
    let step = 0;
    ['↑', '↓', '→', '←'].forEach(arrow => button(ctx, row, arrow, () => {
      if (arrow !== sequence[step]) { ctx.lose(); return; }
      step++;
      ctx.setFeedback(`${step} de 4`);
      if (step === 4) ctx.win();
    }, 'arrow-frame'));
  }, 3200);
}));

phases.push(choicePhase(40, 'Meses', ...newChoices.mesesseq));

phases.push(choicePhase(41, 'Relógio', ...newChoices.relogio));

phases.push(choicePhase(42, 'Família', ...newChoices.familia));

phases.push(choicePhase(43, 'Romanos', ...newChoices.romanos));

phases.push(choicePhase(44, 'Corrida', ...newChoices.corrida));

phases.push(choicePhase(45, 'Memória', ...newChoices.memoria3));

phases.push(choicePhase(46, 'Significado', ...newChoices.significado));

phases.push(phase(47, 'Memória de cor e palavra', 'Observe a palavra.', 'memory', 'Amarelo', newScenes.corlaranja));


// A fase 48 aguarda uma pergunta aprovada. O fluxo público termina na 47.
phases.push({ ...phase(48, 'Pendente', 'Fase 48 em definição editorial.', 'interactive-scene', 'Aguardando aprovação', ctx => {
  add(ctx.scene, 'p', 'editorial-pending', 'Conteúdo ainda não aprovado.');
}), available: false });
phases.push(phase(49, 'A última armadilha', 'Para passar, não pressione o botão JOGAR.', 'interactive-scene', 'Tocar em passar no enunciado', ctx => {
  ctx.question.replaceChildren();
  ctx.question.append(document.createTextNode('Para '));
  const target = button(ctx, ctx.question, 'passar', ctx.win, 'inline-pass');
  target.setAttribute('aria-label', 'passar');
  ctx.question.append(document.createTextNode(', não pressione o botão JOGAR.'));
  button(ctx, ctx.scene, 'JOGAR', ctx.lose, 'trap-play');
}));

phases.push(phase(50, 'O final', 'Você chegou até aqui.', 'interactive-scene', 'O ponto final do próprio enunciado', ctx => {
  ctx.question.replaceChildren();
  ctx.question.append(document.createTextNode('Você chegou até '));
  const ending = add(ctx.question, 'span', 'final-phrase', 'aqui');
  const dot = button(ctx, ending, '.', ctx.win, 'final-dot');
  dot.setAttribute('aria-label', 'Ponto final do enunciado');
  ctx.choices(['Inteligência', 'Sorte', 'Coragem', 'Nada'], -1);
}));


export { phases, phase, choicePhase, node, add, button, mascot, dragTo };

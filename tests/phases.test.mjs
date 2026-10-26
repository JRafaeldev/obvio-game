import assert from 'node:assert/strict';
import { phases } from '../js/phases.js';

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName;
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.style = { setProperty() {}, transform: '' };
    this.classes = new Set();
    this.classList = {
      add: (...names) => names.forEach(name => this.classes.add(name)),
      remove: (...names) => names.forEach(name => this.classes.delete(name)),
      toggle: (name, force) => {
        if (force ?? !this.classes.has(name)) this.classes.add(name);
        else this.classes.delete(name);
      }
    };
    this._text = '';
    this.listeners = new Map();
    this.hidden = false;
    this.disabled = false;
  }
  set className(value) { this._className = value; }
  get className() { return this._className || ''; }
  set textContent(value) { this._text = String(value); this.children = []; }
  get textContent() { return this._text + this.children.map(child => child.textContent || '').join(''); }
  get lastElementChild() { return this.children.at(-1); }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = [...children]; this._text = ''; }
  setAttribute(name, value) { this.attributes[name] = value; }
  addEventListener(event, handler) {
    const handlers = this.listeners.get(event) || [];
    handlers.push(handler);
    this.listeners.set(event, handlers);
  }
  click() {
    if (this.disabled || this.hidden) return;
    for (const handler of this.listeners.get('click') || []) handler({ target: this });
  }
  focus() {}
  remove() { this.hidden = true; }
  insertAdjacentHTML(_position, html) { this.children.push({ textContent: html }); }
  getBoundingClientRect() { return { left: 0, right: 100, top: 0, bottom: 100 }; }
  setPointerCapture() {}
  hasPointerCapture() { return false; }
}
globalThis.document = {
  createElement: tag => new FakeElement(tag),
  createTextNode: text => ({ textContent: text })
};

function testContext() {
  const timers = [];
  const context = {
    scene: new FakeElement('div'),
    answers: new FakeElement('div'),
    question: new FakeElement('h2'),
    phaseLabel: new FakeElement('p'),
    wins: 0,
    losses: 0,
    win() { context.wins++; },
    lose() { context.losses++; },
    setPrompt(text) { context.question.textContent = text; },
    setFeedback() {},
    on(element, event, handler) { element.addEventListener(event, handler); },
    delay(fn, ms) {
      const timer = { fn, ms, cancelled: false };
      timers.push(timer);
      return timer;
    },
    every(fn, ms) {
      const timer = { fn, ms, cancelled: false, interval: true };
      timers.push(timer);
      return timer;
    },
    clearTimer(timer) { timer.cancelled = true; },
    choices(options, correctIndex) {
      context.answers.replaceChildren();
      options.forEach((option, index) => {
        const item = new FakeElement('button');
        item.textContent = option;
        item.correct = index === correctIndex;
        item.addEventListener('click', () => item.correct ? context.win() : context.lose());
        context.answers.append(item);
      });
    },
    cleanup() { timers.forEach(timer => { timer.cancelled = true; }); },
    flush() {
      let steps = 0;
      while (timers.some(timer => !timer.cancelled && !timer.interval)) {
        if (++steps > 30) throw new Error('Timer loop');
        const timer = timers.filter(item => !item.cancelled && !item.interval).sort((a, b) => a.ms - b.ms)[0];
        timer.cancelled = true;
        timer.fn();
      }
    }
  };
  return context;
}

assert.equal(phases.length, 50);
assert.deepEqual(phases.map(item => item.number), Array.from({ length: 50 }, (_, index) => index + 1));
assert.equal(new Set(phases.map(item => item.id)).size, 50);
assert.equal(phases.filter(item => item.available === false).length, 1);
assert.equal(phases[47].available, false);

for (const item of phases) {
  assert.ok(item.prompt && item.title && item.solution && item.elements && item.winCondition && item.errorCondition,
    `Fase ${item.number} precisa de conteúdo, elementos e condições`);
  assert.equal(typeof item.render, 'function');
  assert.equal(typeof item.cleanup, 'function');
  const first = testContext();
  item.render(first);
  first.flush();
  assert.ok(first.scene.children.length || first.answers.children.length || first.question.children.length || first.wins,
    `Fase ${item.number} não renderizou uma interação`);
  item.cleanup(first);
  const second = testContext();
  item.render(second);
  second.flush();
  item.cleanup(second);
}

function allButtons(context) {
  const result = [];
  const visit = element => {
    if (element.tagName === 'button') result.push(element);
    for (const child of element.children || []) visit(child);
  };
  [context.scene, context.answers, context.question, context.phaseLabel].forEach(visit);
  return result;
}
function press(context, label, occurrence = 0) {
  const matches = allButtons(context).filter(item => item._text === label || item.attributes['aria-label'] === label);
  assert.ok(matches[occurrence], `Botão ausente: ${label}`);
  matches[occurrence].click();
}
function pressAnswer(context, index) {
  const item = context.answers.children[index];
  assert.ok(item, `Alternativa ${index + 1} ausente`);
  item.click();
}
const special = {
  1: c => press(c, 'Dente'),
  2: c => press(c, 'Fase 2'),
  5: c => press(c, 'Estrela 4, sem brilho'),
  9: c => press(c, 'VERDE'),
  12: c => { press(c, 'Metade esquerda do coração'); press(c, 'Metade direita do coração'); c.flush(); },
  15: c => press(c, 'RESPOSTA'),
  25: c => press(c, 'Carinha 4, feliz'),
  26: c => { press(c, '4'); press(c, 'OK'); },
  27: c => { press(c, '4'); press(c, '1'); press(c, '4'); press(c, '2'); press(c, 'CONFERIR ORDEM'); },
  28: c => press(c, 'Seta para direita'),
  29: c => press(c, 'Caminho 2'),
  31: c => { c.flush(); press(c, 'Dourado'); },
  32: c => { c.flush(); ['★','♥','☾'].forEach(symbol => press(c, symbol)); },
  33: c => { c.flush(); press(c, '4'); },
  36: c => { c.flush(); press(c, '2'); },
  38: c => { c.flush(); press(c, 'Estrela'); },
  39: c => { c.flush(); ['↑','↓','→','←'].forEach(arrow => press(c, arrow)); },
  49: c => press(c, 'passar'),
  50: c => press(c, 'Ponto final do enunciado')
};
assert.match(phases[1].prompt, /Espanha/);
assert.match(phases[2].prompt, /2015/);
assert.match(phases[44].prompt, /pergunta 3/);
assert.match(phases[48].prompt, /passar/);
for (const item of phases.filter(item => item.available !== false)) {
  const context = testContext();
  item.render(context);
  if (special[item.number]) special[item.number](context);
  else {
    context.flush();
    const correct = context.answers.children.find(child => child.textContent === item.solution);
    assert.ok(correct, `Fase ${item.number} sem alternativa correta: ${item.solution}`);
    correct.click();
  }
  assert.equal(context.wins, 1, `Fase ${item.number} sem vitória`);
  assert.equal(context.losses, 0, `Fase ${item.number} perdeu na solução`);
  item.cleanup(context);
}
for (const item of phases.filter(item => item.type === 'multiple-choice')) {
  const context = testContext();
  item.render(context);
  context.flush();
  const wrong = context.answers.children.find(child => !child.correct);
  assert.ok(wrong, `Fase ${item.number} sem opção errada`);
  wrong.click();
  assert.equal(context.losses, 1, `Fase ${item.number} sem derrota`);
}
for (const [number, label] of [[1,'Gorro de Natal'],[2,'1'],[5,'Estrela 1, brilhando'],[9,'AZUL'],[25,'Carinha 1, outra expressão'],[28,'Seta para cima'],[49,'JOGAR']]) {
  const context = testContext();
  phases[number - 1].render(context);
  press(context, label);
  assert.equal(context.losses, 1, `Fase ${number} sem erro especial`);
}
for (const [number, label] of [[17,'Verde'],[26,'3'],[31,'Azul'],[33,'3'],[36,'1'],[38,'Lua'],[47,'Laranja']]) {
  const context = testContext();
  phases[number - 1].render(context);
  context.flush();
  press(context, label);
  if (number === 26) press(context, 'OK');
  assert.equal(context.losses, 1, `Fase ${number} sem derrota por resposta errada`);
}
for (const [number, wrong] of [[32,'☾'],[39,'←']]) {
  const context = testContext();
  phases[number - 1].render(context);
  context.flush();
  press(context, wrong);
  assert.equal(context.losses, 1, `Fase ${number} sem derrota por ordem errada`);
}
const last = testContext();
phases[49].render(last);
last.answers.children.find(child => child.textContent === 'Nada').click();
assert.equal(last.losses, 1);
console.log('49 desafios aprovados: renderização, reinício, acertos e erros verificados. Fase 48 pendente.');

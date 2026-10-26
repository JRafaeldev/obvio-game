import { saveBestPhase } from './storage.js';
import { phases } from './phases.js';

export function createGame({ onRecordChange }) {
  const topbar = document.querySelector('.game-topbar');
  const card = document.querySelector('.game-card');
  const result = document.querySelector('#result-card');
  const phaseLabel = document.querySelector('#phase-label');
  const eyebrow = document.querySelector('#stage-eyebrow');
  const portrait = document.querySelector('#phase-portrait');
  const question = document.querySelector('#question-text');
  const scene = document.querySelector('#stage-scene');
  const answers = document.querySelector('#answers');
  const feedback = document.querySelector('#game-feedback');
  let phaseIndex = 0;
  let active = null;
  let context = null;
  let transitionTimer = null;
  let locked = false;
  let trackRecord = true;

  function clearTransition() {
    if (transitionTimer !== null) window.clearTimeout(transitionTimer);
    transitionTimer = null;
  }
  function cleanup() {
    clearTransition();
    if (active && context) active.cleanup(context);
    active = null;
    context = null;
  }
  function showResult(victory, pending = false) {
    cleanup();
    topbar.hidden = true;
    card.hidden = true;
    result.hidden = false;
    result.classList.toggle('is-victory', victory);
    document.querySelector('#result-pisco-bubble').textContent = pending ? 'Até aqui!' : victory ? 'Como assim?!' : 'Ops...';
    document.querySelector('#result-fino-bubble').textContent = pending ? 'Voltamos já.' : victory ? 'Bravo!' : 'Outra chance?';
    document.querySelector('#result-eyebrow').textContent = pending ? 'ÓBVIO? · ATÉ AQUI' : victory ? 'PISCO: "COMO ASSIM?!" · FINO: "BRAVO!"' : 'PISCO: "OPA..." · FINO: "TENTE DE NOVO."';
    document.querySelector('#result-title').textContent = pending ? 'Você chegou ao fim das fases disponíveis' : victory ? 'Parabéns! Você venceu o ÓBVIO?' : 'Fim de jogo!';
    document.querySelector('#result-message').textContent = pending
      ? 'A fase 48 ainda está em criação. Obrigado por jogar até aqui.'
      : victory ? 'Você pensou até o último ponto. Pisco está inconformada; Fino comemora.'
      : `Você chegou à fase ${String(phaseIndex + 1).padStart(2, '0')}. Sua próxima tentativa começa na fase 01.`;
    document.querySelector('#result-title').focus();
  }
  function resolve(correct) {
    if (locked) return;
    locked = true;
    active?.cleanup(context);
    active = null;
    context = null;
    feedback.textContent = correct ? 'ACERTOU!' : 'ERROU!';
    card.classList.add(correct ? 'is-success' : 'is-failure');
    if (correct) {
      for (let index = 0; index < 6; index++) {
        const particle = document.createElement('span');
        particle.className = 'success-particle';
        particle.style.setProperty('--particle-x', `${(index - 2.5) * 24}px`);
        card.append(particle);
      }
    }
    transitionTimer = window.setTimeout(() => {
      if (!correct) showResult(false);
      else if (phaseIndex === phases.length - 1) showResult(true);
      else if (trackRecord && phases[phaseIndex + 1].available === false) showResult(false, true);
      else load(phaseIndex + 1);
    }, correct ? 420 : 350);
  }
  function createContext() {
    const controller = new AbortController();
    const timers = new Set();
    const clearTimer = handle => {
      if (!handle) return;
      if (handle.type === 'interval') window.clearInterval(handle.id);
      else window.clearTimeout(handle.id);
      timers.delete(handle);
    };
    return {
      scene, answers, question, phaseLabel,
      win: () => resolve(true),
      lose: () => resolve(false),
      setPrompt: text => { question.textContent = text; },
      setFeedback: text => { feedback.textContent = text; },
      on(element, event, handler) { element.addEventListener(event, handler, { signal: controller.signal }); },
      delay(fn, ms) {
        const handle = { type: 'timeout', id: null };
        handle.id = window.setTimeout(() => { timers.delete(handle); fn(); }, ms);
        timers.add(handle);
        return handle;
      },
      every(fn, ms) {
        const handle = { type: 'interval', id: window.setInterval(fn, ms) };
        timers.add(handle);
        return handle;
      },
      clearTimer,
      choices(options, correctIndex) {
        answers.replaceChildren();
        options.forEach((option, index) => {
          const item = document.createElement('button');
          item.type = 'button';
          item.className = 'answer-button';
          item.textContent = option;
          item.addEventListener('click', () => {
            item.classList.add(index === correctIndex ? 'is-correct' : 'is-wrong');
            index === correctIndex ? resolve(true) : resolve(false);
          }, { signal: controller.signal });
          answers.append(item);
        });
      },
      cleanup() {
        controller.abort();
        [...timers].forEach(clearTimer);
      }
    };
  }
  function load(index) {
    cleanup();
    if (!Number.isInteger(index) || index < 0 || index >= phases.length || (trackRecord && phases[index].available === false)) throw new RangeError('Fase inválida');
    phaseIndex = index;
    locked = false;
    active = phases[index];
    if (trackRecord) onRecordChange(saveBestPhase(index + 1));
    topbar.hidden = false;
    card.hidden = false;
    result.hidden = true;
    card.classList.remove('is-success', 'is-failure');
    card.querySelectorAll('.success-particle').forEach(particle => particle.remove());
    phaseLabel.textContent = `FASE ${String(index + 1).padStart(2, '0')}`;
    eyebrow.textContent = active.title.toUpperCase();
    const mascot = index % 2 === 0 ? 'pisco' : 'fino';
    if (portrait) {
      portrait.src = `./assets/images/${mascot}retrato.png`;
      portrait.alt = `Retrato de ${mascot === 'pisco' ? 'Pisco' : 'Fino'}`;
    }
    question.textContent = active.prompt;
    feedback.textContent = '';
    scene.replaceChildren();
    answers.replaceChildren();
    context = createContext();
    active.render(context);
  }
  return {
    start(index = 0, shouldTrackRecord = true) { trackRecord = shouldTrackRecord; load(index); },
    stop() { cleanup(); },
    load,
    debugResolve(correct) { resolve(correct); },
    count: phases.length
  };
}

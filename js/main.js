import { getBestPhase, getSoundEnabled, setSoundEnabled } from './storage.js';
import { createGame } from './game.js';

const home = document.querySelector('#home-screen');
const gameScreen = document.querySelector('#game-screen');
const recordValue = document.querySelector('#record-value');
const soundButtons = [...document.querySelectorAll('.sound-button')];
const backdrop = document.querySelector('#modal-backdrop');
const modal = document.querySelector('#info-modal');
const modalTitle = document.querySelector('#modal-title');
const modalBody = document.querySelector('#modal-body');
const modalClose = document.querySelector('#modal-close');
let returnFocusTo = null;
let soundEnabled = getSoundEnabled();

function showRecord(phase) { recordValue.textContent = String(phase).padStart(2, '0'); }
function showSound() {
  soundButtons.forEach(button => {
    button.setAttribute('aria-pressed', String(soundEnabled));
    button.setAttribute('aria-label', soundEnabled ? 'Desativar som' : 'Ativar som');
    button.querySelector('span').textContent = soundEnabled ? 'LIGADO' : 'DESLIGADO';
  });
}

// Later sound effects can check this preference before playing an audio asset.
soundButtons.forEach(button => {
  button.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    setSoundEnabled(soundEnabled);
    showSound();
  });
});

function showScreen(next, previous) {
  previous.classList.remove('is-active');
  previous.hidden = true;
  next.hidden = false;
  next.classList.add('is-active');
}

const game = createGame({ onRecordChange: showRecord });
function enterGame(index = 0, trackRecord = true) {
  game.start(index, trackRecord);
  if (gameScreen.hidden) showScreen(gameScreen, home);
  document.querySelector('#game-sound-button').focus();
}
function returnHome() {
  game.stop();
  showScreen(home, gameScreen);
  document.querySelector('#play-button').focus();
}
document.querySelector('#play-button').addEventListener('click', () => enterGame());
document.querySelector('#back-button').addEventListener('click', returnHome);
document.querySelector('#result-back-button').addEventListener('click', returnHome);
document.querySelector('#retry-button').addEventListener('click', () => enterGame());

// The phase picker is available only on a local development server with ?dev=1.
const params = new URLSearchParams(window.location.search);
const isDevelopment = ['localhost', '127.0.0.1'].includes(window.location.hostname) && params.get('dev') === '1';
if (isDevelopment) {
  const panel = document.querySelector('#dev-panel');
  const select = document.querySelector('#dev-phase');
  for (let number = 1; number <= game.count; number++) {
    const option = document.createElement('option');
    option.value = String(number - 1);
    option.textContent = `Fase ${String(number).padStart(2, '0')}`;
    select.append(option);
  }
  panel.hidden = false;
  document.querySelector('#dev-load').addEventListener('click', () => enterGame(Number(select.value), false));
  document.querySelector('#dev-win').addEventListener('click', () => game.debugResolve(true));
  document.querySelector('#dev-lose').addEventListener('click', () => game.debugResolve(false));
  const requestedPhase = Number(params.get('phase'));
  if (Number.isInteger(requestedPhase) && requestedPhase >= 1 && requestedPhase <= game.count) enterGame(requestedPhase - 1, false);
}

function openModal(title, lines) {
  returnFocusTo = document.activeElement;
  modalTitle.textContent = title;
  modalBody.replaceChildren(...lines.map(line => {
    const paragraph = document.createElement('p');
    paragraph.textContent = line;
    return paragraph;
  }));
  backdrop.hidden = false;
  document.body.style.overflow = 'hidden';
  modalClose.focus();
}
function closeModal() {
  backdrop.hidden = true;
  document.body.style.overflow = '';
  returnFocusTo?.focus();
}
document.querySelector('#rules-button').addEventListener('click', () => openModal('Como funciona', [
  'Você tem uma chance.',
  'Errou? Volta ao começo.',
  'Nem tudo é o que parece.',
  'Pense antes de clicar.'
]));
document.querySelector('#credits-button').addEventListener('click', () => openModal('Créditos', [
  'ÓBVIO?',
  'Pisco: mascote principal, debochada, carismática e inteligente.',
  'Fino: mascote coadjuvante, elegante, sarcástico e sofisticado.'
]));
modalClose.addEventListener('click', closeModal);
backdrop.addEventListener('click', event => { if (event.target === backdrop) closeModal(); });
document.addEventListener('keydown', event => {
  if (backdrop.hidden) return;
  if (event.key === 'Escape') { closeModal(); return; }
  if (event.key !== 'Tab') return;
  const focusable = [...modal.querySelectorAll('button, [href], [tabindex]:not([tabindex="-1"])')].filter(element => !element.disabled);
  if (!focusable.length) { event.preventDefault(); modal.focus(); return; }
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

showRecord(getBestPhase());
showSound();

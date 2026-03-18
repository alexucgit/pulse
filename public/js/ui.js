// ui.js — gestione stato UI e interazioni

import { analyze }  from './api.js';
import { renderAll } from './render.js';

const STEPS = [
  'RACCOLTA FONTI...',
  'ANALISI LINGUISTICA...',
  'RILEVAMENTO FRAMING...',
  'CALCOLO SCORE...',
  'GENERAZIONE BRIEF...',
];

// ── Clock ──────────────────────────────────────────────────────
function startClock() {
  const el = document.getElementById('clock');
  const tick = () => {
    el.textContent = new Date().toUTCString().split(' ')[4] + ' UTC';
  };
  tick();
  setInterval(tick, 1000);
}

// ── Chip toggle ────────────────────────────────────────────────
function initChips() {
  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => chip.classList.toggle('active'));
  });
}

function getSelected() {
  return [...document.querySelectorAll('.chip.active')].map(c => c.dataset.c);
}

// ── Loading overlay ────────────────────────────────────────────
let stepTimer = null;

function showLoading() {
  const overlay = document.getElementById('overlay');
  const stepEl  = document.getElementById('overlayStep');
  overlay.classList.add('active');
  let i = 0;
  stepEl.textContent = STEPS[0];
  stepTimer = setInterval(() => {
    stepEl.textContent = STEPS[++i % STEPS.length];
  }, 900);
}

function hideLoading() {
  clearInterval(stepTimer);
  document.getElementById('overlay').classList.remove('active');
}

// ── Error bar ──────────────────────────────────────────────────
function showError(msg) {
  const bar = document.getElementById('errorBar');
  bar.textContent = '// ERR: ' + msg;
  bar.classList.add('active');
  setTimeout(() => bar.classList.remove('active'), 6000);
}

// ── Main action ────────────────────────────────────────────────
async function runAnalysis() {
  const countries = getSelected();
  if (!countries.length) return;

  const btn = document.getElementById('runBtn');
  btn.disabled = true;
  showLoading();

  try {
    const data = await analyze(countries);
    renderAll(data);
  } catch (err) {
    showError(err.message);
  } finally {
    hideLoading();
    btn.disabled = false;
  }
}

// ── Boot ───────────────────────────────────────────────────────
export function init() {
  startClock();
  initChips();
  document.getElementById('runBtn').addEventListener('click', runAnalysis);
}

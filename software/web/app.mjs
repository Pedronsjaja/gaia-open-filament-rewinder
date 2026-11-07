import { MATERIALS, massKg, lengthM, metresPerCount, calibrationFactor } from '../simulator/math.mjs';
import { RewinderSimulator, validateConfig as validateSimulatorConfig } from '../simulator/machine.mjs';

const STORAGE_KEY = 'gaia-rewinder-demo-v1';
const SCHEMA_VERSION = '1.0';
const $ = (id) => document.getElementById(id);
const number = (value, digits = 2) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
const stateLabels = { IDLE: 'Pronto', RUNNING: 'Em simulação', PAUSED: 'Pausado', COMPLETED: 'Concluído', STOPPED: 'Interrompido', FAULT: 'Falha travada' };
const faultLabels = { FILAMENT_ABSENT: 'Ausência de filamento', NO_MOVEMENT: 'Sem movimento no encoder', LIMIT_CONFLICT: 'Conflito dos fins de curso', EMERGENCY_STOP: 'Parada de emergência virtual' };
let sessions = [];
let sessionRecorded = true;
let sessionStartedAt = null;
let lastFrame = performance.now();
let lastRender = 0;
let persistedConfig = null;

function announce(message, error = false) {
  $('notice').textContent = message;
  $('notice').classList.toggle('error', error);
  $('notice').hidden = false;
}

function finite(value, minimum, maximum, name) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) throw new Error(`${name}: informe um valor entre ${minimum} e ${maximum}.`);
  return parsed;
}

function validateConfig(config) {
  if (!config || typeof config !== 'object' || !['PLA', 'PETG', 'ABS', 'CUSTOM'].includes(config.material)) throw new Error('Material inválido.');
  if (!['length', 'mass'].includes(config.targetMode)) throw new Error('Tipo de meta inválido.');
  finite(config.densityKgM3, 500, 3000, 'Densidade');
  finite(config.diameterM, 0.0005, 0.004, 'Diâmetro');
  finite(config.targetLengthM, 0.001, 100000, 'Comprimento');
  finite(config.targetMassKg, 0.000001, 100, 'Massa');
  finite(config.speedMps, 0.001, 0.5, 'Velocidade');
  finite(config.accelerationMps2, 0.001, 1, 'Aceleração');
  finite(config.wheelDiameterM, 0.005, 0.2, 'Roda');
  finite(config.countsPerRevolution, 1, 1000000, 'Contagens');
  if (!Number.isInteger(config.countsPerRevolution)) throw new Error('Contagens por volta devem ser inteiras.');
  finite(config.calibrationFactor, 0.5, 2, 'Fator de calibração');
  return validateSimulatorConfig(Object.fromEntries(['material', 'densityKgM3', 'diameterM', 'targetMode', 'targetLengthM', 'targetMassKg', 'speedMps', 'accelerationMps2', 'wheelDiameterM', 'countsPerRevolution', 'calibrationFactor'].map((key) => [key, config[key]])));
}

function validateSession(item) {
  if (!item || item.mode !== 'SIMULATED' || !['COMPLETED', 'STOPPED', 'FAULT'].includes(item.outcome)) throw new Error('Sessão salva inválida.');
  if (typeof item.startedAt !== 'string' || !Number.isFinite(Date.parse(item.startedAt))) throw new Error('Data de sessão inválida.');
  return { mode: 'SIMULATED', outcome: item.outcome, startedAt: item.startedAt, lengthM: finite(item.lengthM, 0, 1e9, 'Comprimento salvo'), massKg: finite(item.massKg, 0, 1e9, 'Massa salva'), elapsedS: finite(item.elapsedS, 0, 1e12, 'Tempo salvo'), config: validateConfig(item.config) };
}

try {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const saved = JSON.parse(raw);
    if (saved.schemaVersion !== SCHEMA_VERSION || saved.mode !== 'SIMULATED' || !Array.isArray(saved.sessions) || saved.sessions.length > 100) throw new Error('Formato de armazenamento incompatível.');
    const checkedConfig = validateConfig(saved.config);
    const checkedSessions = saved.sessions.map(validateSession);
    persistedConfig = checkedConfig;
    sessions = checkedSessions;
  }
} catch (error) {
  announce(`Dados locais não puderam ser carregados. Usando configuração padrão. ${error.message}`, true);
}

const simulator = new RewinderSimulator(persistedConfig ?? {});

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: SCHEMA_VERSION, mode: 'SIMULATED', config: simulator.snapshot().config, sessions }));
  } catch {
    announce('O navegador não permitiu salvar os dados locais. Exporte o JSON para preservar esta sessão.', true);
  }
}

function elapsed(seconds) {
  const whole = Math.floor(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor(whole % 3600 / 60);
  const rest = whole % 60;
  return `${hours ? `${hours}:` : ''}${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function fillConfig() {
  const { config } = simulator.snapshot();
  $('material').value = config.material;
  $('density').value = config.densityKgM3;
  $('diameter').value = config.diameterM * 1000;
  $('target-mode').value = config.targetMode;
  $('target').value = config.targetMode === 'mass' ? config.targetMassKg * 1000 : config.targetLengthM;
  $('speed').value = config.speedMps * 1000;
  $('wheel').value = config.wheelDiameterM * 1000;
  $('counts').value = config.countsPerRevolution;
  updateEstimate();
}

function formConfig() {
  const base = simulator.snapshot().config;
  const mode = $('target-mode').value;
  const target = finite($('target').value, 0.01, mode === 'mass' ? 100000 : 100000, 'Meta');
  return validateConfig({ ...base, material: $('material').value, densityKgM3: finite($('density').value, 500, 3000, 'Densidade'), diameterM: finite($('diameter').value, 0.5, 4, 'Diâmetro') / 1000, targetMode: mode, targetLengthM: mode === 'length' ? target : base.targetLengthM, targetMassKg: mode === 'mass' ? target / 1000 : base.targetMassKg, speedMps: finite($('speed').value, 1, 500, 'Velocidade') / 1000 });
}

function updateEstimate() {
  const mode = $('target-mode').value;
  $('target-unit').textContent = mode === 'mass' ? 'g' : 'm';
  $('estimate-label').textContent = mode === 'mass' ? 'Comprimento equivalente da meta' : 'Massa estimada da meta';
  try {
    const config = formConfig();
    $('estimate-value').textContent = mode === 'mass' ? `${number(lengthM(config.targetMassKg, config.diameterM, config.densityKgM3))} m` : `${number(massKg(config.targetLengthM, config.diameterM, config.densityKgM3) * 1000)} g`;
  } catch {
    $('estimate-value').textContent = 'Confira os valores';
  }
}

function renderHistory() {
  const body = $('history-body');
  body.replaceChildren();
  if (!sessions.length) {
    const row = body.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 6;
    cell.className = 'empty-state';
    cell.textContent = 'Seu próximo experimento começa aqui. Inicie uma simulação para registrar uma sessão.';
    return;
  }
  for (const item of [...sessions].reverse()) {
    const row = body.insertRow();
    for (const value of [new Date(item.startedAt).toLocaleString('pt-BR'), stateLabels[item.outcome], `${number(item.lengthM)} m`, `${number(item.massKg * 1000)} g`, elapsed(item.elapsedS), 'SIMULATED']) row.insertCell().textContent = value;
  }
}

function recordSession(snapshot) {
  if (sessionRecorded || !['COMPLETED', 'STOPPED', 'FAULT'].includes(snapshot.state)) return;
  sessions.push({ mode: 'SIMULATED', outcome: snapshot.state, startedAt: sessionStartedAt, lengthM: snapshot.lengthM, massKg: snapshot.massKg, elapsedS: snapshot.elapsedS, config: snapshot.config });
  sessions = sessions.slice(-100);
  sessionRecorded = true;
  persist();
  renderHistory();
  announce(snapshot.state === 'COMPLETED' ? 'Meta simulada atingida. Sessão registrada no histórico local.' : 'Sessão encerrada e registrada no histórico local.');
}

function render() {
  const s = simulator.snapshot();
  const active = ['RUNNING', 'PAUSED'].includes(s.state);
  const locked = active || s.state === 'FAULT';
  $('length-value').textContent = number(s.lengthM);
  $('mass-value').textContent = number(s.massKg * 1000);
  $('speed-value').textContent = number(s.speedMps * 1000, 0);
  $('time-value').textContent = elapsed(s.elapsedS);
  $('speed-caption').textContent = `Desejada: ${number(s.config.speedMps * 1000, 0)} mm/s`;
  $('target-caption').textContent = `Meta de ${number(s.targetLengthM)} m${s.config.targetMode === 'mass' ? ` / ${number(s.config.targetMassKg * 1000)} g estimados` : ''}`;
  $('progress').value = s.progressPercent;
  $('progress-label').textContent = `${number(s.progressPercent, 1)}% concluído`;
  $('remaining-label').textContent = `${number(Math.max(0, s.targetLengthM - s.lengthM))} m restantes`;
  $('state-badge').textContent = stateLabels[s.state] ?? s.state;
  $('state-badge').classList.toggle('fault', s.state === 'FAULT');
  document.querySelector('.process-panel').classList.toggle('running', s.state === 'RUNNING');
  $('start').disabled = locked;
  $('start').textContent = ['COMPLETED', 'STOPPED'].includes(s.state) ? '▶ Nova simulação' : '▶ Iniciar simulação';
  $('pause').disabled = !active;
  $('pause').textContent = s.state === 'PAUSED' ? '▶ Retomar' : 'Ⅱ Pausar';
  $('stop').disabled = !active;
  $('config-fields').disabled = locked;
  $('calibration-fields').disabled = locked;
  $('encoder-value').textContent = number(s.encoderCounts, 0);
  $('calibration-value').textContent = number(s.config.calibrationFactor, 6);
  $('resolution-value').textContent = `${number(metresPerCount(s.config.wheelDiameterM, s.config.countsPerRevolution, s.config.calibrationFactor) * 1000, 4)} mm/count`;
  $('fault-message').hidden = s.state !== 'FAULT';
  if (s.state === 'FAULT') $('fault-message').textContent = `Falha simulada: ${faultLabels[s.fault] ?? (typeof s.fault === 'string' ? s.fault : JSON.stringify(s.fault))}. Reconhecimento manual necessário.`;
  $('reset-fault').hidden = s.state !== 'FAULT';
  $('inject-fault').disabled = s.state === 'FAULT';
  const sensors = [ ['Filamento', s.sensors.filamentPresent ? 'Presente' : 'Ausente', !s.sensors.filamentPresent], ['Movimento', s.sensors.movementDetected ? 'Detectado' : 'Sem movimento', false], ['Fim de curso esquerdo', s.sensors.leftLimit ? 'Acionado' : 'Livre', s.sensors.leftLimit], ['Fim de curso direito', s.sensors.rightLimit ? 'Acionado' : 'Livre', s.sensors.rightLimit] ];
  $('sensor-list').replaceChildren(...sensors.map(([label, value, warning]) => { const node = document.createElement('div'); node.className = 'sensor'; const name = document.createElement('span'); name.textContent = label; const status = document.createElement('b'); status.textContent = `● ${value}`; status.classList.toggle('warning', Boolean(warning)); node.append(name, status); return node; }));
  recordSession(s);
}

function action(callback, message) {
  try { callback(); render(); if (message) announce(message); } catch (error) { announce(error.message, true); }
}

$('config-form').addEventListener('submit', (event) => {
  event.preventDefault();
  action(() => { simulator.configure(formConfig()); persist(); }, 'Configuração aplicada ao simulador.');
});
$('config-form').addEventListener('input', updateEstimate);
$('material').addEventListener('change', () => {
  const material = MATERIALS[$('material').value];
  if (material) $('density').value = material.densityKgM3;
  updateEstimate();
});
$('density').addEventListener('input', () => { $('material').value = 'CUSTOM'; });
$('start').addEventListener('click', () => action(() => {
  if (!$('config-form').reportValidity()) throw new Error('Confira os parâmetros antes de iniciar.');
  simulator.configure(formConfig());
  simulator.start();
  sessionStartedAt = new Date().toISOString();
  sessionRecorded = false;
  persist();
  lastFrame = performance.now();
}, 'Simulação iniciada. Os números abaixo são virtuais.'));
$('pause').addEventListener('click', () => action(() => { if (simulator.snapshot().state === 'PAUSED') simulator.resume(); else simulator.pause(); }, 'Estado da simulação atualizado.'));
$('stop').addEventListener('click', () => action(() => simulator.stop()));
$('inject-fault').addEventListener('click', () => action(() => simulator.injectFault($('fault-code').value), 'Falha virtual injetada. Limpe a falha manualmente antes de uma nova sessão.'));
$('reset-fault').addEventListener('click', () => action(() => { simulator.resetFault(); lastFrame = performance.now(); }, 'Falha reconhecida. Simulador pronto; nenhuma sessão foi reiniciada.'));
$('calibration-form').addEventListener('submit', (event) => {
  event.preventDefault();
  action(() => {
    const wheelDiameterM = finite($('wheel').value, 5, 200, 'Roda') / 1000;
    const countsPerRevolution = finite($('counts').value, 1, 1000000, 'Contagens');
    const reference = finite($('reference-length').value, 0.001, 100000, 'Referência');
    const observed = finite($('observed-counts').value, 1, 1e12, 'Contagens observadas');
    if (!Number.isSafeInteger(countsPerRevolution) || !Number.isSafeInteger(observed)) throw new Error('Contagens devem ser inteiras.');
    const factor = calibrationFactor(reference, observed, wheelDiameterM, countsPerRevolution);
    if (factor < 0.5 || factor > 2) throw new Error('Fator fora do intervalo demonstrativo de 0,5 a 2. Confira referência, roda e contagens.');
    simulator.configure({ wheelDiameterM, countsPerRevolution, calibrationFactor: factor });
    persist();
  }, 'Calibração calculada e salva localmente. Precisão física não verificada.');
});
$('download').addEventListener('click', () => {
  const payload = { schemaVersion: SCHEMA_VERSION, mode: 'SIMULATED', exportedAt: new Date().toISOString(), evidence: { length: 'SIMULATED', mass: 'CALCULATED_NOT_MEASURED', physicalSafety: 'NOT_VERIFIED' }, config: simulator.snapshot().config, sessions };
  const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = `gaia-rewinder-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  announce('Arquivo JSON exportado com configuração, calibração e histórico simulado.');
});

// A bounded real-time increment keeps background tabs from advancing a hidden session.
function frame(now) {
  const dt = Math.min(Math.max((now - lastFrame) / 1000, 0), 0.25);
  lastFrame = now;
  try { simulator.tick(dt); if (now - lastRender >= 100) { render(); lastRender = now; } } catch (error) { announce(`A simulação foi interrompida: ${error.message}`, true); return; }
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { lastFrame = performance.now(); });
fillConfig();
renderHistory();
render();
requestAnimationFrame(frame);

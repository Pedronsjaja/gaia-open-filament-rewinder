import { MATERIALS, massKg, lengthM, metresPerCount, calibrationFactor } from './math.mjs';

export const DEFAULT_CONFIG = Object.freeze({ material: 'PLA', densityKgM3: 1240, diameterM: 0.00175,
  targetMode: 'length', targetLengthM: 10, targetMassKg: 0.025, speedMps: 0.1, accelerationMps2: 0.1,
  wheelDiameterM: 0.03, countsPerRevolution: 600, calibrationFactor: 1 });
const faults = new Set(['FILAMENT_ABSENT', 'NO_MOVEMENT', 'LEFT_LIMIT', 'RIGHT_LIMIT', 'LIMIT_CONFLICT', 'E_STOP', 'EMERGENCY_STOP', 'JAM', 'SENSOR_DISCONNECTED']);
const active = new Set(['RUNNING', 'PAUSED']);
const clone = value => structuredClone(value);

export function validateConfig(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new TypeError('Configuration must be an object.');
  for (const key of Object.keys(config)) if (!Object.hasOwn(DEFAULT_CONFIG, key)) throw new RangeError(`Unknown configuration field: ${key}`);
  const result = { ...DEFAULT_CONFIG, ...config };
  if (typeof result.material !== 'string' || (!Object.hasOwn(MATERIALS, result.material) && result.material !== 'CUSTOM')) throw new RangeError('Unknown material.');
  if (!['length', 'mass'].includes(result.targetMode)) throw new RangeError('Unknown target mode.');
  const ranges = { densityKgM3: [500, 3000], diameterM: [0.0005, 0.004], targetLengthM: [0.001, 100000], targetMassKg: [0.000001, 100],
    speedMps: [0.001, 0.5], accelerationMps2: [0.001, 1], wheelDiameterM: [0.005, 0.2], countsPerRevolution: [1, 1_000_000], calibrationFactor: [0.5, 2] };
  for (const [key, [min, max]] of Object.entries(ranges))
    if (typeof result[key] !== 'number' || !Number.isFinite(result[key]) || result[key] < min || result[key] > max) throw new RangeError(`${key} outside demonstration bounds [${min}, ${max}].`);
  if (!Number.isSafeInteger(result.countsPerRevolution)) throw new RangeError('Decoded counts/revolution must be an integer.');
  return result;
}

export class RewinderSimulator {
  constructor(config = {}) {
    this.config = validateConfig(config); this.state = 'IDLE'; this.history = [];
    this._resetCounters(); this.fault = null; this.sensors = this._healthySensors();
  }
  _healthySensors() { return { filamentPresent: true, movementDetected: false, leftLimit: false, rightLimit: false }; }
  _resetCounters() { this.encoderCounts = 0; this._fractionalCounts = 0; this.speedMps = 0; this.elapsedS = 0; }
  configure(patch) {
    if (active.has(this.state) || this.state === 'FAULT') throw new Error('Stop/reset before configuring.');
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) throw new TypeError('Configuration patch must be an object.');
    this.config = validateConfig({ ...this.config, ...patch }); this._resetCounters(); this.state = 'IDLE';
    return this.snapshot();
  }
  calibrate(referenceLengthM, observedCounts) {
    const factor = calibrationFactor(referenceLengthM, observedCounts, this.config.wheelDiameterM, this.config.countsPerRevolution);
    this.configure({ calibrationFactor: factor }); return factor;
  }
  start() {
    if (!['IDLE', 'COMPLETED', 'STOPPED'].includes(this.state)) throw new Error('Start requires an idle/stopped/completed simulator.');
    this._resetCounters(); this.fault = null; this.sensors = this._healthySensors(); this.state = 'RUNNING'; return this.snapshot();
  }
  pause() {
    if (this.state !== 'RUNNING') throw new Error('Pause requires RUNNING.');
    this.state = 'PAUSED'; this.speedMps = 0; this.sensors.movementDetected = false; return this.snapshot();
  }
  resume() {
    if (this.state !== 'PAUSED' || this.fault) throw new Error('Resume requires a paused simulator without a fault.');
    this.state = 'RUNNING'; return this.snapshot();
  }
  stop() {
    if (this.state === 'FAULT') return this.snapshot();
    const record = active.has(this.state); this.state = 'STOPPED'; this.speedMps = 0; this.sensors.movementDetected = false;
    if (record) this._record('STOPPED'); return this.snapshot();
  }
  injectFault(code) {
    if (!faults.has(code)) throw new RangeError('Unknown simulated fault code.');
    if (this.state === 'FAULT') return this.snapshot(); // Preserve the first latched reason and its recorded evidence.
    const record = active.has(this.state); this.fault = code; this.state = 'FAULT'; this.speedMps = 0;
    this.sensors.movementDetected = false;
    if (code === 'FILAMENT_ABSENT') this.sensors.filamentPresent = false;
    if (code === 'LEFT_LIMIT') this.sensors.leftLimit = true;
    if (code === 'RIGHT_LIMIT') this.sensors.rightLimit = true;
    if (code === 'LIMIT_CONFLICT') { this.sensors.leftLimit = true; this.sensors.rightLimit = true; }
    if (record) this._record('FAULT'); return this.snapshot();
  }
  resetFault() {
    if (this.state !== 'FAULT') throw new Error('No latched fault to reset.');
    this.fault = null; this.sensors = this._healthySensors(); this._resetCounters(); this.state = 'IDLE'; return this.snapshot();
  }
  tick(dtSeconds) {
    if (typeof dtSeconds !== 'number' || !Number.isFinite(dtSeconds) || dtSeconds < 0 || dtSeconds > 1) throw new RangeError('Simulation time step must be 0..1 s.');
    if (this.state !== 'RUNNING' || dtSeconds === 0) return this.snapshot();
    const c = this.config, step = metresPerCount(c.wheelDiameterM, c.countsPerRevolution, c.calibrationFactor);
    const before = this.speedMps, after = Math.min(c.speedMps, before + c.accelerationMps2 * dtSeconds);
    // Integrate ramp exactly, including the portion after the setpoint is reached.
    const rampTime = Math.min(dtSeconds, (c.speedMps - before) / c.accelerationMps2);
    const distance = before * rampTime + 0.5 * c.accelerationMps2 * rampTime ** 2 + c.speedMps * (dtSeconds - rampTime);
    const target = this._targetLength();
    const targetCounts = Math.ceil(target / step);
    const available = this._fractionalCounts + distance / step;
    const counts = Math.floor(available);
    this._fractionalCounts = available - counts;
    this.encoderCounts = Math.min(targetCounts, this.encoderCounts + counts);
    this.speedMps = after; this.elapsedS += dtSeconds; this.sensors.movementDetected = counts > 0;
    if (this.encoderCounts >= targetCounts) {
      this.state = 'COMPLETED'; this.speedMps = 0; this.sensors.movementDetected = false; this._record('COMPLETED');
    }
    return this.snapshot();
  }
  _targetLength() { return this.config.targetMode === 'mass' ? lengthM(this.config.targetMassKg, this.config.diameterM, this.config.densityKgM3) : this.config.targetLengthM; }
  snapshot() {
    const c = this.config, measuredLength = this.encoderCounts * metresPerCount(c.wheelDiameterM, c.countsPerRevolution, c.calibrationFactor), target = this._targetLength();
    return { schemaVersion: '1.0', mode: 'SIMULATED', state: this.state, config: clone(c), lengthM: measuredLength,
      massKg: massKg(measuredLength, c.diameterM, c.densityKgM3), targetLengthM: target, progressPercent: Math.min(100, measuredLength / target * 100),
      speedMps: this.speedMps, elapsedS: this.elapsedS, encoderCounts: this.encoderCounts, fault: this.fault,
      alerts: ['SIMULATED — no physical machine connected', 'Mass is CALCULATED from assumed density and diameter; not weighed', ...(this.fault ? [this.fault] : [])], sensors: clone(this.sensors) };
  }
  _record(outcome) {
    const s = this.snapshot();
    this.history.unshift({ id: crypto.randomUUID(), timestamp: new Date().toISOString(), mode: 'SIMULATED', outcome,
      lengthM: s.lengthM, massKg: s.massKg, elapsedS: s.elapsedS, encoderCounts: s.encoderCounts, config: clone(this.config), fault: this.fault });
    this.history = this.history.slice(0, 100);
  }
}

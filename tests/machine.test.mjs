import test from 'node:test';
import assert from 'node:assert/strict';
import { RewinderSimulator, validateConfig } from '../software/simulator/machine.mjs';
import { metresPerCount, massKg } from '../software/simulator/math.mjs';

test('does not move without explicit start, pauses without losing counts, resumes ramp', () => {
  const machine = new RewinderSimulator(); machine.tick(1); assert.equal(machine.snapshot().encoderCounts, 0);
  machine.start(); machine.tick(.5); const before = machine.snapshot(); assert.ok(before.lengthM > 0);
  machine.pause(); machine.tick(1); assert.equal(machine.snapshot().lengthM, before.lengthM);
  assert.equal(machine.snapshot().speedMps, 0); machine.resume(); machine.tick(.5); assert.ok(machine.snapshot().lengthM > before.lengthM);
});
test('length target completes at an ideal encoder boundary, with a single history record', () => {
  const machine = new RewinderSimulator({ targetLengthM: .123, speedMps: .1 }); machine.start();
  for (let i = 0; i < 200; i++) machine.tick(.1);
  const s = machine.snapshot(), quantum = metresPerCount(.03, 600);
  assert.equal(s.state, 'COMPLETED'); assert.equal(s.speedMps, 0); assert.equal(s.progressPercent, 100);
  assert.ok(s.lengthM >= .123 && s.lengthM - .123 < quantum); assert.equal(machine.history.length, 1);
  assert.equal(machine.history[0].mode, 'SIMULATED');
});
test('mass target uses calculated length, not a fictitious scale measurement', () => {
  const machine = new RewinderSimulator({ targetMode: 'mass', targetMassKg: .001 }); machine.start();
  for (let i = 0; i < 200; i++) machine.tick(.1);
  const s = machine.snapshot(); assert.equal(s.state, 'COMPLETED'); assert.ok(s.massKg >= .001);
  assert.equal(s.massKg, massKg(s.lengthM, s.config.diameterM, s.config.densityKgM3));
  assert.ok(s.alerts.some(a => a.includes('not weighed')));
});
test('ramp integration includes constant-speed remainder after crossing setpoint', () => {
  const machine = new RewinderSimulator({ speedMps: .05, accelerationMps2: .1 }); machine.start(); machine.tick(1);
  const ideal = .5 * .1 * .5 ** 2 + .05 * .5;
  assert.ok(Math.abs(machine.snapshot().lengthM - ideal) < metresPerCount(.03, 600));
});
for (const code of ['FILAMENT_ABSENT', 'NO_MOVEMENT', 'LIMIT_CONFLICT', 'EMERGENCY_STOP', 'JAM', 'SENSOR_DISCONNECTED']) {
  test(`latched ${code} stops motion; stop/restart/resume cannot clear it`, () => {
    const machine = new RewinderSimulator(); machine.start(); machine.tick(.5); machine.injectFault(code);
    const before = machine.snapshot(); machine.tick(1); machine.stop();
    assert.equal(machine.snapshot().state, 'FAULT'); assert.equal(machine.snapshot().lengthM, before.lengthM);
    assert.throws(() => machine.start()); assert.throws(() => machine.resume()); assert.equal(machine.history.length, 1);
    machine.resetFault(); assert.equal(machine.snapshot().state, 'IDLE'); machine.tick(1); assert.equal(machine.snapshot().speedMps, 0);
  });
}
test('configuration/calibration changes are rejected while moving/paused/faulted', () => {
  const machine = new RewinderSimulator(); machine.start(); assert.throws(() => machine.configure({ speedMps: .2 }));
  machine.pause(); assert.throws(() => machine.calibrate(1, 1000)); machine.stop(); machine.calibrate(1.575, 10000);
  assert.ok(machine.snapshot().config.calibrationFactor > 1); assert.equal(machine.snapshot().state, 'IDLE');
});
test('invalid restored configuration, unknown schema fields and nonfinite time cannot run', () => {
  for (const patch of [{ speedMps: Infinity }, { densityKgM3: 0 }, { countsPerRevolution: .5 }, { targetLengthM: 0 }, { material: 'toString' }, { constructor: 'x' }]) assert.throws(() => validateConfig(patch));
  const machine = new RewinderSimulator(); assert.throws(() => machine.tick(NaN)); assert.throws(() => machine.tick(1.1));
  const s = machine.snapshot(); s.config.speedMps = 999; assert.notEqual(machine.snapshot().config.speedMps, 999);
});
test('stop is idempotent and a new operation does not resume an old count', () => {
  const machine = new RewinderSimulator(); machine.start(); machine.tick(1); machine.stop(); machine.stop();
  assert.equal(machine.history.length, 1); machine.start(); assert.equal(machine.snapshot().encoderCounts, 0);
});
test('malformed config patches cannot reset a recorded operation or coerce enums', () => {
  const machine = new RewinderSimulator(); machine.start(); machine.tick(1); machine.stop(); const before = machine.snapshot();
  for (const patch of [null, [], 42, 'PLA']) { assert.throws(() => machine.configure(patch)); assert.deepEqual(machine.snapshot(), before); }
  for (const material of [['PLA'], new String('PLA'), 1, null]) assert.throws(() => new RewinderSimulator({ material }));
});
test('a second injected fault cannot overwrite the latched cause or recorded history', () => {
  const machine = new RewinderSimulator(); machine.start(); machine.tick(.1); machine.injectFault('FILAMENT_ABSENT'); machine.injectFault('RIGHT_LIMIT');
  assert.equal(machine.snapshot().fault, 'FILAMENT_ABSENT'); assert.equal(machine.history[0].fault, machine.snapshot().fault); assert.equal(machine.history.length, 1);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { massKg, lengthM, metresPerCount, calibrationFactor, relativeMassUncertainty, windingRequirements, supplyCurrentA } from '../software/simulator/math.mjs';
const close = (a, b, tolerance = 1e-10) => assert.ok(Math.abs(a - b) <= tolerance, `${a} vs ${b}`);

test('SI example: ten metres of nominal 1.75 mm PLA is estimated 29.8255 g', () => close(massKg(10, .00175, 1240) * 1000, 29.82549526, 1e-8));
test('length/mass inverse across diameter/material inputs', () => {
  for (const d of [.00175, .00285]) for (const rho of [1040, 1240, 1270]) for (const l of [0, .001, 10, 1000]) close(lengthM(massKg(l, d, rho), d, rho), l);
});
test('squared diameter sensitivity is retained', () => close(massKg(1, .002, 1240) / massKg(1, .001, 1240), 4));
test('600 decoded counts per 30 mm wheel revolution', () => close(metresPerCount(.03, 600), Math.PI * .03 / 600));
test('reference calibration reproduces known length and replaces previous factor', () => {
  const factor = calibrationFactor(1.575, 10000, .03, 600);
  close(metresPerCount(.03, 600, factor) * 10000, 1.575);
});
test('invalid geometry/count/reference inputs never silently become measurements', () => {
  for (const value of [NaN, Infinity, -1, 0, '1']) {
    assert.throws(() => metresPerCount(value, 600)); assert.throws(() => massKg(1, .00175, value));
    assert.throws(() => calibrationFactor(1, value, .03, 600));
  }
  assert.throws(() => metresPerCount(.03, 1.5)); assert.throws(() => massKg(-1, .00175, 1240));
});
test('uncorrelated first-order mass uncertainty includes doubled diameter coefficient', () => close(relativeMassUncertainty(.01, .03 / 1.75, .02), Math.sqrt(.01 ** 2 + (2 * .03 / 1.75) ** 2 + .02 ** 2)));
test('increasing winding radius raises tension torque and reduces RPM at fixed line speed', () => {
  const small = windingRequirements({ tensionN: 1, radiusM: .03, speedMps: .1 });
  const large = windingRequirements({ tensionN: 1, radiusM: .06, speedMps: .1 });
  close(large.receiverTorqueNm, 2 * small.receiverTorqueNm); close(large.rpm, small.rpm / 2);
  close(large.mechanicalPowerW, small.mechanicalPowerW);
});
test('supply pre-sizing includes stall demand and auxiliaries, not steady torque alone', () => {
  close(supplyCurrentA(5.5, .5, 1.25), 7.5); assert.throws(() => supplyCurrentA(5.5, .5, .8));
  assert.throws(() => windingRequirements({ tensionN: 1, radiusM: .03, speedMps: .1, efficiency: 1.2 }));
});

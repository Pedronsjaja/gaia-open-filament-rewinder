// SI throughout. Material presets are illustrative assumptions, never measurements of a user's spool.
export const MATERIALS = Object.freeze({
  PLA: Object.freeze({ label: 'PLA', densityKgM3: 1240, evidence: 'ASSUMED — illustrative preset; replace with product TDS or measurement' }),
  PETG: Object.freeze({ label: 'PETG', densityKgM3: 1270, evidence: 'ASSUMED — illustrative preset; formulations vary' }),
  ABS: Object.freeze({ label: 'ABS', densityKgM3: 1040, evidence: 'ASSUMED — illustrative preset; formulations vary' }),
});

function finite(value, name, zero = false) {
  if (typeof value !== 'number' || !Number.isFinite(value) || (zero ? value < 0 : value <= 0))
    throw new RangeError(`${name} must be a finite ${zero ? 'nonnegative' : 'positive'} number.`);
  return value;
}

export function massKg(lengthM, diameterM, densityKgM3) {
  return finite(lengthM, 'lengthM', true) * Math.PI * finite(diameterM, 'diameterM') ** 2 / 4 * finite(densityKgM3, 'densityKgM3');
}
export function lengthM(mass, diameterM, densityKgM3) {
  return finite(mass, 'massKg', true) / massKg(1, diameterM, densityKgM3);
}
export function metresPerCount(wheelDiameterM, countsPerRevolution, factor = 1) {
  finite(countsPerRevolution, 'countsPerRevolution');
  if (!Number.isSafeInteger(countsPerRevolution)) throw new RangeError('Decoded counts per revolution must be a safe integer.');
  return Math.PI * finite(wheelDiameterM, 'wheelDiameterM') / countsPerRevolution * finite(factor, 'calibrationFactor');
}
export function calibrationFactor(referenceLengthM, observedCounts, wheelDiameterM, countsPerRevolution) {
  finite(observedCounts, 'observedCounts');
  if (!Number.isSafeInteger(observedCounts)) throw new RangeError('Calibration counts must be an integer.');
  return finite(referenceLengthM, 'referenceLengthM') / (observedCounts * metresPerCount(wheelDiameterM, countsPerRevolution));
}
export function relativeMassUncertainty(lengthRelative, diameterRelative, densityRelative) {
  // First-order standard uncertainty, uncorrelated inputs. Not a guaranteed error bound.
  return Math.hypot(finite(lengthRelative, 'uL/L', true), 2 * finite(diameterRelative, 'ud/d', true), finite(densityRelative, 'uRho/rho', true));
}
export function windingRequirements({ tensionN, radiusM, speedMps, accelerationMps2 = 0, inertiaKgM2 = 0, frictionNm = 0, efficiency = 1, serviceFactor = 1 }) {
  finite(tensionN, 'tensionN', true); finite(radiusM, 'radiusM'); finite(speedMps, 'speedMps', true);
  finite(accelerationMps2, 'accelerationMps2', true); finite(inertiaKgM2, 'inertiaKgM2', true); finite(frictionNm, 'frictionNm', true);
  finite(efficiency, 'efficiency'); finite(serviceFactor, 'serviceFactor');
  if (efficiency > 1 || serviceFactor < 1) throw new RangeError('Efficiency must be <=1 and service factor >=1.');
  const omegaRadS = speedMps / radiusM, alphaRadS2 = accelerationMps2 / radiusM;
  const receiverTorqueNm = tensionN * radiusM + inertiaKgM2 * alphaRadS2 + frictionNm;
  return { omegaRadS, rpm: omegaRadS * 60 / (2 * Math.PI), alphaRadS2, receiverTorqueNm,
    requiredDriveTorqueNm: receiverTorqueNm * serviceFactor / efficiency,
    mechanicalPowerW: receiverTorqueNm * omegaRadS,
    evidence: 'CALCULATED from ASSUMED inputs; slowly varying radius; not motor/thermal validation' };
}
export function supplyCurrentA(motorStallCurrentA, auxiliariesCurrentA, reserveFactor = 1.25) {
  finite(motorStallCurrentA, 'motorStallCurrentA'); finite(auxiliariesCurrentA, 'auxiliariesCurrentA', true); finite(reserveFactor, 'reserveFactor');
  if (reserveFactor < 1) throw new RangeError('Reserve factor must be >=1.');
  return (motorStallCurrentA + auxiliariesCurrentA) * reserveFactor;
}

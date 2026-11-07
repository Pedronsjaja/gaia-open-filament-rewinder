import { massKg, lengthM, metresPerCount, calibrationFactor, relativeMassUncertainty, windingRequirements, supplyCurrentA } from '../software/simulator/math.mjs';

const output = {
  evidence: 'CALCULATED using explicitly ASSUMED inputs; no physical measurements',
  material: { densityKgM3: 1240, diameterM: .00175, lengthM: 10, densityEvidence: 'ASSUMED illustrative PLA, not a specific brand TDS' },
  estimatedMassG: 1000 * massKg(10, .00175, 1240),
  lengthFor100gM: lengthM(.1, .00175, 1240),
  encoder: { wheelDiameterM: .03, decodedCountsPerRevolution: 600, metresPerCount: metresPerCount(.03, 600),
    observedCounts: 10000, referenceLengthM: 1.575, calibratedFactor: calibrationFactor(1.575, 10000, .03, 600) },
  uncertainty: { assumption: 'Uncorrelated standard relative uL=.01, ud=.03/1.75, uRho=.02; diameter standard u=0.03mm, not a tolerance bound',
    relativeStandard: relativeMassUncertainty(.01, .03 / 1.75, .02) },
  windingAt30mmRadius: windingRequirements({ tensionN: 1, radiusM: .03, speedMps: .1, accelerationMps2: .05, inertiaKgM2: .001, frictionNm: .01, efficiency: .7, serviceFactor: 2 }),
  windingAt60mmRadius: windingRequirements({ tensionN: 1, radiusM: .06, speedMps: .1, accelerationMps2: .05, inertiaKgM2: .001, frictionNm: .01, efficiency: .7, serviceFactor: 2 }),
  supply: { exampleMotorStallA: 5.5, assumedAuxiliariesA: .5, assumedReserveFactor: 1.25, preliminaryCurrentA: supplyCurrentA(5.5, .5, 1.25),
    warning: 'Pre-sizing example only. Validate driver current limit, stall/inrush, fuse/wire coordination, supply transient/thermal behavior and safe interlocks. Not a procurement or fuse rating.' },
};
console.log(JSON.stringify(output, null, 2));

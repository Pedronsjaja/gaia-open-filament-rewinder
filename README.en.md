# GAIA Open Filament Rewinder

An original virtual educational filament rewinder proposal for GAIA Robótica — UFTM, motivated by a need attributed to Verboera 3D in the request. No partnership, endorsement, manufacture or physical validation is asserted. [Português](README.md).

Transfers existing manufactured filament between spools: **not an extruder, recycler or filament manufacturing line**. Node24+ runs the offline browser demo with no npm dependencies or hardware:

```sh
npm start
# http://127.0.0.1:4173/software/web/
npm test
npm run examples
npm run build
```

Lite is a proposed MCU-independent DC gearmotor/PWM machine with manual traverse/passive tension and an external scale. Smart adds an independent measuring-wheel encoder, ESP32 and proposed powered traverse. The responsive pt-BR demo implements material/configuration, length or estimated-mass targets, acceleration, start/pause/stop, fault injection, calibration and local history. All data are labelled SIMULATED; mass is calculated from assumed diameter/density, never weighed. Reload never resumes motion.

Initial ESP32 firmware cross-compiles and has host-tested state/metrology/command logic, PWM, quadrature counting, local interlocks, target/no-motion faults, NVS and a serial protocol. **Motor actuation defaults OFF**, HTTP/WebSocket are future only, and powered traverse remains unimplemented. Do not enable validation flags without real reviewed evidence.

Original parametric OpenSCAD Lite/Smart studies, CSG, a generated base STL and eleven SVGs are conceptual, not fabrication-ready. XLSX/CSV BOM has35 items and no invented prices/stock: initial quotation coverage is0%, totals UNKNOWN. No STEP export, physical winding, safety certification or commercial readiness is claimed.

[User guide](docs/pt-BR/guia-completo.md) · [Safety](docs/pt-BR/seguranca.md) · [Engineering](docs/en/engineering.md) · [Architecture/protocol](docs/en/architecture.md) · [Comparative research](docs/en/research.md) · [Validation](docs/en/validation.md) · [Hardware](hardware/README.md) · [Firmware](firmware/README.md) · [BOM](bom/README.md).

Pedro explicitly approved public GitHub creation/push/Pages on2026-11-07. [Repository](https://github.com/Pedronsjaja/gaia-open-filament-rewinder), [web demo address](https://pedronsjaja.github.io/gaia-open-filament-rewinder/) and [CI/manual deployment status](https://github.com/Pedronsjaja/gaia-open-filament-rewinder/actions). Local builds do not deploy automatically. MIT covers original source; reference projects retain their own licenses. Browser buttons are not emergency stops. Manufacturing, wiring, current limits, guarding, stop distances, calibration accuracy and actual Android/iPhone hardware remain unvalidated.

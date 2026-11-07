# Validation and phase handoff — 2026-11-07

This is a local review candidate. No public repository, public push, Pages deployment, hardware build, upload to ESP32, physical calibration, purchase or commercial verification was performed. Windows local software evidence is distinct from proposed CI and physical validation.

| Phase | Created deliverables | Executed evidence | Limits / next gate |
|---|---|---|---|
| 1 research/architecture | docs/en/research.md, architecture.md, engineering.md, software-contract.md; README pt/en | Author repository/readme/API and primary technical sources inspected; scoped license/status comparison | No imported reference code/CAD, no priority/partnership claim; requirements need hardware acceptance criteria |
| 2 BOM/mechanics | bom/bom.csv, gaia-rewinder-bom.xlsx, validation.json; hardware/cad/rewinder.scad, Lite/Smart CSG, base STL/validation; eleven original SVGs | Both workbook tabs rendered/inspected, 12 formula-input checks; OpenSCAD2021.01 generated outputs; independent STL mesh checks | Quotes0%, totals UNKNOWN; no STEP, verified fit/stiffness or reviewed electrical schematic; native Excel NOT_VERIFIED |
| 3 demonstrator | software/web/, software/simulator/, tests/, tools/, examples/ |25 Node tests passed locally; browser checks start, pause, goal completion/history, injected fault/reset, calibration, reload without restart and390px viewport; static build passed | Browser simulation only. Actual Android/iPhone devices NOT_TESTED. No inertia/coast/slip model or real device connection |
| 4 firmware | firmware/platformio.ini, lib/RewinderCore/, src/main.cpp, test/, README | Portable C++ suite passed, real ESP32 cross-build passed | No upload, physical I/O timing, NVS power-loss, motor control, powered traverse or HTTP/WS validation; default actuation OFF |
| 5 docs/publication | Portuguese beginner/safety guides, English engineering/architecture/research, contribution/license/changelog, issue form, CI/manual Pages workflows | Markdown local links checked, JS syntax/tests, static site build; local Git review candidate | Remote CI NOT_RUN; repository/Pages publication requires explicit authorization; no public URL claimed |

## Reproduction

```sh
node --version
npm test
npm run examples
npm run build
python firmware/test/run_host_tests.py --compiler /path/to/g++
pio run -d firmware -e esp32dev
```

Local versions: Node24.19.0, PlatformIO6.1.18 isolated Python environment, Espressif32 platform6.9.0, Arduino-ESP32 2.0.17, Xtensa8.4.0 toolchain, host MinGW g++5.1.0. ESP32 default gated image reported RAM22288 bytes and flash314061 bytes after final parser/start fixes; these are compiler size reports, not measured peak heap/stack or timing. One host executable performs103 assertion evaluations, not103 separately discovered tests. Rebuilding with another compiler can change binary sizes.

`python tools/verify-repository.py` passed:16 Markdown files with resolved local links,11 well-formed SVGs,35 baseline unquoted BOM rows, valid two-sheet XLSX archive without cached formula error cells, and nonempty CAD/screenshots. Initial no-price baseline is intentional; future verified quoting requires updating the evidence/validation baseline. File checks do not replace formula recalculation or geometry/safety review.

Independent review added regressions for: malformed JS config patches not resetting results, strict string material enums, preserving the first latched fault, rejected firmware start retaining pending encoder counts, and calibration rejecting signed/overflow/nondecimal pulse tokens before narrowing. Command-layer helpers used by the ESP adapter are also used by host tests. Passing these checks does not validate the external circuit, interrupt capacity or stop distance.

Browser evidence: desktop control flow and a390×844 viewport were observed through the supported browser tool. A1m target completed with6367 ideal simulated counts, approximately2.98g estimated mass and zero simulated final speed. A virtual missing-filament fault latched and produced a local history record. Reload returned IDLE without motion. Calibration1.575m/10000counts on30mm/600counts-per-revolution produced1.002676. The mobile document did not overflow its viewport (inner390px, document375px including scrollbar allocation); navigation intentionally scrolls inside its own strip. No actual Android/iOS device was used. Screenshots in images/ are authentic browser demonstrator captures, never prototype photos. A synthetic-DOM smoke script additionally covered10 frontend scenarios; it was development support, not substituted for browser checks or counted as Node's25 tests.

The normal Node server was separately tested over real loopback HTTP: browser assets/module MIME, mutation rejection, private/path-traversal denial and no device-connect policy. UI screenshot checks used a temporary loopback static server; no physical network control was enabled. A shell-based headless-browser launch was automatically rejected; that route was not retried or bypassed. Browser QA used the supported CUA surface instead.

## Geometry and budget evidence

See hardware/cad/validation.md/json: generated base1052 triangles,1578 edges, each edge incidence2, positive signed volume2230861.36mm^3 and620×300×12mm bounds. Manifold checks do not establish printability, tolerances, stability, interferences or a usable complete machine. No STEP file is provided.

See bom/validation.json:35 proposed rows; initial required/included lines Lite21 and Smart31, quotation coverage0%, totals UNKNOWN.12 checks cover missing prices, explicit documented zero, changed input, reversed range, partial coverage, empty selection and a fully quoted disposable scenario including min/max/reserve; temporary inputs were restored before export. No test-only prices became quotations. Artifact-tool formula/render checks passed; native Excel/LibreOffice recalculation was not executed.

## Before physical validation or public release

1. Pedro reviews the exact local files, scope and institutional naming; explicitly authorizes remote account/repository and Pages if desired.
2. Select actual encoder/board/spools/guide and measure geometry; reconcile complete BOM and purchasing quotes.
3. Review mechanical retention/guards and the power/E-stop/current-limit circuit with explicit acceptance criteria.
4. Implement and test traverse, homing, speed/tension feedback where justified, full interlocks, authorized transport and loss-of-link behavior.
5. Conduct supervised low-energy bench validation with raw data, instruments/uncertainty, fault/power-loss/thermal cases and no automatic restart. Do not assert *_VALIDATED flags before evidence.

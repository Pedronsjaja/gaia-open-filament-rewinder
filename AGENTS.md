# GAIA Open Filament Rewinder

New original educational R&D repository, not built hardware. Preserve evidence labels: SIMULATED, CALCULATED, ASSUMED, NOT_MEASURED, NOT_VERIFIED. No physical safety/fit/electrical compliance claim. No public push, Pages deployment, remote repository creation or release before Pedro's explicit approval. Portuguese README and user-facing web/tutorials; English identifiers, comments, architecture and engineering reports. English README required.

Use vanilla JS ES modules and Node built-in tests for the offline browser demonstrator. Calculations live in software/simulator; UI in software/web. Firmware is independently compilable PlatformIO ESP32, with host-tested state/calculation logic. Proposal-only motor/driver/pins require datasheet and physical verification. Physical interlocks/E-stop independent from browser/ESP32.

Scopes: mechanical/BOM worker owns hardware/, diagrams/, bom/ and source comparison notes; firmware worker owns firmware/ and firmware tests; frontend worker owns software/web/. Root owns simulator, cross-layer protocol, README/docs/CI/integration QA. Do not edit another worker's files without coordination. No copied reference CAD/firmware unless license proven compatible and attribution preserved; prefer original concept models. Do not invent quotations or export STEP/STL without successful geometry generation. No empty placeholder files.

Build/test commands will be recorded in package.json, firmware/README.md and docs/en/validation.md. Generated .pio/node_modules/test-results/build outputs ignored. Keep original source and evidence; inventory/inputs are not proof of a constructed machine.

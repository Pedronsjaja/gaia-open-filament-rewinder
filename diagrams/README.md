# Concept illustrations

All illustrations are original SVG source, **PROPOSTA CONCEITUAL / NOT FABRICATION READY**, and do not assert built hardware. Electrical illustrations are functional block diagrams; no KiCad project, PCB, netlist or verified wiring diagram is claimed. Mechanical views omit guards in places to explain function; that omission does not authorize unguarded operation.

| View | SVG |
|---|---|
| Isometric assembly | [01-isometric.svg](01-isometric.svg) |
| Top layout | [02-top.svg](02-top.svg) |
| Exploded spindle | [03-exploded.svg](03-exploded.svg) |
| Filament path | [04-filament-path.svg](04-filament-path.svg) |
| Independent encoder wheel | [05-encoder-wheel.svg](05-encoder-wheel.svg) |
| Motor and transmission | [06-motor-drive.svg](06-motor-drive.svg) |
| Lateral-guide proposal | [07-lateral-guide.svg](07-lateral-guide.svg) |
| Lite functional electrical blocks | [08-lite-electrical.svg](08-lite-electrical.svg) |
| Smart functional electrical blocks | [09-smart-electrical.svg](09-smart-electrical.svg) |
| ESP32 and browser boundary | [10-esp32-browser.svg](10-esp32-browser.svg) |
| Lite/Smart comparison | [11-lite-smart-comparison.svg](11-lite-smart-comparison.svg) |

Regenerate deterministically with `node diagrams/generate.mjs` from repository root. These illustrations explain architecture; dimensions, limits and unresolved details belong to [hardware](../hardware/README.md), [firmware](../firmware/README.md) and [BOM](../bom/README.md). Do not infer a connected machine from the simulated browser demonstrator.

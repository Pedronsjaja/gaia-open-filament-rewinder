# Mechanical and electrical concept

**PROPOSTA CONCEITUAL / NOT FABRICATION READY.** Original educational R&D work. No physical rewinder has been built or measured for this repository. This machine transfers existing filament between spools. It has no extruder, heater, melt process or filament-diameter manufacturing control.

## Configurations

Lite uses two supported spindles, a DC gearmotor, an independent PWM generator, local start/stop, passive adjustable tension and manual lateral guiding. It needs no ESP32, browser or firmware. An external scale can estimate transferred mass after a separate tare measurement. Manual guidance requires a handle outside guards and all pinch points. It does not authorize handling a rotating spool.

Smart adds an ESP32 proposal, an independent measuring wheel and quadrature encoder, and a proposed stepper-driven guide with two end limits. The wheel measures filament travel, independent of growing destination-spool diameter. Motor-integrated encoder counts cannot replace this measurement. Software target completion, no-motion timeout, limit faults and link loss must remove the motion request; physical interlocks must independently remove actuator energy. Firmware implementation and limitations are documented in [firmware](../firmware/README.md).

## Original parametric model

[cad/rewinder.scad](cad/rewinder.scad) contains assembly, base, bearing-tower, centring-cone and guide-carriage modules. Select `configuration="Lite"` or `"Smart"`; `part="assembly"`, `"base"`, `"bearing_tower"`, `"cone"` or `"guide_carriage"`; `exploded` separates components for review. These are envelopes and design studies, not toleranced manufacturing drawings.

| Parameter | Default | Evidence / required review |
|---|---:|---|
| Base envelope | 620 × 300 × 12 mm | ASSUMED, stiffness and stability NOT_VERIFIED |
| Spool flange / barrel diameter | 200 / 80 mm | ASSUMED; measure source and destination separately |
| Spool width / bore | 70 / 52 mm | ASSUMED; no universal spool compatibility claim |
| Spindle diameter / length | 8 / 140 mm | ASSUMED; bending, runout and retention not checked |
| Shaft height / station spacing | 135 / 310 mm | ASSUMED; model asserts coarse flange clearance |
| Bearing envelope | 22 × 7 mm | Nominal 608-size proposal, purchased part TO_VERIFY |
| Bearing-seat diametral clearance | 0.3 mm | ASSUMED; print coupon and retention design required |
| Shaft clearance | 0.5 mm | ASSUMED; not a precision-fit prescription |
| Cone diameters / length | 36–60 / 24 mm | ASSUMED; no clamping or torque-transfer proof |
| Guide travel / rod spacing | 80 / 32 mm | ASSUMED; actual usable spool width sets travel |
| Measuring-wheel diameter / width | 30 / 12 mm | ASSUMED; effective rolling diameter needs calibration |
| Motor envelope | Ø37 × 73 mm | Manufacturer candidate; bracket holes not modelled |

The Smart linear-rod and motor blocks show proposed placement only. The model does not contain a selected lead screw, complete bearing retention, anti-rotation hubs, complete guards, motor-bracket fasteners, encoder shaft adapter or final wiring. Review assembled interference, motor overhang and guide alignment before fabrication. The STL supplied is the concept base only; it is not a printable complete rewinder or proof of structural adequacy. No STEP export is claimed.

Reproduce with OpenSCAD (CLI version and outcome in [cad/validation.md](cad/validation.md)):

```powershell
openscad -o base-concept.stl -D 'part="base"' rewinder.scad
openscad -o lite-concept.csg -D 'configuration="Lite"' rewinder.scad
openscad -o smart-concept.csg -D 'configuration="Smart"' rewinder.scad
```

## Proposed component references

Primary sources below were actually opened on 2026-11-07. A manufacturer page is component evidence, not a Brazilian quotation, stock check or validation of this integration.

| Candidate / source | What the source supports | Integration limit |
|---|---|---|
| [Pololu 4755 motor](https://www.pololu.com/product/4755) | 12 V, approximately 100 rpm no-load, 5.5 A extrapolated stall, 6 mm D shaft and encoder on motor | Loaded speed and torque needed here NOT_MEASURED. Avoid prolonged stall. Internal CPR is not filament-length CPR. |
| [Pololu G2 18v17 driver](https://www.pololu.com/product/2991) | Brushed DC H-bridge, 3.3 V-compatible inputs, current-sense/limit features | Manufacturer 17 A board rating does not prove enclosure thermal performance. Set current limit for the motor, source, cables and mechanical force. No overtemperature protection claimed by manufacturer. |
| [ESP32 series datasheet](https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf) | SoC electrical/peripheral information | Exact development board, pin allocation and power entry still TO_VERIFY. No direct 5 V GPIO connection. |
| [TI DRV8825 datasheet](https://www.ti.com/lit/ds/symlink/drv8825.pdf) | STEP/DIR driver, current regulation and fault output | IC maximum current is not a purchased module's thermally safe current. Set sense-resistor/VREF limit and validate cooling. |

The [DRV8871 datasheet](https://www.ti.com/lit/ds/symlink/drv8871.pdf) was examined but its 3.6 A peak specification is not sufficient evidence for unrestricted 5.5 A motor stall; it is not the selected candidate. A commercial independent encoder SKU is UNKNOWN. No CPR, signal voltage, pinout or maximum frequency is invented. A Same Sky AMT10 document fetch returned HTTP 403 and is **NOT_VERIFIED**, so it supplies no design limits here. The SKF 608 page returned no readable specifications; the proposed bearing dimensions must be confirmed against the purchased part.

## Electrical review boundary

[SVG diagrams](../diagrams/README.md) show functional connections, not a KiCad PCB, netlist or fabrication-ready circuit. Use an external appropriately certified isolated DC supply. Coordinate fuse, cable gauge, connectors, current limit, startup/stall current, transient suppression and DC switching rating. Place local decoupling at each driver using its manufacturer's instructions; exact values depend on module and harness. Keep motor return currents out of encoder returns. Logic ground and power-return topology require review.

Lite must retain stop/restart behavior independently of any software. Smart must boot disabled with hardware pulls, require deliberate local rearm, condition encoder inputs to 3.3 V, and handle normally closed limit-circuit opening as a stop request. End limits need mechanical stops beyond the usable stroke. An E-stop contactor and safety circuit are proposals requiring a qualified design; a generic mushroom switch alone does not establish a safety-rated function. Browser buttons and Wi-Fi are not emergency stops.

## Physical validation still required

Before any powered assembly: measure spool geometry, bore and runout; verify support stiffness, base anchoring, guards and shaft retention; determine tension limit and pinch hazards; measure required torque over the fill range; coordinate energy isolation and prove no automatic restart. Then test current-limited low-speed motion, stop distance, thermal rise, encoder slip/reverse behavior and limit failure under controlled conditions. Record instrument, setup, uncertainty, raw data and explicit acceptance criteria. All these physical results are currently **NOT_MEASURED**.

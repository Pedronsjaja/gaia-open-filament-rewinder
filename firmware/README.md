# ESP32 firmware — initial R&D implementation

Evidence: **AUTOMATED SOFTWARE TESTS / CROSS-COMPILED; NOT HARDWARE VALIDATED.** No machine has been operated with this firmware. The default image cannot enable motor output. HTTP, Wi-Fi and WebSocket are not implemented or enabled; no credentials are stored in source.

## Architecture and build

`lib/RewinderCore/RewinderCore.h` is portable C++11: SI configuration, input bounds, effective encoder counts, wheel calibration, measured-count-derived length, estimated mass, target threshold, requested-speed ramp, state transitions and latched faults. `SessionCommands.h` supplies the shared start transition and strict unsigned-decimal calibration count parser. `src/main.cpp` adapts GPIO quadrature decoding, PWM, serial commands, loop timing and NVS. `test/core_test.cpp` executes the actual portable core and command helpers on the host; it does not reimplement them in Python.

From this directory, with Python, a C++ compiler and PlatformIO installed:

```sh
python test/run_host_tests.py
pio run -e esp32dev
```

The host runner also accepts `--compiler /path/to/g++`. It builds in a temporary directory and keeps assertions enabled. PlatformIO is pinned to `espressif32@6.9.0` (`esp32dev`, original ESP32), which supplies Arduino-ESP32 2.0.17 and supports the channel-based `ledcSetup` / `ledcAttachPin` API used here. This is a reproducibility choice, not a claim that this is the newest platform. Arduino 3.x removed these calls; changing the platform requires an explicit API migration and repeat verification. No third-party runtime library is required.

Verified on 2026-11-07:

- Host: Python 3.12, MinGW g++ 5.1.0; `python test/run_host_tests.py --compiler C:/Users/Pedro/.platformio/packages/toolchain-gccmingw32/bin/g++.exe` returned exit 0, `PASS`. Warnings treated as errors. Covers bounds/NaN rejection, calibration, length/mass, ramp, pause/resume, stop, fresh start, length/mass targets, no automatic restart, latched filament/limit/no-motion/reverse/timing/interlock faults and reset prerequisites. Regression cases verify that rejected start requests preserve pending encoder pulses and that signed/wrapped/overflow calibration counts are rejected. One executable evaluates 103 assertions, including repeated invalid parser inputs; these are not 103 separately named tests.
- ESP32: `C:/Users/Pedro/.codex/tools/rewinder-pio/Scripts/pio.exe run -e esp32dev` returned exit 0, `SUCCESS`; PlatformIO Core 6.1.18, Arduino package `3.20017.241212+sha.dcc1105b`, Xtensa GCC 8.4.0. RAM 22,288 bytes / 327,680; flash 314,061 / 1,310,720. These are linker statistics, not stack margin or timing measurements.
- No flash/upload, serial-device test, NVS power interruption test, motor/sensor/traverser test, emergency stop test, speed calibration or electrical validation was performed.

The Python virtual environment used for compilation is outside this repository; PlatformIO packages remain in its normal user cache. Generated `.pio` outputs must remain ignored. An initial build's concurrent package-cache cleanup failed; the final sequential build above completed successfully.

## Proposed interface — NOT_VERIFIED

| Function | Proposed ESP32 GPIO | Assumed interpretation |
|---|---:|---|
| Driver PWM | 25 | 20 kHz, 10-bit, active high |
| Driver enable / sleep release | 26 | low disables; high enables |
| Driver direction | 27 | fixed low, unidirectional |
| Encoder A/B | 32 / 33 | quadrature CHANGE on both inputs, x4 effective counts |
| Filament presence | 18 | low means present |
| Left / right end limits | 19 / 21 | low means clear, open/high trips |
| Physical E-stop feedback | 22 | low means released; observation only |
| Local arm switch | 23 | low requests arm |

Board variant, exact motor/driver/encoder SKU, polarity, voltage levels, line conditioning, external pull resistors, pin conflicts, cable fault behavior and electrical ratings require verification before wiring. **Never connect 5 V encoder signals directly to ESP32 GPIO.** Count direction must be verified at low energy; negative decoded movement latches `ENCODER_REVERSE`. `countsPerRevolution` means effective decoded counts at the measuring wheel, including quadrature/gearing; the default 600 is ASSUMED, not an encoder specification. An invalid quadrature transition currently contributes zero counts and is not diagnosed separately; electrical noise/slip remain unverified risks.

The adapter assumes independent normally closed limit/feedback circuits and needs external hardware that disables the driver throughout reset, brownout and boot. Software cannot guarantee reset-pin levels or torque removal. **A physical, independently wired emergency stop that removes motor power is mandatory.** ESP32 feedback and browser controls do not implement the emergency stop.

## Default inhibition and behavior

Actuation requires all three compile-time conditions: `REWINDER_ENABLE_ACTUATION=1`, `REWINDER_HARDWARE_VALIDATED=1`, and `REWINDER_TRAVERSER_VALIDATED=1`. The checked-in configuration explicitly sets the first to zero; the others default to zero in code. GPIO PWM/enable output setup is skipped in the default image. Local arm, healthy storage, successful PWM initialization, filament, end-limit clearance and E-stop feedback are also prerequisites for start/resume/reset. Do not assert validation flags before evidence and a reviewed hardware integration exist.

There is **no traverser motor/homing/position control in this release**. Its validation flag is only an inhibition gate; it is not a traverser implementation or live ready signal. A future traverser needs its own homing, limit handling, direction management and verified readiness interface. Both end limits currently stop the complete machine, rather than reverse a traverser.

PWM is an uncalibrated open-loop demand proportional to `requested speed / 0.5 m/s`. The reported `speedMps` is the ramped **command**, not measured filament speed; the initial mapping cannot establish a physical speed. The encoder measures length; it does not currently close a speed loop. No-motion timeout defaults to 2 s, polling to at least 10 ms, software timing-gap limit to 250 ms and command heartbeat expiry to 1 s. All values are provisional software bounds, not validated reaction times. Missed quadrature edges, wheel slip, spool inertia and scheduler/serial delay affect real stopping distance. The target check occurs after counting each tick and sets requested PWM to zero; it cannot guarantee zero overshoot or braking.

States: `IDLE`, `RUNNING`, `PAUSED`, `COMPLETED`, `STOPPED`, `FAULT`. Start clears the previous session's count/time. Pause immediately requests zero PWM and still accounts encoder drift; resume ramps from zero and preserves the session. Stop requests zero PWM, preserves a latched fault, and cannot be resumed; a deliberate new start is required. Target completion cannot resume. Fault reset requires cleared interlocks and returns to IDLE without restarting. The first fault reason stays latched. No-motion monitoring applies while running; paused sensor interlocks remain checked. Reverse movement is rejected instead of subtracting from length.

Only an accepted new start clears pending encoder pulses. State transition and pulse reset use the same critical section as the ISR; rejected duplicate starts preserve current-session pulses. The continuously tracked A/B phase is not reinitialized at a session boundary. This software synchronization has host regression coverage; ISR timing, missed physical edges and changing interlocks during a transition still require hardware verification.

Length is calculated from counts, wheel diameter and calibration factor. Mass is **ESTIMATED** from length × circular filament area × assumed density; it is not weighed. Calibration uses a separately measured reference length and actual observed effective counts:

`factor = referenceLengthM * countsPerRevolution / (observedCounts * pi * wheelDiameterM)`

Configuration is versioned, range-validated and stored in one NVS blob with a corruption checksum. It contains configuration only, never a run/armed state. It is local ABI-dependent storage, not an interchange format or authenticated record. Missing configuration uses assumed defaults; incompatible/corrupt records latch an interlock fault rather than silently start. Storage write failure rolls back the in-memory candidate and inhibits further actuation. Schema migration/recovery and power-loss behavior require bench verification before deployment.

## Local serial protocol and future transport

Serial is 115200 baud, newline terminated, max 95 characters per line. Overlong lines are discarded. No network listener exists. Responses are JSON lines; status uses schema `1.0`, mode `FIRMWARE_UNVALIDATED`, SI values and the same core snapshot fields as the offline demonstrator. `material` is `CUSTOM` because density is entered explicitly; do not treat it as verified PLA/PETG/ABS. `movementDetected` means nonzero delta at the last firmware tick. Fault-free status uses `fault:"NONE"`; adapters must not mistake this string for an active fault.

| Command | Effect |
|---|---|
| `status` | Configuration, state, length, estimated mass, command speed, sensors, alerts |
| `heartbeat` | Refreshes host command lease; send more frequently than 1 s during RUNNING/PAUSED |
| `start` / `pause` / `resume` / `stop` | Explicit state requests, subject to local gates |
| `reset` | Clears latched fault only after all interlocks clear; no restart |
| `set speedMps 0.1` | Validates and persists one configuration field while IDLE/STOPPED/COMPLETED |
| `calibrate 1.0 6366` | Persists a calibration from reference metres and effective counts |

Other `set` fields: `accelerationMps2`, `diameterM`, `densityKgM3`, `wheelDiameterM`, `countsPerRevolution`, `calibrationFactor`, `targetLengthM`, `targetMassKg`, `massTarget` (0/1), `noMotionTimeoutS`. Unknown fields, nonfinite values, fractional effective counts, extra arguments and out-of-range values are rejected. Geometry, density, calibration and speeds must be positive; full bounds are centralized in `rewinder::valid`. Configuration/calibration is rejected during RUNNING, PAUSED and FAULT.

Calibration observed counts use digits only, range 1..4,294,967,295, before any conversion to `uint32_t`; signs, exponent notation, trailing characters and overflow are rejected. Counts cannot wrap through `scanf` unsigned conversion. The calibration factor and reference-length bounds are then checked independently.

Future HTTP should use a polling read-only `/api/v1/snapshot` and an explicit authenticated/authorized command interface with bounded requests, local interlocks, session freshness and a disconnect watchdog. WebSocket would only carry the same versioned protocol after integration validation. Neither route nor WebSocket exists today. The offline web app must not imply live connectivity. Establish the transport threat model, serial/network command arbitration, timing budget and tests before enabling any external actuation path.

## Primary API references

- [PlatformIO Espressif32 v6.9.0 release](https://github.com/platformio/platform-espressif32/releases/tag/v6.9.0)
- [Espressif Arduino 2.x → 3.0 migration, including LEDC changes](https://docs.espressif.com/projects/arduino-esp32/en/latest/migration_guides/2.x_to_3.0.html)
- [Espressif Preferences API](https://docs.espressif.com/projects/arduino-esp32/en/latest/api/preferences.html)

These references explain software APIs; they do not validate the proposed wiring, mechanics or safety.

# Engineering model and evidence

This project transfers manufactured filament between spools. It neither extrudes nor recycles material. No machine has been built or tested by this repository. Parameters below are design examples, not safe operating limits.

## Metering independent from winding radius

For measuring-wheel diameter D [m], decoded encoder counts/revolution C [count/rev], calibration k [1], pulse count n [count]: q = pi D k / C [m/count], L = n q [m]. C includes the decoder multiplier/gearing; a datasheet's pulses/revolution is not automatically C. Initial firmware uses a quadrature x4 transition table: the nominal600 count/rev preset would mean150 complete A/B cycles/rev for a direct-drive wheel. The commercial encoder is UNKNOWN, so this is a configuration example, not its specification. Single-channel alternatives cannot measure direction. Reversal/slack handling and real edge-rate capacity require physical validation.

At D=0.030 m and C=600, q=0.0001570796327 m/count. n=10000 gives L=1.570796327 m nominally. A separately measured 1.575 m reference gives k=1.00267614 approximately. Calibration replaces the nominal factor, rather than multiplying the previous correction again. Repeat at several lengths/speeds in both directions where applicable and record raw counts/reference, uncertainty and environment. Values here are CALCULATED/ASSUMED, not measured calibration data.

Use a lightly preloaded compliant measuring wheel and idler, with guards. Excess preload can indent filament; insufficient preload can slip. Compare encoder travel to an independent traceable length, change speed/tension and inspect repeatability/hysteresis. Slip is a bias, not solved by adding encoder resolution; calibration may not generalize between materials/conditions. Filament motion can occur without receiver winding during a jam or slack loop: an independent receiver/tension measurement remains a design gap.

## Estimated mass and its inverse

For circular filament of diameter d [m], material density rho [kg/m^3], and length L [m]: estimated mass m = rho pi d^2 L /4 [kg]. Desired mass converts to target length L_target = 4 m_target/(rho pi d^2). Hollow, filled, foamed, oval or variable-diameter filament can violate assumptions. Material presets PLA1240, PETG1270, ABS1040 kg/m^3 are explicitly ASSUMED illustrative numbers, not verified batch/brand properties. Replace with product-specific data and measurements; use an external scale for actual mass.

Example: d=0.00175 m, L=10 m, rho=1240 kg/m^3 → estimated m=0.02982549526 kg =29.8255 g. A desired 0.100 kg gives approximately 33.53 m. `node examples/calculations.mjs` prints authoritative reproducible values; these rounded examples are not precision claims.

For independent standard uncertainties and small deviations, u_m/m ≈ sqrt[(u_L/L)^2 + (2u_d/d)^2 + (u_rho/rho)^2]. Example standard uncertainties 1% length, 0.03 mm diameter on 1.75 mm, 2% density give approximately 4.09% relative combined standard uncertainty, not a guaranteed bound or automatically 95% confidence. A tolerance ±a with uniform distribution contributes standard u=a/sqrt(3); count rounding ±q/2 contributes q/sqrt(12). Account for covariance, systematic slip, calibration reference and temperature when relevant. For varying diameter integrate rho A(x) dx rather than squaring only the mean diameter. General method: [NIST uncertainty propagation](https://www.nist.gov/pml/nist-technical-note-1297/nist-tn-1297-appendix-law-propagation-uncertainty).

## Torque, speed, tension and supply

At winding radius r [m], line velocity v [m/s], omega=v/r [rad/s], rpm=60v/(2 pi r). Receiver torque T=F r + J alpha + T_friction [N m], where F is desired tension [N], J rotational inertia [kg m^2], and approximately alpha=a/r for slowly changing radius. The ignored -v r_dot/r^2 term needs attention during rapid radius change. A drive requirement may conservatively use T_drive=serviceFactor*T/efficiency for the defined transmission. A gearbox's output rating must not be multiplied by its reduction a second time.

With F=1 N, v=.1 m/s and r=.03/.06 m, RPM approximately31.83/15.92; tension torque .03/.06 N m. Adding J=.001 kg m^2, a=.05 m/s^2, friction=.01 N m, transmission efficiency=.7 and service factor2 yields the values printed in examples. All are ASSUMED inputs, not allowable filament stress or validated motor duty. Winding radius increases required torque while decreasing receiver speed. Simple PWM controls demand, not measured linear speed; spool RPM alone cannot measure line length. A dancer/slip clutch or compliant tension mechanism is proposed; force thresholds require actual testing.

Size the supply/driver for measured or datasheet stall/inrush and simultaneous auxiliary loads, current limiting, duty, thermal derating and protected wiring—not only Fv steady power. Example 5.5A motor stall + ASSUMED .5A auxiliary, factor1.25 →7.5A preliminary budget. This is not a fuse value, final supply specification or evidence the proposed board can sustain it. Store tension limits, inertia, friction, encoder SKU, driver thermal envelope and wire/fuse selections as UNKNOWN until resolved. See hardware documentation for manufacturer-specific candidate facts.

## Jam, rupture and simulated stop

Independent no-pulse timeout can detect some jams/disconnections; it cannot prove their cause or detect every receiver jam. Filament presence switch, contradictory limits, local stop, heartbeat loss and no-motion faults must stop demand and latch. No automatic restart after fault/reset/power return. Current/torque/tension feedback and guarding remain open. Disabling PWM does not prove torque removal, braking or stop distance; a physical accessible E-stop removes motor power independently of web/MCU logic.

The browser simulator integrates acceleration in SI, quantizes integer encoder counts and clamps its ideal completion to the first target encoder boundary. This deliberately idealized model has no inertia/coast/slip/electrical braking model or timing guarantees. It is not evidence of real stop precision. Synthetic fault injection resets virtual sensor state on manual reset; physical firmware requires real interlock recovery. Simulation time is active time only, paused time excluded, and each tick is bounded to at most1s. Persisted browser sessions never auto resume.

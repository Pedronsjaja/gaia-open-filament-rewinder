# CAD generation evidence

Date: 2026-11-07. OpenSCAD CLI reported version **2021.01**. `rewinder.scad` is original source. `lite-concept.csg` and `smart-concept.csg` were generated using their configuration selectors. `base-concept.stl` was actually rendered with CGAL for `part="base"`; OpenSCAD reported `Simple: yes`, 520 vertices, 780 edges and 262 CGAL facets. Those are CGAL summary quantities, not the STL triangle count. The `Volumes: 2` console value includes CGAL regions and is not treated as proof of two manufactured parts.

A separate ASCII-STL check tests triangle count, two incident faces per undirected edge, positive signed volume and the expected bounding box. Its exact results are recorded in [validation.json](validation.json). This establishes only those mesh properties for the base. It does not validate load capacity, printable size, material behavior, hole tolerance, assemblies, fit, safety or a physical prototype. No STEP file has been generated.

On this Windows installation, `openscad.com` provides synchronous console diagnostics. Absolute output paths were needed for CSG generation; relative CSG output paths produced an export-open error. Reproduction example:

```powershell
& 'C:/Program Files/OpenSCAD/openscad.com' -o 'E:/GitHub/gaia-open-filament-rewinder/hardware/cad/base-concept.stl' -D 'part="base"' 'E:/GitHub/gaia-open-filament-rewinder/hardware/cad/rewinder.scad'
& 'C:/Program Files/OpenSCAD/openscad.com' -o 'E:/GitHub/gaia-open-filament-rewinder/hardware/cad/lite-concept.csg' -D 'configuration="Lite"' 'E:/GitHub/gaia-open-filament-rewinder/hardware/cad/rewinder.scad'
& 'C:/Program Files/OpenSCAD/openscad.com' -o 'E:/GitHub/gaia-open-filament-rewinder/hardware/cad/smart-concept.csg' -D 'configuration="Smart"' 'E:/GitHub/gaia-open-filament-rewinder/hardware/cad/rewinder.scad'
```

All geometry remains **PROPOSTA CONCEITUAL / NOT FABRICATION READY**.

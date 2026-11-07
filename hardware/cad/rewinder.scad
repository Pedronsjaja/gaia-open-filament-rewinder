// Original educational concept, GAIA Open Filament Rewinder.
// PROPOSTA CONCEITUAL / NOT FABRICATION READY. Dimensions in mm (ASSUMED).
// No measured hardware, verified fit, bearing seat tolerance or load rating.
$fn = 64;
configuration = "Smart"; // [Lite,Smart]
part = "assembly"; // [assembly,base,bearing_tower,cone,guide_carriage]
exploded = 0; // separation in mm for conceptual review
base_length = 620;
base_depth = 300;
base_thickness = 12;
spool_flange_diameter = 200;
spool_barrel_diameter = 80;
spool_width = 70;
spool_bore = 52;
shaft_diameter = 8;
shaft_height = 135;
shaft_length = 140;
spool_center_spacing = 310;
bearing_outer_diameter = 22;
bearing_width = 7;
bearing_seat_clearance = 0.3; // ASSUMED, requires material-specific coupons
shaft_clearance = 0.5;
tower_thickness = 15;
tower_width = 48;
mount_hole_diameter = 5.5;
cone_small_diameter = 36;
cone_large_diameter = 60;
cone_length = 24;
guide_travel = 80;
guide_rod_diameter = 8;
guide_rod_spacing = 32;
guide_eye_diameter = 4;
measuring_wheel_diameter = 30;
measuring_wheel_width = 12;
motor_body_diameter = 37;
motor_body_length = 73;
motor_shaft_diameter = 6;
assert(spool_center_spacing > spool_flange_diameter+30, "Concept spools overlap");
assert(shaft_height > spool_flange_diameter/2+base_thickness, "Flange intersects base");
assert(cone_small_diameter < spool_bore && cone_large_diameter > spool_bore, "Cone must span bore");
assert(guide_travel >= spool_width, "Guide cannot cover barrel");

module base() {
 difference() {
  cube([base_length,base_depth,base_thickness]);
  for(x=[25,base_length-25],y=[25,base_depth-25])
   translate([x,y,-1]) cylinder(d=mount_hole_diameter,h=base_thickness+2);
 }
}
module bearing_tower() {
 difference() {
  union() {cube([tower_width,tower_thickness,shaft_height]);
   translate([-10,-15,0]) cube([tower_width+20,tower_thickness+30,10]);}
  translate([tower_width/2,-1,shaft_height-15]) rotate([-90,0,0])
   cylinder(d=bearing_outer_diameter+bearing_seat_clearance,h=tower_thickness+2);
  for(x=[0,tower_width]) translate([x,tower_thickness/2,-1]) cylinder(d=mount_hole_diameter,h=12);
 }
}
module cone(){difference(){cylinder(d1=cone_large_diameter,d2=cone_small_diameter,h=cone_length);
 translate([0,0,-1]) cylinder(d=shaft_diameter+shaft_clearance,h=cone_length+2);}}
module guide_carriage(){difference(){cube([28,48,22]);
 for(y=[8,8+guide_rod_spacing]) translate([-1,y,11]) rotate([0,90,0]) cylinder(d=guide_rod_diameter+shaft_clearance,h=30);
 translate([14,24,-1]) cylinder(d=guide_eye_diameter,h=24);}}
module spool(){rotate([90,0,0]) {color("slategray") cylinder(d=spool_barrel_diameter,h=spool_width,center=true);
 for(y=[-spool_width/2,spool_width/2]) translate([0,0,y]) color("darkgray") cylinder(d=spool_flange_diameter,h=3,center=true);}}
module station(x){
 for(y=[90,210]) translate([x-tower_width/2,y,base_thickness+exploded]) bearing_tower();
 translate([x,150,shaft_height-15+base_thickness+2*exploded]) spool();
 translate([x,80,shaft_height-15+base_thickness]) rotate([-90,0,0]) color("silver") cylinder(d=shaft_diameter,h=shaft_length);
 for(y=[105,195]) translate([x,y,shaft_height-15+base_thickness+exploded]) rotate([90,0,0]) color("orange") cone();
}
module assembly(){
 color("burlywood") base();
 station(150); station(150+spool_center_spacing);
 // Motor envelope and direct compliant-coupling space, no gearbox CAD copied.
 translate([150+spool_center_spacing,250,shaft_height-15+base_thickness]) rotate([90,0,0]) color("steelblue") cylinder(d=motor_body_diameter,h=motor_body_length);
 // Passive tensioner envelope, not a calibrated tension sensor.
 translate([300,60,65]) color("orange") cube([20,40,12]);
 translate([400,30,base_thickness]) color("steelblue") guide_carriage();
 if(configuration=="Smart") {
  for(y=[38,38+guide_rod_spacing]) translate([370,y,base_thickness+11]) rotate([0,90,0]) color("silver") cylinder(d=guide_rod_diameter,h=guide_travel+50);
  translate([300,75,65]) rotate([90,0,0]) color("green") cylinder(d=measuring_wheel_diameter,h=measuring_wheel_width);
  translate([530,25,base_thickness]) color("seagreen") cube([60,70,25]);
 }
}
if(part=="base") base();
else if(part=="bearing_tower") bearing_tower();
else if(part=="cone") cone();
else if(part=="guide_carriage") guide_carriage();
else assembly();

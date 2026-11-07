#include "RewinderCore.h"
#include "SessionCommands.h"
#include <cassert>
#include <cstdio>
#include <limits>
#include <initializer_list>
using namespace rewinder;
Sensors ready() { Sensors s; s.filamentPresent=true; s.estopReleased=true; s.localArm=true; s.traverserReady=true; return s; }
void close(double a,double b) { assert(std::fabs(a-b)<1e-9); }
int main() {
  // Exercise the same command helpers used under the adapter's encoder lock.
  Machine session; volatile int32_t pending=37; auto healthy=ready();
  assert(!startSession(session,Sensors{},pending)); assert(pending==37);
  assert(startSession(session,healthy,pending)); assert(pending==0);
  pending=23;
  assert(!startSession(session,healthy,pending)); assert(pending==23);
  session.tick(.01,pending,healthy); pending=0; assert(session.encoderCounts()==23);
  assert(session.pause()); pending=11;
  assert(!startSession(session,healthy,pending)); assert(pending==11);
  session.stop(); assert(startSession(session,healthy,pending)); assert(pending==0);
  session.trip(Fault::INTERLOCK); pending=19;
  assert(!startSession(session,healthy,pending)); assert(pending==19);
  uint32_t parsed=99;
  for(const char* invalid:{"", "0", "-1", "+600", "-4294966696", "4294967896", "4294967296", "600x", "1e3", " 600", "600 ", "99999999999999999999999999999999"}) {
    assert(!parseObservedCounts(invalid,parsed)); assert(parsed==99);
  }
  assert(!parseObservedCounts(nullptr,parsed)); assert(parsed==99);
  assert(parseObservedCounts("600",parsed)); assert(parsed==600);
  assert(parseObservedCounts("000600",parsed)); assert(parsed==600);
  assert(parseObservedCounts("4294967295",parsed)); assert(parsed==UINT32_MAX);
  Machine m; Config c; const auto s=ready();
  assert(!m.start(Sensors{})); assert(m.state()==State::IDLE);
  c.diameterM=std::numeric_limits<double>::quiet_NaN(); assert(!m.configure(c));
  c=Config{}; c.countsPerRevolution=0; assert(!m.configure(c));
  c=Config{}; c.speedMps=.6; assert(!m.configure(c));
  assert(m.calibrate(.09424777960769379,600)); close(m.config().calibrationFactor,1);
  assert(!m.calibrate(1,0)); assert(m.start(s));
  assert(!m.configure(Config{})); assert(!m.calibrate(1,600));
  m.tick(.1,100,s); close(m.speedMps(),.01); close(m.lengthM(),100*.03*3.141592653589793/600);
  close(m.massKg(),m.lengthM()*3.141592653589793*.00175*.00175/4*1240);
  assert(m.pause()); close(m.speedMps(),0); m.tick(.1,1,s); assert(m.encoderCounts()==101);
  assert(m.resume(s)); m.tick(.1,1,s); close(m.speedMps(),.01);
  m.stop(); m.tick(.1,100,s); assert(m.encoderCounts()==102); close(m.speedMps(),0);
  assert(!m.resume(s)); assert(m.start(s)); assert(m.encoderCounts()==0);
  Sensors bad=s; bad.filamentPresent=false; m.tick(.01,0,bad);
  assert(m.fault()==Fault::FILAMENT_MISSING); m.stop(); assert(m.state()==State::FAULT);
  assert(!m.start(s)); assert(!m.resetFault(bad)); assert(m.resetFault(s)); assert(m.state()==State::IDLE);
  m.tick(.1,100,s); assert(m.encoderCounts()==0); close(m.speedMps(),0);
  assert(m.start(s)); for(int i=0;i<21;i++) m.tick(.1,0,s);
  assert(m.fault()==Fault::NO_MOTION); assert(m.resetFault(s));
  assert(m.start(s)); bad=s; bad.leftLimit=true; m.tick(.1,1,bad); assert(m.fault()==Fault::END_LIMIT);
  assert(m.resetFault(s)); assert(m.start(s)); m.tick(.3,1,s); assert(m.fault()==Fault::TIMING);
  assert(m.resetFault(s)); assert(m.start(s)); m.tick(.1,-1,s); assert(m.fault()==Fault::ENCODER_REVERSE);
  assert(m.resetFault(s)); assert(m.start(s)); bad=s; bad.localArm=false; m.tick(.1,1,bad); assert(m.fault()==Fault::INTERLOCK);
  assert(m.resetFault(s)); c=Config{}; c.targetLengthM=.01; assert(m.configure(c)); assert(m.start(s));
  m.tick(.1,64,s); assert(m.state()==State::COMPLETED); close(m.speedMps(),0);
  assert(m.start(s)); m.stop(); c.massTarget=true; c.targetMassKg=.00001; assert(m.configure(c));
  assert(m.start(s)); m.tick(.1,100,s); assert(m.state()==State::COMPLETED);
  assert(!m.resume(s)); assert(m.state()==State::COMPLETED);
  std::puts("PASS: portable core assertions (logic/calculation only; no hardware validation)");
}

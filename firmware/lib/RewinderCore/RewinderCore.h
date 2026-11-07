#pragma once
#include <cmath>
#include <cstdint>

namespace rewinder {
enum class State { IDLE, RUNNING, PAUSED, COMPLETED, STOPPED, FAULT };
enum class Fault { NONE, INTERLOCK, FILAMENT_MISSING, END_LIMIT, NO_MOTION, ENCODER_REVERSE, TIMING };
struct Config {
  uint32_t version = 1;
  double diameterM = .00175, densityKgM3 = 1240;
  double wheelDiameterM = .03, calibrationFactor = 1;
  uint32_t countsPerRevolution = 600;
  bool massTarget = false;
  double targetLengthM = 10, targetMassKg = .025;
  double speedMps = .1, accelerationMps2 = .1;
  double noMotionTimeoutS = 2;
};
inline bool bounded(double x, double lo, double hi) { return std::isfinite(x) && x >= lo && x <= hi; }
inline bool valid(const Config& c) {
  return c.version == 1 && bounded(c.diameterM,.0005,.004) && bounded(c.densityKgM3,100,5000)
    && bounded(c.wheelDiameterM,.005,.5) && bounded(c.calibrationFactor,.1,10)
    && c.countsPerRevolution >= 1 && c.countsPerRevolution <= 100000
    && bounded(c.targetLengthM,.001,100000) && bounded(c.targetMassKg,.000001,100)
    && bounded(c.speedMps,.001,.5) && bounded(c.accelerationMps2,.001,1)
    && bounded(c.noMotionTimeoutS,.1,10);
}
struct Sensors {
  bool filamentPresent = false, leftLimit = false, rightLimit = false;
  bool estopReleased = false, localArm = false, traverserReady = false;
};
class Machine {
 public:
  const Config& config() const { return config_; }
  State state() const { return state_; }
  Fault fault() const { return fault_; }
  double lengthM() const { return counts_ * metresPerCount(); }
  double massKg() const { return lengthM() * area() * config_.densityKgM3; }
  double targetLengthM() const { return config_.massTarget ? config_.targetMassKg / (area()*config_.densityKgM3) : config_.targetLengthM; }
  double speedMps() const { return speed_; }
  double elapsedS() const { return elapsed_; }
  int64_t encoderCounts() const { return counts_; }
  double metresPerCount() const { return 3.141592653589793 * config_.wheelDiameterM * config_.calibrationFactor / config_.countsPerRevolution; }
  bool configure(const Config& c) {
    if (state_ == State::RUNNING || state_ == State::PAUSED || state_ == State::FAULT || !valid(c)) return false;
    config_ = c; return true;
  }
  bool calibrate(double referenceLengthM, uint32_t observedCounts) {
    if (!bounded(referenceLengthM,.001,10000) || !observedCounts) return false;
    Config candidate = config_;
    candidate.calibrationFactor = referenceLengthM * candidate.countsPerRevolution /
      (observedCounts * 3.141592653589793 * candidate.wheelDiameterM);
    return configure(candidate);
  }
  bool start(const Sensors& s) {
    if (state_ != State::IDLE && state_ != State::STOPPED && state_ != State::COMPLETED) return false;
    if (!interlocks(s)) return false;
    counts_ = 0; elapsed_ = 0; noMotion_ = 0; speed_ = 0;
    state_ = State::RUNNING; return true;
  }
  bool pause() { if(state_ != State::RUNNING) return false; speed_=0; state_=State::PAUSED; return true; }
  bool resume(const Sensors& s) { if(state_ != State::PAUSED || !interlocks(s)) return false; noMotion_=0; state_=State::RUNNING; return true; }
  void stop() { speed_=0; if(state_ != State::FAULT) state_=State::STOPPED; }
  bool resetFault(const Sensors& s) {
    if (state_ != State::FAULT || !interlocks(s)) return false;
    fault_=Fault::NONE; state_=State::IDLE; speed_=0; return true;
  }
  void trip(Fault f) { if(state_ != State::FAULT) fault_=f; speed_=0; state_=State::FAULT; }
  void tick(double dt, int32_t countDelta, const Sensors& s) {
    if (state_ != State::RUNNING && state_ != State::PAUSED) return;
    if(!bounded(dt,.000001,.25)) { trip(Fault::TIMING); return; }
    if(!s.estopReleased || !s.localArm || !s.traverserReady) { trip(Fault::INTERLOCK); return; }
    if(!s.filamentPresent) { trip(Fault::FILAMENT_MISSING); return; }
    if(s.leftLimit || s.rightLimit) { trip(Fault::END_LIMIT); return; }
    if(countDelta < 0) { trip(Fault::ENCODER_REVERSE); return; }
    counts_ += countDelta;
    if(lengthM() >= targetLengthM()) { speed_=0; state_=State::COMPLETED; return; }
    if(state_ == State::PAUSED) return;
    elapsed_ += dt;
    noMotion_ = countDelta > 0 ? 0 : noMotion_ + dt;
    if(noMotion_ >= config_.noMotionTimeoutS) { trip(Fault::NO_MOTION); return; }
    speed_ = std::fmin(config_.speedMps, speed_ + config_.accelerationMps2*dt);
  }
 private:
  bool interlocks(const Sensors& s) const { return s.estopReleased && s.localArm && s.traverserReady && s.filamentPresent && !s.leftLimit && !s.rightLimit; }
  double area() const { return 3.141592653589793*config_.diameterM*config_.diameterM/4; }
  Config config_;
  State state_=State::IDLE;
  Fault fault_=Fault::NONE;
  int64_t counts_=0;
  double speed_=0, elapsed_=0, noMotion_=0;
};
inline const char* stateName(State s) {
  switch(s) { case State::IDLE:return "IDLE"; case State::RUNNING:return "RUNNING";
    case State::PAUSED:return "PAUSED"; case State::COMPLETED:return "COMPLETED";
    case State::STOPPED:return "STOPPED"; default:return "FAULT"; }
}
inline const char* faultName(Fault f) {
  switch(f) { case Fault::NONE:return "NONE"; case Fault::INTERLOCK:return "INTERLOCK";
    case Fault::FILAMENT_MISSING:return "FILAMENT_MISSING"; case Fault::END_LIMIT:return "END_LIMIT";
    case Fault::NO_MOTION:return "NO_MOTION"; case Fault::ENCODER_REVERSE:return "ENCODER_REVERSE";
    default:return "TIMING"; }
}
} // namespace rewinder

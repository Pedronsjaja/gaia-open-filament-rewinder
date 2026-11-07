#include <Arduino.h>
#include <Preferences.h>
#include <RewinderCore.h>
#include <SessionCommands.h>
#include <cstring>
#include <cstdlib>

#ifndef REWINDER_ENABLE_ACTUATION
#define REWINDER_ENABLE_ACTUATION 0
#endif
#ifndef REWINDER_HARDWARE_VALIDATED
#define REWINDER_HARDWARE_VALIDATED 0
#endif
#ifndef REWINDER_TRAVERSER_VALIDATED
#define REWINDER_TRAVERSER_VALIDATED 0
#endif

// PROPOSED ONLY: verify board, driver logic, level shifting and physical interlocks.
constexpr int PWM_PIN=25, ENABLE_PIN=26, DIRECTION_PIN=27;
constexpr int ENCODER_A=32, ENCODER_B=33;
constexpr int FILAMENT_PIN=18, LEFT_LIMIT_PIN=19, RIGHT_LIMIT_PIN=21;
constexpr int ESTOP_FEEDBACK_PIN=22, LOCAL_ARM_PIN=23;
constexpr bool OUTPUT_ALLOWED = REWINDER_ENABLE_ACTUATION && REWINDER_HARDWARE_VALIDATED && REWINDER_TRAVERSER_VALIDATED;
rewinder::Machine machine;
Preferences preferences;
bool storageReady=false;
bool pwmReady=false, movementDetected=false;
portMUX_TYPE encoderMux=portMUX_INITIALIZER_UNLOCKED;
volatile int32_t encoderDelta=0;
volatile uint8_t previousAB=0;
DRAM_ATTR int8_t encoderTable[16]={0,-1,1,0,1,0,0,-1,-1,0,0,1,0,1,-1,0};
uint32_t lastTick=0, lastHeartbeat=0;

void IRAM_ATTR encoderISR() {
  // Four effective counts per full quadrature cycle. Skipped/invalid edges count zero.
  uint8_t ab=(digitalRead(ENCODER_A)<<1)|digitalRead(ENCODER_B);
  portENTER_CRITICAL_ISR(&encoderMux);
  int8_t step=encoderTable[(previousAB<<2)|ab];
  if(encoderDelta < INT32_MAX-1 && encoderDelta > INT32_MIN+1) encoderDelta += step;
  previousAB=ab;
  portEXIT_CRITICAL_ISR(&encoderMux);
}
rewinder::Sensors readSensors() {
  rewinder::Sensors s;
  // External resistors and normally closed circuits must make disconnected wiring inhibit motion.
  s.filamentPresent=digitalRead(FILAMENT_PIN)==LOW;
  s.leftLimit=digitalRead(LEFT_LIMIT_PIN)!=LOW;
  s.rightLimit=digitalRead(RIGHT_LIMIT_PIN)!=LOW;
  s.estopReleased=digitalRead(ESTOP_FEEDBACK_PIN)==LOW;
  s.localArm=digitalRead(LOCAL_ARM_PIN)==LOW && OUTPUT_ALLOWED && storageReady && pwmReady;
  s.traverserReady=REWINDER_TRAVERSER_VALIDATED;
  return s;
}
void motorOff() {
  if(OUTPUT_ALLOWED) { digitalWrite(ENABLE_PIN,LOW); ledcWrite(0,0); }
}
uint32_t checksum(const rewinder::Config& c) {
  const auto* data=reinterpret_cast<const uint8_t*>(&c);
  uint32_t hash=2166136261u;
  for(size_t i=0;i<sizeof(c);++i) hash=(hash^data[i])*16777619u;
  return hash;
}
struct Record { rewinder::Config config; uint32_t hash; };
bool saveConfig() {
  Record r{}; r.config=machine.config(); r.hash=checksum(r.config);
  return storageReady && preferences.putBytes("config",&r,sizeof(r))==sizeof(r);
}
bool commitConfig(const rewinder::Config& candidate) {
  const auto previous=machine.config();
  if(!machine.configure(candidate)) return false;
  if(saveConfig()) return true;
  machine.configure(previous);
  storageReady=false;
  machine.trip(rewinder::Fault::INTERLOCK);
  return false;
}
void snapshot() {
  const auto& c=machine.config(); const auto s=readSensors();
  Serial.printf("{\"schemaVersion\":\"1.0\",\"mode\":\"FIRMWARE_UNVALIDATED\",\"state\":\"%s\",\"fault\":\"%s\",",rewinder::stateName(machine.state()),rewinder::faultName(machine.fault()));
  Serial.printf("\"lengthM\":%.8f,\"massKg\":%.8f,\"targetLengthM\":%.8f,\"progressPercent\":%.3f,\"speedMps\":%.5f,\"elapsedS\":%.3f,\"encoderCounts\":%lld,",machine.lengthM(),machine.massKg(),machine.targetLengthM(),fmin(100,100*machine.lengthM()/machine.targetLengthM()),machine.speedMps(),machine.elapsedS(),static_cast<long long>(machine.encoderCounts()));
  Serial.printf("\"alerts\":[\"NOT_HARDWARE_VALIDATED\",\"MASS_ESTIMATED\",\"OPEN_LOOP_PWM\"],\"sensors\":{\"filamentPresent\":%s,\"movementDetected\":%s,\"leftLimit\":%s,\"rightLimit\":%s},",s.filamentPresent?"true":"false",movementDetected?"true":"false",s.leftLimit?"true":"false",s.rightLimit?"true":"false");
  Serial.printf("\"config\":{\"material\":\"CUSTOM\",\"densityKgM3\":%.3f,\"diameterM\":%.6f,\"targetMode\":\"%s\",\"targetLengthM\":%.5f,\"targetMassKg\":%.6f,\"speedMps\":%.5f,\"accelerationMps2\":%.5f,\"wheelDiameterM\":%.5f,\"countsPerRevolution\":%u,\"calibrationFactor\":%.7f}}\n",c.densityKgM3,c.diameterM,c.massTarget?"mass":"length",c.targetLengthM,c.targetMassKg,c.speedMps,c.accelerationMps2,c.wheelDiameterM,c.countsPerRevolution,c.calibrationFactor);
}
void command(char* line) {
  bool ok=false;
  if(!strcmp(line,"stop")) { motorOff(); machine.stop(); ok=true; }
  else if(!strcmp(line,"status")) { snapshot(); return; }
  else if(!strcmp(line,"heartbeat")) { lastHeartbeat=millis(); ok=true; }
  else if(!strcmp(line,"start")) {
    const auto sensors=readSensors();
    portENTER_CRITICAL(&encoderMux);
    ok=rewinder::startSession(machine,sensors,encoderDelta);
    portEXIT_CRITICAL(&encoderMux);
    if(ok) { lastHeartbeat=millis(); lastTick=lastHeartbeat; }
  }
  else if(!strcmp(line,"pause")) { motorOff(); ok=machine.pause(); }
  else if(!strcmp(line,"resume")) { lastHeartbeat=millis(); ok=machine.resume(readSensors()); }
  else if(!strcmp(line,"reset")) ok=machine.resetFault(readSensors());
  else if(!strncmp(line,"set ",4)) {
    char key[32],value[40],extra;
    if(sscanf(line+4,"%31s %39s %c",key,value,&extra)==2) {
      char* end=nullptr; double number=strtod(value,&end);
      auto c=machine.config();
      if(end && !*end && std::isfinite(number)) {
        bool known=true;
        if(!strcmp(key,"speedMps")) c.speedMps=number;
        else if(!strcmp(key,"accelerationMps2")) c.accelerationMps2=number;
        else if(!strcmp(key,"diameterM")) c.diameterM=number;
        else if(!strcmp(key,"densityKgM3")) c.densityKgM3=number;
        else if(!strcmp(key,"wheelDiameterM")) c.wheelDiameterM=number;
        else if(!strcmp(key,"countsPerRevolution") && number>=1 && number<=100000 && floor(number)==number) c.countsPerRevolution=number;
        else if(!strcmp(key,"calibrationFactor")) c.calibrationFactor=number;
        else if(!strcmp(key,"targetLengthM")) c.targetLengthM=number;
        else if(!strcmp(key,"targetMassKg")) c.targetMassKg=number;
        else if(!strcmp(key,"massTarget") && (number==0 || number==1)) c.massTarget=number==1;
        else if(!strcmp(key,"noMotionTimeoutS")) c.noMotionTimeoutS=number;
        else known=false;
        ok=known && commitConfig(c);
      }
    }
  } else if(!strncmp(line,"calibrate ",10)) {
    double reference; uint32_t counts; char token[40],extra;
    if(sscanf(line+10,"%lf %39s %c",&reference,token,&extra)==2 && rewinder::parseObservedCounts(token,counts)) {
      const auto previous=machine.config();
      if(machine.calibrate(reference,counts)) {
        const auto candidate=machine.config(); machine.configure(previous);
        ok=commitConfig(candidate);
      }
    }
  }
  Serial.println(ok?"{\"ok\":true}":"{\"ok\":false}");
}
void setup() {
  // Never enable PWM or driver on boot; use external hardware pulldowns too.
  if(OUTPUT_ALLOWED) {
    digitalWrite(ENABLE_PIN,LOW); pinMode(ENABLE_PIN,OUTPUT);
    digitalWrite(DIRECTION_PIN,LOW); pinMode(DIRECTION_PIN,OUTPUT);
    digitalWrite(PWM_PIN,LOW); pinMode(PWM_PIN,OUTPUT);
    pwmReady=ledcSetup(0,20000,10)>0; ledcAttachPin(PWM_PIN,0); motorOff();
  }
  Serial.begin(115200);
  for(int pin:{FILAMENT_PIN,LEFT_LIMIT_PIN,RIGHT_LIMIT_PIN,ESTOP_FEEDBACK_PIN,LOCAL_ARM_PIN,ENCODER_A,ENCODER_B}) pinMode(pin,INPUT_PULLUP);
  previousAB=(digitalRead(ENCODER_A)<<1)|digitalRead(ENCODER_B);
  attachInterrupt(digitalPinToInterrupt(ENCODER_A),encoderISR,CHANGE);
  attachInterrupt(digitalPinToInterrupt(ENCODER_B),encoderISR,CHANGE);
  storageReady=preferences.begin("rewinder",false);
  if(storageReady && preferences.getBytesLength("config")) {
    Record r{};
    if(preferences.getBytesLength("config")!=sizeof(r) || preferences.getBytes("config",&r,sizeof(r))!=sizeof(r) || checksum(r.config)!=r.hash || !machine.configure(r.config))
      machine.trip(rewinder::Fault::INTERLOCK);
  }
  lastTick=millis(); snapshot();
}
void loop() {
  // Bound serial work so an input flood cannot starve interlock polling.
  static char line[96]; static size_t used=0; static bool overflow=false;
  for(unsigned n=0;n<32 && Serial.available();++n) {
    char ch=Serial.read();
    if(ch=='\n') { if(!overflow) { line[used]=0; command(line); } used=0; overflow=false; break; }
    else if(ch!='\r') {
      if(ch<32 || ch>126) overflow=true;
      else if(used<sizeof(line)-1) line[used++]=ch;
      else overflow=true;
    }
  }
  uint32_t now=millis(), elapsed=now-lastTick;
  if(elapsed>=10) {
    lastTick=now;
    portENTER_CRITICAL(&encoderMux); int32_t delta=encoderDelta; encoderDelta=0; portEXIT_CRITICAL(&encoderMux);
    movementDetected=delta!=0;
    if((machine.state()==rewinder::State::RUNNING || machine.state()==rewinder::State::PAUSED) && now-lastHeartbeat>1000) machine.trip(rewinder::Fault::INTERLOCK);
    machine.tick(elapsed/1000.0,delta,readSensors());
    if(OUTPUT_ALLOWED && machine.state()==rewinder::State::RUNNING) {
      ledcWrite(0,static_cast<uint32_t>(1023*machine.speedMps()/.5)); digitalWrite(ENABLE_PIN,HIGH);
    } else motorOff();
  }
}

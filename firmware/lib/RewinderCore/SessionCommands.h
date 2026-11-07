#pragma once
#include "RewinderCore.h"

namespace rewinder {
// Caller must hold the same lock as the encoder ISR across this transition.
// A rejected command must preserve pending pulses for the current session.
inline bool startSession(Machine& machine, const Sensors& sensors, volatile int32_t& pendingCounts) {
  if(!machine.start(sensors)) return false;
  pendingCounts=0;
  return true;
}

// Parse before narrowing: C scanf unsigned conversions accept signs and can wrap.
// Keep the caller's output unchanged on every failure.
inline bool parseObservedCounts(const char* token, uint32_t& result) {
  if(!token || !*token) return false;
  uint32_t value=0;
  for(const char* p=token; *p; ++p) {
    if(*p<'0' || *p>'9') return false;
    const uint32_t digit=static_cast<uint32_t>(*p-'0');
    if(value>(UINT32_MAX-digit)/10) return false;
    value=value*10+digit;
  }
  if(!value) return false;
  result=value;
  return true;
}
} // namespace rewinder

// Plain-English descriptions for the most common DTCs. Anything not listed
// falls back to a generic category description — Carlos (the AI) does the
// real explanation during diagnosis.

const DTC_DESCRIPTIONS: Record<string, string> = {
  P0011: "Camshaft timing slightly off (bank 1) — often low/dirty oil",
  P0016: "Crankshaft and camshaft out of sync — timing chain or sensor",
  P0101: "Air flow sensor reading doesn't match reality",
  P0102: "Air flow sensor reading too low — often a dirty sensor",
  P0113: "Intake air temperature sensor reading too high",
  P0128: "Engine not warming up properly — usually the thermostat",
  P0131: "Oxygen sensor voltage low (bank 1, sensor 1)",
  P0133: "Oxygen sensor responding slowly (bank 1, sensor 1)",
  P0135: "Oxygen sensor heater not working (bank 1, sensor 1)",
  P0141: "Oxygen sensor heater not working (bank 1, sensor 2)",
  P0171: "Engine running lean (bank 1) — not enough fuel or extra air",
  P0172: "Engine running rich (bank 1) — too much fuel",
  P0174: "Engine running lean (bank 2)",
  P0300: "Random/multiple cylinder misfires detected",
  P0301: "Cylinder 1 misfiring",
  P0302: "Cylinder 2 misfiring",
  P0303: "Cylinder 3 misfiring",
  P0304: "Cylinder 4 misfiring",
  P0305: "Cylinder 5 misfiring",
  P0306: "Cylinder 6 misfiring",
  P0325: "Knock sensor circuit problem",
  P0335: "Crankshaft position sensor problem — can cause no-starts",
  P0340: "Camshaft position sensor problem",
  P0401: "Exhaust gas recirculation (EGR) flow too low",
  P0420: "Catalytic converter efficiency below threshold (bank 1)",
  P0430: "Catalytic converter efficiency below threshold (bank 2)",
  P0440: "Fuel vapor (EVAP) system fault",
  P0442: "Small leak in the fuel vapor system — often the gas cap",
  P0455: "Large leak in the fuel vapor system — check the gas cap first",
  P0456: "Very small leak in the fuel vapor system",
  P0500: "Vehicle speed sensor problem",
  P0505: "Idle control system problem",
  P0507: "Idle speed higher than expected — often a vacuum leak",
  P0562: "System voltage low — battery or alternator",
  P0700: "Transmission control system fault — read transmission codes",
  P0715: "Transmission input speed sensor problem",
  P0741: "Torque converter clutch not engaging properly",
  P1000: "Onboard diagnostics not finished self-testing (Ford)",
  P2195: "Oxygen sensor stuck lean (bank 1, sensor 1)",
  P2270: "Oxygen sensor stuck lean (bank 1, sensor 2)",
  C0035: "Wheel speed sensor problem (front left)",
  B0001: "Airbag/restraint system circuit fault",
  U0100: "Lost communication with the engine computer",
  U0101: "Lost communication with the transmission computer",
};

export function describeDtc(code: string): string {
  const known = DTC_DESCRIPTIONS[code.toUpperCase()];
  if (known) return known;
  const c = code.toUpperCase();
  if (c.startsWith("P0") || c.startsWith("P2")) return "Engine/emissions fault (standard code)";
  if (c.startsWith("P1") || c.startsWith("P3")) return "Engine fault (manufacturer-specific code)";
  if (c.startsWith("C")) return "Chassis fault (brakes, steering, or suspension)";
  if (c.startsWith("B")) return "Body fault (airbags, seatbelts, or interior electronics)";
  if (c.startsWith("U")) return "Communication fault between the car's computers";
  return "Diagnostic trouble code";
}

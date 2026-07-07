export interface MechanicMessageContext {
  issue: string;
  year: string;
  make: string;
  model: string;
  topCause: string;
  firstStep: string;
  costRange: string;
}

export const CODE_NAMES: Record<string, string> = {
  // Fuel and air metering
  P0100: 'mass airflow sensor malfunction',
  P0101: 'mass airflow sensor out of range',
  P0102: 'mass airflow sensor low input',
  P0103: 'mass airflow sensor high input',
  P0110: 'intake air temperature sensor malfunction',
  P0111: 'intake air temperature sensor out of range',
  P0112: 'intake air temperature sensor low input',
  P0113: 'intake air temperature sensor high input',
  P0115: 'engine coolant temperature sensor malfunction',
  P0116: 'coolant temperature sensor out of range',
  P0117: 'coolant temperature sensor low input',
  P0118: 'coolant temperature sensor high input',
  P0120: 'throttle position sensor malfunction',
  P0121: 'throttle position sensor out of range',
  P0122: 'throttle position sensor low input',
  P0123: 'throttle position sensor high input',
  P0125: 'insufficient coolant temp for closed loop fuel control',
  P0128: 'coolant temperature below thermostat range',
  // O2 sensors bank 1
  P0130: 'upstream O2 sensor malfunction (bank 1)',
  P0131: 'upstream O2 sensor low voltage (bank 1)',
  P0132: 'upstream O2 sensor high voltage (bank 1)',
  P0133: 'upstream O2 sensor slow response (bank 1)',
  P0134: 'upstream O2 sensor no activity (bank 1)',
  P0135: 'upstream O2 sensor heater malfunction (bank 1)',
  P0136: 'downstream O2 sensor malfunction (bank 1)',
  P0137: 'downstream O2 sensor low voltage (bank 1)',
  P0138: 'downstream O2 sensor high voltage (bank 1)',
  P0139: 'downstream O2 sensor slow response (bank 1)',
  P0140: 'downstream O2 sensor no activity (bank 1)',
  P0141: 'downstream O2 sensor heater malfunction (bank 1)',
  // O2 sensors bank 2
  P0150: 'upstream O2 sensor malfunction (bank 2)',
  P0151: 'upstream O2 sensor low voltage (bank 2)',
  P0152: 'upstream O2 sensor high voltage (bank 2)',
  P0153: 'upstream O2 sensor slow response (bank 2)',
  P0154: 'upstream O2 sensor no activity (bank 2)',
  P0155: 'upstream O2 sensor heater malfunction (bank 2)',
  P0156: 'downstream O2 sensor malfunction (bank 2)',
  P0157: 'downstream O2 sensor low voltage (bank 2)',
  P0158: 'downstream O2 sensor high voltage (bank 2)',
  P0159: 'downstream O2 sensor slow response (bank 2)',
  P0160: 'downstream O2 sensor no activity (bank 2)',
  P0161: 'downstream O2 sensor heater malfunction (bank 2)',
  // Fuel system
  P0171: 'system running too lean (bank 1)',
  P0172: 'system running too rich (bank 1)',
  P0174: 'system running too lean (bank 2)',
  P0175: 'system running too rich (bank 2)',
  P0190: 'fuel rail pressure sensor malfunction',
  P0191: 'fuel rail pressure sensor out of range',
  P0192: 'fuel rail pressure sensor low input',
  P0193: 'fuel rail pressure sensor high input',
  // Injectors
  P0200: 'fuel injector circuit open',
  P0201: 'fuel injector open — cylinder 1',
  P0202: 'fuel injector open — cylinder 2',
  P0203: 'fuel injector open — cylinder 3',
  P0204: 'fuel injector open — cylinder 4',
  P0205: 'fuel injector open — cylinder 5',
  P0206: 'fuel injector open — cylinder 6',
  P0207: 'fuel injector open — cylinder 7',
  P0208: 'fuel injector open — cylinder 8',
  P0230: 'fuel pump primary circuit malfunction',
  P0231: 'fuel pump secondary circuit low',
  P0232: 'fuel pump secondary circuit high',
  // Misfires
  P0300: 'random misfire across multiple cylinders',
  P0301: 'misfire on cylinder 1',
  P0302: 'misfire on cylinder 2',
  P0303: 'misfire on cylinder 3',
  P0304: 'misfire on cylinder 4',
  P0305: 'misfire on cylinder 5',
  P0306: 'misfire on cylinder 6',
  P0307: 'misfire on cylinder 7',
  P0308: 'misfire on cylinder 8',
  P0316: 'misfire detected on startup',
  // Knock / crank / cam sensors
  P0325: 'knock sensor malfunction (bank 1)',
  P0326: 'knock sensor out of range (bank 1)',
  P0327: 'knock sensor low input (bank 1)',
  P0328: 'knock sensor high input (bank 1)',
  P0330: 'knock sensor malfunction (bank 2)',
  P0335: 'crankshaft position sensor malfunction',
  P0336: 'crankshaft position sensor out of range',
  P0337: 'crankshaft position sensor low input',
  P0338: 'crankshaft position sensor high input',
  P0339: 'crankshaft position sensor intermittent',
  P0340: 'camshaft position sensor malfunction (bank 1)',
  P0341: 'camshaft position sensor out of range',
  P0342: 'camshaft position sensor low input',
  P0343: 'camshaft position sensor high input',
  P0344: 'camshaft position sensor intermittent',
  P0345: 'camshaft position sensor malfunction (bank 2)',
  // Ignition coils
  P0351: 'ignition coil A circuit malfunction',
  P0352: 'ignition coil B circuit malfunction',
  P0353: 'ignition coil C circuit malfunction',
  P0354: 'ignition coil D circuit malfunction',
  P0355: 'ignition coil E circuit malfunction',
  P0356: 'ignition coil F circuit malfunction',
  P0357: 'ignition coil G circuit malfunction',
  P0358: 'ignition coil H circuit malfunction',
  // EGR
  P0400: 'exhaust gas recirculation flow malfunction',
  P0401: 'EGR flow insufficient',
  P0402: 'EGR flow excessive',
  P0403: 'EGR circuit malfunction',
  P0404: 'EGR circuit out of range',
  P0405: 'EGR sensor A circuit low',
  P0406: 'EGR sensor A circuit high',
  // Secondary air
  P0410: 'secondary air injection system malfunction',
  P0411: 'secondary air injection incorrect flow',
  // Catalytic converter
  P0420: 'catalytic converter efficiency below threshold (bank 1)',
  P0421: 'catalytic converter warmup efficiency low (bank 1)',
  P0422: 'catalytic converter main efficiency low (bank 1)',
  P0430: 'catalytic converter efficiency below threshold (bank 2)',
  P0431: 'catalytic converter warmup efficiency low (bank 2)',
  P0432: 'catalytic converter main efficiency low (bank 2)',
  // Evaporative emissions
  P0440: 'evaporative emission system malfunction',
  P0441: 'evap system incorrect purge flow',
  P0442: 'evap system small leak detected',
  P0443: 'evap purge control valve circuit malfunction',
  P0444: 'evap purge control valve circuit open',
  P0445: 'evap purge control valve circuit shorted',
  P0446: 'evap vent control circuit malfunction',
  P0447: 'evap vent control circuit open',
  P0448: 'evap vent control circuit shorted',
  P0449: 'evap vent valve/solenoid circuit malfunction',
  P0450: 'evap pressure sensor malfunction',
  P0451: 'evap pressure sensor out of range',
  P0452: 'evap pressure sensor low input',
  P0453: 'evap pressure sensor high input',
  P0455: 'evap system large leak detected',
  P0456: 'evap system very small leak detected',
  P0460: 'fuel level sensor malfunction',
  P0461: 'fuel level sensor out of range',
  P0462: 'fuel level sensor low input',
  P0463: 'fuel level sensor high input',
  P0480: 'cooling fan 1 control circuit malfunction',
  P0481: 'cooling fan 2 control circuit malfunction',
  // Speed and idle
  P0500: 'vehicle speed sensor malfunction',
  P0501: 'vehicle speed sensor out of range',
  P0502: 'vehicle speed sensor low input',
  P0503: 'vehicle speed sensor intermittent',
  P0505: 'idle air control system malfunction',
  P0506: 'idle speed lower than expected',
  P0507: 'idle speed higher than expected',
  // Oil pressure
  P0520: 'engine oil pressure sensor malfunction',
  P0521: 'engine oil pressure sensor out of range',
  P0522: 'engine oil pressure sensor low input',
  P0523: 'engine oil pressure sensor high input',
  P0524: 'engine oil pressure too low',
  // Electrical / computer
  P0560: 'system voltage malfunction',
  P0561: 'system voltage unstable',
  P0562: 'system voltage low',
  P0563: 'system voltage high',
  P0600: 'serial communication link malfunction',
  P0601: 'control module memory checksum error',
  P0602: 'control module programming error',
  P0603: 'control module keep alive memory error',
  P0604: 'control module RAM error',
  P0605: 'control module ROM error',
  P0606: 'PCM processor fault',
  P0620: 'generator control circuit malfunction',
  P0640: 'intake air heater control circuit',
  P0641: 'sensor reference voltage A circuit open',
  P0642: 'sensor reference voltage A circuit low',
  P0643: 'sensor reference voltage A circuit high',
  P0645: 'A/C clutch relay circuit malfunction',
  P0650: 'check engine light control circuit malfunction',
  P0685: 'ECM power relay circuit open',
  // Transmission
  P0700: 'transmission control system malfunction',
  P0701: 'transmission control system out of range',
  P0702: 'transmission control system electrical fault',
  P0703: 'brake switch B circuit malfunction',
  P0704: 'clutch switch input circuit malfunction',
  P0705: 'transmission range sensor malfunction',
  P0706: 'transmission range sensor out of range',
  P0710: 'transmission fluid temperature sensor malfunction',
  P0711: 'transmission fluid temperature sensor out of range',
  P0712: 'transmission fluid temperature sensor low input',
  P0713: 'transmission fluid temperature sensor high input',
  P0715: 'transmission input speed sensor malfunction',
  P0720: 'transmission output speed sensor malfunction',
  P0730: 'incorrect gear ratio detected',
  P0731: 'gear 1 incorrect ratio',
  P0732: 'gear 2 incorrect ratio',
  P0733: 'gear 3 incorrect ratio',
  P0734: 'gear 4 incorrect ratio',
  P0735: 'gear 5 incorrect ratio',
  P0740: 'torque converter clutch circuit malfunction',
  P0741: 'torque converter clutch stuck off',
  P0742: 'torque converter clutch stuck on',
  P0745: 'transmission pressure control solenoid malfunction',
  P0750: 'shift solenoid A malfunction',
  P0755: 'shift solenoid B malfunction',
  P0760: 'shift solenoid C malfunction',
  P0765: 'shift solenoid D malfunction',
  P0770: 'shift solenoid E malfunction',
  P0780: 'transmission shift malfunction',
  P0781: '1-2 shift malfunction',
  P0782: '2-3 shift malfunction',
  P0783: '3-4 shift malfunction',
  P0784: '4-5 shift malfunction',
  // Network / communication
  U0001: 'high speed CAN communication bus fault',
  U0100: 'lost communication with engine computer (ECM)',
  U0101: 'lost communication with transmission computer (TCM)',
  U0121: 'lost communication with ABS control module',
  U0140: 'lost communication with body control module',
  U0155: 'lost communication with instrument cluster',
  U0167: 'lost communication with immobilizer module',
  // ABS / chassis
  C0031: 'right front wheel speed sensor circuit fault',
  C0034: 'right rear wheel speed sensor circuit fault',
  C0035: 'left front wheel speed sensor fault',
  C0040: 'right front wheel speed sensor malfunction',
  C0045: 'left rear wheel speed sensor malfunction',
  C0050: 'right rear wheel speed sensor malfunction',
  C0055: 'left rear wheel speed sensor malfunction',
  C0110: 'ABS pump motor circuit malfunction',
  C0121: 'ABS valve relay circuit malfunction',
  C0131: 'ABS pressure differential switch malfunction',
  C0161: 'ABS control circuit malfunction',
  C0186: 'lateral accelerometer circuit malfunction',
  C0196: 'yaw rate sensor circuit malfunction',
  C0245: 'wheel speed sensor frequency error',
  C0450: 'power steering actuator circuit malfunction',
  C0460: 'steering position sensor circuit malfunction',
  C0561: 'ATC system disabled',
  // Body
  B1317: 'battery voltage high',
  B1318: 'battery voltage low',
  B1342: 'ECU hardware fault',
  B1352: 'ignition key-in circuit failure',
  B1385: 'oil pressure switch circuit failure',
};

export function isOBDCode(input: string): boolean {
  return /^[PCBU][0-9]{4}/i.test(input.trim());
}

export function extractCode(input: string): string {
  const match = input.trim().match(/^([PCBU][0-9]{4})/i);
  return match ? match[1].toUpperCase() : input;
}

export function formatCode(code: string): string {
  const upper = extractCode(code);
  const name = CODE_NAMES[upper];
  return name ? `${upper} — ${name}` : upper;
}

/** Lowercase the first letter unless it starts with a fault code or acronym. */
function lcFirst(s: string): string {
  const t = s.trim();
  if (!t) return t;
  if (/^[A-Z]{2,}/.test(t) || isOBDCode(t)) return t; // "EGR...", "P0301..."
  return t.charAt(0).toLowerCase() + t.slice(1);
}

/**
 * Turn whatever lives in the issue field — a typed sentence, a 4000-char
 * saga, or the OBD scanner's multi-line code dump — into one short clause
 * that fits mid-sentence: "showing a P0301 (misfire on cylinder 1)" or
 * "making a grinding noise when braking".
 */
export function summarizeIssue(raw: string): string {
  const flat = raw.replace(/\s+/g, " ").trim();
  const codes = [...new Set((flat.match(/\b[PCBU][0-9]{4}\b/gi) ?? []).map((c) => c.toUpperCase()))];

  if (codes.length > 0) {
    const first = codes[0];
    const name = CODE_NAMES[first]?.replace(/\s*\(bank \d\)$/, "");
    const label = name ? `${first} (${name})` : first;
    return codes.length > 1
      ? `showing ${label} plus ${codes.length - 1} more fault code${codes.length > 2 ? "s" : ""}`
      : `showing a ${label} fault code`;
  }

  // First clause of the description, trimmed to something sayable.
  let clause = flat.split(/[.;\n]/)[0].trim();
  const parts = clause.split(",");
  if (clause.length > 90 && parts[0].length >= 15) clause = parts[0].trim();
  if (clause.length > 90) clause = clause.slice(0, 87).replace(/\s+\S*$/, "") + "…";
  return `having an issue — ${lcFirst(clause).replace(/[.!?]+$/, "")}`;
}

export function buildTextMessage(ctx: MechanicMessageContext): string {
  const { issue, year, make, model, topCause, costRange } = ctx;
  return `Hey, looking to bring my ${year} ${make} ${model} in — it's ${summarizeIssue(issue)}. From what I've read it might be ${lcFirst(topCause)}. Could you take a look and let me know what you'd charge if that's it? I've seen fair estimates around ${costRange}. Thanks`;
}

export function buildEmailMessage(ctx: MechanicMessageContext): { subject: string; body: string } {
  const { issue, year, make, model, topCause, firstStep, costRange } = ctx;
  const subject = `Service inquiry — ${year} ${make} ${model}`;
  const body = `Hi,

I'm hoping to bring my ${year} ${make} ${model} in for a look. It's ${summarizeIssue(issue)}.

From some research, ${lcFirst(topCause)} looks like the most likely cause — I'd appreciate your take once you've had a chance to check it properly. I've also read it's worth ${lcFirst(firstStep).replace(/[.!?]+$/, "")} first, though I'm happy to follow your lead.

Could you give me a rough sense of pricing if that's the issue? I've seen estimates around ${costRange}, but I know it varies.

Thanks`;
  return { subject, body };
}

export function buildWalkInScript(ctx: MechanicMessageContext): string {
  const { issue, year, make, model, topCause, firstStep, costRange } = ctx;
  return `When you get there, say:
• "I have a ${year} ${make} ${model} — it's ${summarizeIssue(issue)}."
• "From what I've read it might be ${lcFirst(topCause)} — does that sound right to you?"

Ask:
• "What would you charge if that's the issue?"
• "Is it worth ${lcFirst(firstStep).replace(/[.!?]+$/, "")} first, before replacing anything?"

Fair price to keep in mind: ${costRange}`;
}

# App Store Connect listing — copy-paste pack

Everything below is ready to paste into App Store Connect. Character limits
are noted where Apple enforces them.

## App information

| Field | Value |
|---|---|
| Name (30 chars max) | `Mechanic Carlos` |
| Subtitle (30 chars max) | `AI car diagnosis + OBD2 scan` |
| Bundle ID | `com.mechaniccarlos.app` |
| SKU | `mechanic-carlos-ios` |
| Primary category | Utilities |
| Secondary category | Lifestyle |
| Age rating | 4+ (no objectionable content; questionnaire: all "No") |
| Price | Free (IAP added later via RevenueCat — see APP_STORE.md) |

## Promotional text (170 chars max, editable without review)

> Check engine light on? Scan the code with a Bluetooth OBD2 adapter and let
> Carlos explain what it means, what it costs, and whether the quote is fair.

## Description (4000 chars max)

```
Your check engine light doesn't have to be a mystery — or an excuse for an
inflated repair bill.

Mechanic Carlos is an AI-powered car diagnosis assistant. Describe the
problem in plain English, snap a photo of the dashboard light, or plug a
Bluetooth OBD2 adapter into your car and read the trouble codes directly.
Carlos tells you what's wrong, how urgent it is, what parts and labor should
cost, and what to say at the shop so you don't get taken for a ride.

WHAT CARLOS DOES

• OBD2 SCANNER — Connect a Bluetooth LE OBD2 adapter (Veepeak, Vgate, OBDLink
  and more) and read stored + pending trouble codes, live engine data, freeze
  frames, and your VIN. One tap sends the codes straight into a diagnosis.

• AI DIAGNOSIS — Describe symptoms by text, voice, or photo. Carlos analyzes
  the evidence and returns likely causes ranked by probability, severity
  ("drive with caution" vs "stop driving now"), estimated repair costs for
  your area, and step-by-step checks you can do yourself.

• QUOTE CHECKER — Photograph or paste a repair estimate. Carlos flags
  what's fair, what's inflated, and what's a red flag, line by line.

• GARAGE — Save your cars, keep diagnosis history, track what you fixed
  and what it cost. VIN decoding fills in the details automatically.

• MAINTENANCE — Reminders for oil, brakes, tires, and factory service
  intervals tailored to your car.

BUILT FOR REAL CAR PROBLEMS

Carlos speaks plain English, not shop jargon. Every diagnosis explains the
"why" behind the answer and includes a printable summary you can hand to
your mechanic — or use to get a second opinion.

Works with any gas car sold in the US after 1996 (OBD2 standard).
Bluetooth scanning requires a BLE OBD2 adapter (about $25–$80 — the app
recommends tested models).

Carlos is an AI assistant powered by Claude. Diagnoses are for informational
purposes only — always confirm with a professional mechanic before major
repairs.
```

## Keywords (100 chars max, comma-separated, no spaces)

```
obd2,check engine,car diagnostic,code reader,mechanic,repair cost,scanner,dtc,car,auto,quote,vin
```

## URLs

| Field | Value |
|---|---|
| Support URL | `https://mchaniccarlos.com/terms` (or a /support page if added) |
| Marketing URL | `https://mchaniccarlos.com` |
| Privacy Policy URL | `https://mchaniccarlos.com/privacy` |

## Screenshots (required sizes)

Take on iPhone 16 Pro Max simulator (6.9", 1320×2868) and iPhone 8 Plus-class
(5.5", 1242×2208) or let Connect scale from the 6.9" set. Suggested shots,
in order (first two matter most for conversion):

1. Diagnosis result — the report card for a P0301 misfire (severity badge,
   causes, cost range visible)
2. OBD2 scanner connected — trouble codes list with live data
3. Diagnose form — "Is your car acting up?" with photo/voice input visible
4. Quote checker verdict — "over market" flags on a brake quote
5. Garage — a saved car with history

No device frames required; use the real dark UI on full-bleed background.

## App Review notes (paste into "Notes" in the review information section)

```
Mechanic Carlos is an AI car-diagnosis assistant (AI disclosure is shown in
onboarding and on every result).

DEMO ACCOUNT: [create in Supabase before submission and fill in]
  email: review@mchaniccarlos.com
  password: [set one]

OBD2 SCANNER: the Bluetooth scanner feature requires a physical BLE OBD2
adapter plugged into a car. Without hardware, tapping "Connect OBD2 Scanner"
shows the connection screen and adapter recommendations — all other features
(diagnosis, quote checker, garage) work without hardware.

PAYMENTS: there are no digital purchases in this build. Subscriptions exist
on the website only; the app never shows or links to external checkout
(gated by canShowWebCheckout() in the code).

Sign in with Apple and Google are both offered. Email/password also works.
```

## App Privacy (nutrition label) answers

Already documented in APP_STORE.md — enter the table there verbatim. The
shipped PrivacyInfo.xcprivacy matches it.

## Reviewer-bait checklist (why this is not a "thin wrapper" per 4.2)

If Review pushes back with guideline 4.2 minimum functionality, reply that
the app integrates on-device hardware and OS capabilities a website cannot:
CoreBluetooth OBD2 scanning (@capacitor-community/bluetooth-le), native
camera capture, haptic feedback, system-browser auth, offline error
handling, keyboard/safe-area handling, and Sign in with Apple.

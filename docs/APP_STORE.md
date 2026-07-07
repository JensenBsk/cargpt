# App Store / Play Store Readiness

Native shell built with Capacitor (`ios/`, `android/`). The WebView loads
`https://mchaniccarlos.com` (see `capacitor.config.ts`), so API routes and SSR
keep working. `lib/native.ts` bridges Haptics/platform detection and no-ops on web.

Listing copy, keywords, screenshots plan, and review notes: **docs/APP_STORE_LISTING.md**.

## Status (updated 2026-07-06)

Done in code — nothing else needed before archiving:

- ✅ **OBD2 over native Bluetooth** — `lib/obd/elm327.ts` now runs on
  `@capacitor-community/bluetooth-le` (CoreBluetooth/Android BLE natively,
  Web Bluetooth on web). This is the guideline-4.2 justification feature.
- ✅ **Native OAuth** — Google/Apple login opens the system browser sheet
  (Google blocks WebViews) and returns via deep link
  `com.mechaniccarlos.app://auth-callback` (registered in Info.plist +
  AndroidManifest; PKCE code exchanged in the WebView).
- ✅ **Sign in with Apple** (guideline 4.8) — shown in the native shell,
  above Google. Requires the Supabase Apple provider (manual step 3 below).
- ✅ **Privacy manifest** — `ios/App/App/PrivacyInfo.xcprivacy`, registered
  in the Xcode project, matches the nutrition label below.
- ✅ **Offline fallback** — `server.errorPath` shows a branded retry page.
- ✅ Versions set: `MARKETING_VERSION 1.0.0`, build 1.
- ✅ Usage descriptions, `ITSAppUsesNonExemptEncryption=false`, `arm64`,
  splash/icons, safe areas, keyboard handling, Stripe hidden natively.

## Build commands

```bash
npx cap sync              # after changing capacitor.config.ts or plugins
npx cap open ios          # opens Xcode (requires Xcode + CocoaPods installed)
npx cap open android      # opens Android Studio
```

Icons and splash screens were generated from `assets/` via `npx @capacitor/assets generate`
(all iOS sizes from the 1024 base, Android adaptive icons, dark splash `#060810`).

## Identifiers & versions

- Bundle ID / applicationId: `com.mechaniccarlos.app`
- Display name: **Mechanic Carlos**
- iOS: set `MARKETING_VERSION` (e.g. 1.0.0) and `CURRENT_PROJECT_VERSION` (build number)
  in Xcode → App target → General. Bump build number on every TestFlight upload.
- Android: `versionName` / `versionCode` in `android/app/build.gradle`.

## Manual steps you must do (cannot be automated)

0. **Install Xcode** (Mac App Store) — this machine only has command-line
   tools. Then: `npx cap open ios`, select your signing team, archive.
1. **Apple Developer account**: create the App ID `com.mechaniccarlos.app` with the
   Associated Domains capability; create the app record in App Store Connect.
2. **Supabase dashboard → Auth → URL Configuration**: add
   `com.mechaniccarlos.app://auth-callback` to the Redirect URLs allowlist
   (native OAuth breaks without it).
3. **Supabase dashboard → Auth → Providers → Apple**: enable it. Needs an
   Apple **Services ID** + key from developer.apple.com (Certificates →
   Identifiers → Services IDs; enable "Sign in with Apple", set the Supabase
   callback URL). The button only renders inside the native app, so web is
   unaffected until this is done.
4. **Demo account for App Review**: create `review@mchaniccarlos.com` in
   Supabase Auth and put the password in the review notes
   (see APP_STORE_LISTING.md).
5. **Universal Links**: replace `TEAMID` in `public/.well-known/apple-app-site-association`
   with your real Team ID, deploy, then enable Associated Domains in Xcode
   (the entitlement file `ios/App/App/App.entitlements` is ready — add it to the
   target under Signing & Capabilities if Xcode didn't pick it up).
6. **Android App Links**: after you create a release keystore, run
   `keytool -list -v -keystore <keystore>` and paste the SHA-256 fingerprint into
   `public/.well-known/assetlinks.json`, then redeploy.
7. **RevenueCat** (see below) — only when you're ready to sell subscriptions
   in-app; v1.0 ships free (no purchase UI in the native shell), which is
   fully submittable. (No CocoaPods needed — the project uses Swift Package
   Manager via `CapApp-SPM`.)

## Privacy nutrition label (App Store Connect → App Privacy)

Data collected, all **linked to identity** for signed-in users (Supabase account):

| Data type | Purpose | Linked | Tracking |
|---|---|---|---|
| Email address | Account (Supabase auth / Google OAuth) | Yes | No |
| User content: car issue text, photos (dashboard/engine bay/quote), audio transcriptions | App functionality (sent to Anthropic Claude for analysis) | Yes (if signed in) | No |
| Vehicle info: year/make/model/VIN/mods | App functionality (garage, diagnosis) | Yes (if signed in) | No |
| Coarse location: user-typed ZIP code | App functionality (labor-rate estimates, shop search) | Yes (if signed in) | No |
| Purchase history: subscription tier | App functionality (Stripe/RevenueCat) | Yes | No |
| Product interaction: page analytics (Vercel Analytics, aggregate) | Analytics | No | No |

**Tracking (ATT)**: No cross-app tracking, no ad SDKs, no fingerprinting → the App
Tracking Transparency prompt is **not required**. Vercel Analytics is first-party and
cookieless. If you ever add Meta/Google ad SDKs, this changes.

**Third parties receiving data**: Anthropic (diagnosis text/photos/audio transcripts),
Supabase (auth + database), Stripe (web payments), Vercel (hosting/analytics),
OneSignal (push, if enabled), Google Places (ZIP → shop search).

## AI disclosure

- Onboarding now ends with a mandatory "Carlos is an AI powered by Claude" card —
  Skip lands on it, it cannot be bypassed (`components/OnboardingCarousel.tsx`).
- Every diagnosis result renders a persistent informational-purposes disclaimer
  (`components/DiagnosticReport.tsx`).

## In-app purchases (RevenueCat) — implementation plan

Apple rejects native apps that sell digital subscriptions via external checkout
(guideline 3.1.1). Current state: the pricing page **hides Stripe checkout inside
the native shell** (`canShowWebCheckout()` in `lib/native.ts`) so the app is
submittable, with native users on the free tier until IAP ships.

To ship native purchases:

1. Create subscription products in App Store Connect + Play Console
   (`carlos_pro_monthly_699`, `carlos_pro_annual`, enthusiast variants).
2. `npm i @revenuecat/purchases-capacitor`, configure with the RevenueCat public
   API key at app start (only when `isNativeApp()`).
3. Entitlements: `pro`, `enthusiast` in RevenueCat mapped to those products.
4. Backend: RevenueCat webhook → new API route `/api/revenuecat/webhook` that
   updates `users.subscription_tier` (same field Stripe webhook writes) keyed by
   Supabase user id passed as RevenueCat `appUserID`.
5. Pricing page: when `isNativeApp()`, call `Purchases.purchasePackage(...)`
   instead of Stripe redirect.
6. Keep Stripe checkout for web — Apple allows different prices/rails on web.

## WebView-specific QA before submission

Test on a real device (fixed bottom button + keyboard):
- Diagnose form: keyboard must not cover the submit button (Keyboard plugin is
  configured `resize: "body"`).
- Safe-area insets: bottom nav uses `env(safe-area-inset-bottom)` already.
- Status bar: dark style is configured via the StatusBar plugin.
- Offline: WebView with remote URL shows a blank screen without network — the
  placeholder shell (`public/native-shell/index.html`) is only shown briefly;
  consider a Capacitor offline fallback page before submission.

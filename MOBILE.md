# Habesha Community — Mobile App (Android via Capacitor)

The mobile app is the **same React app** wrapped in a native shell with
[Capacitor](https://capacitorjs.com/). There is **no separate codebase** and
**no backend/database change** — the app calls the same Render API and Supabase
database as the website.

- App ID: `com.habesha.community`
- App name: `Habesha Community`
- Web assets: built into `build/` and bundled into the native app
- API: `REACT_APP_API_URL` from `.env.production` (Render backend)

---

## One-time setup

1. Install **Android Studio** (latest). It bundles the JDK and Android SDK you
   need — you don't have to install Java separately.
2. From `habesha_community_frontend/`, dependencies are already in `package.json`
   (`@capacitor/*`). Run `npm install` if you haven't.

## Build & run on a phone/emulator

```bash
# 1. Build the web app
npm run build

# 2. Copy the web build + plugins into the native project
npx cap sync android

# 3. Open the Android project in Android Studio
npx cap open android
```

In Android Studio: pick a device (USB phone with USB-debugging, or an emulator)
and press **Run ▶**. Repeat steps 1–2 whenever you change the web app, then
**Run** again.

> Tip: `npx cap run android` can build + launch from the command line once a
> device/emulator is connected.

## Release build for the Play Store

1. In Android Studio: **Build → Generate Signed Bundle / APK → Android App Bundle (.aab)**.
2. Create a **keystore** the first time and **keep it safe** — you need the same
   key for every future update. (Keystores are git-ignored on purpose.)
3. Upload the resulting `.aab` to the Google Play Console.

Play Console one-time needs: a developer account ($25 one-off), a privacy
policy URL, store screenshots, and a content rating questionnaire.

## App icon & splash screen

The launcher currently uses Capacitor's default icons. To brand it with the
Habesha icon (`public/icons/app-icon.svg`):

```bash
# Provide a 1024x1024 PNG at resources/icon.png and resources/splash.png, then:
npm install -D @capacitor/assets
npx @capacitor/assets generate --android
```

## CORS / backend

No backend change is required to run the app — `SecurityConfig` already allows
the Capacitor webview origins (`https://localhost`, `capacitor://localhost`).
The app authenticates with the same JWT flow as the website.

## What's committed vs generated

- **Committed:** `capacitor.config.json`, `src/capacitor/initNative.js`, and the
  `android/` project (once created with `npx cap add android`).
- **Git-ignored (generated):** `android/build/`, `android/app/build/`,
  `android/.gradle/`, `android/local.properties`, and any `*.keystore` / `*.jks`.

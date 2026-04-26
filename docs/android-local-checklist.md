# ShowReady Android Local Checklist

Use this when building or testing the Expo Android development app from this workspace.

## Current Android app setup

- Expo Android package: `com.showready.mobile`
- Deep link scheme: `showready://auth/callback`
- Android adaptive icon is configured from `apps/agent-mobile/assets/adaptive-icon.png`.
- EAS development and preview builds produce APKs for direct install.
- EAS production builds produce an Android App Bundle for Google Play.

## Local toolchain

Check what this machine can see:

```bash
corepack pnpm --filter @showready/agent-mobile android:doctor
```

This repo has helper scripts that export the Android SDK and JDK paths for child commands. If you want the same setup in your shell, use:

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export JAVA_HOME="/opt/homebrew/opt/openjdk@17"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
```

The detected local AVD is currently:

```text
Medium_Phone_API_36.1
```

## Run the Android development build

Start the web API:

```bash
corepack pnpm --filter @showready/intake-web dev
```

Start an emulator in a separate terminal:

```bash
corepack pnpm --filter @showready/agent-mobile android:emulator
```

Install or refresh the Android development build:

```bash
corepack pnpm --filter @showready/agent-mobile android
```

Start Metro in dev-client mode:

```bash
corepack pnpm --filter @showready/agent-mobile dev
```

Keep `EXPO_PUBLIC_API_BASE_URL=http://localhost:3000` for normal local dev. The mobile app resolves localhost to the Expo host for device and emulator testing. If an Android emulator cannot reach the API, use `EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000` as the emulator-specific fallback.

## Android EAS builds

Development APK:

```bash
corepack pnpm --filter @showready/agent-mobile build:android:development
```

Internal preview APK:

```bash
corepack pnpm --filter @showready/agent-mobile build:android:preview
```

Google Play production AAB:

```bash
corepack pnpm --filter @showready/agent-mobile build:android:production
```

## Android Maestro smoke run

After the development build is installed and Metro is running:

```bash
corepack pnpm --filter @showready/agent-mobile seed:maestro
AUTH_CALLBACK_URL="$(APP_URL=showready://auth/callback corepack pnpm --filter @showready/agent-mobile maestro:auth-url)" \
APP_ID=com.showready.mobile \
maestro test apps/agent-mobile/.maestro/smoke-android.yaml
```

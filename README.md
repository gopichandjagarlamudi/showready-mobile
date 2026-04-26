# ShowReady Native Rebuild

Standalone monorepo for the ShowReady native agent app and public intake web experience.

## Mobile auth workflow

The mobile app supports:

- email/password
- Google OAuth
- Apple sign-in on iOS

For the native auth flows, use a development build or standalone app instead of relying on Expo Go for final verification.

The app id is `com.showready.mobile` on both iOS and Android. Android local helpers are available from the mobile package:

```bash
corepack pnpm --filter @showready/agent-mobile android:doctor
corepack pnpm --filter @showready/agent-mobile android:emulator
```

Use:

```bash
corepack pnpm --filter @showready/agent-mobile ios
```

or:

```bash
corepack pnpm --filter @showready/agent-mobile android
```

Then start Metro in dev-client mode:

```bash
corepack pnpm --filter @showready/agent-mobile dev
```

If you still need the old Expo Go sandbox for non-auth UI checks, use:

```bash
corepack pnpm --filter @showready/agent-mobile dev:go
```

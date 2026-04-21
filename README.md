# ShowReady Native Rebuild

Standalone monorepo for the ShowReady native agent app and public intake web experience.

## Mobile auth workflow

Google OAuth on the mobile app is set up for a development build or standalone app, not Expo Go.

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

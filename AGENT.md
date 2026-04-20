# ShowReady Test Routes

Use the known-good local routes and entrypoints for every verification pass in this workspace.

## Web

- Start the web surface with `corepack pnpm --filter @showready/intake-web dev`.
- Use `http://localhost:3000` for browser tests and Playwright.
- Do not switch Playwright to `127.0.0.1`; the current Next dev setup is stable on `localhost`.

## Mobile

- Start Metro with `corepack pnpm --filter @showready/agent-mobile dev`.
- Open Expo Go through the active Metro URL, not `expo run:ios`.
- The current working Expo deep link is `exp://192.168.5.13:8081`.
- If the LAN IP changes, replace only the host portion and keep the same `exp://<host>:8081` shape.
- Keep `EXPO_PUBLIC_API_BASE_URL` on `http://localhost:3000` for local dev; the mobile app now rewrites `localhost` to the active Expo LAN host inside Expo Go so phones can still reach the Next server.
- Use Expo Go bundle ids for Maestro:
  - iOS: `host.exp.Exponent`
  - Android: `host.exp.exponent`
- Prefix iOS simulator and Maestro commands with `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`.

## Maestro

- Reseed the live demo state before authenticated mobile runs with `corepack pnpm --filter @showready/agent-mobile seed:maestro`.
- Generate a real Supabase-backed auth callback URL for Maestro with:
  - `APP_URL=exp://192.168.5.13:8081 corepack pnpm --filter @showready/agent-mobile maestro:auth-url`
- The mobile app now has a concrete Expo Router callback route at `/auth/callback`, so authenticated deep-link runs should use:
  - `exp://192.168.5.13:8081/--/auth/callback?...`
- The demo credentials used by the authenticated flows are:
  - `demo@showready.local`
  - `demo12345`
- Android and iOS device automation are still sensitive to Expo Go handoff timing. If a Maestro run stalls before app content appears, restart Metro on `8081` and re-open the callback or app deep link rather than switching routes.
- Use the seeded lead ids when you need stable selectors in Maestro:
  - Review lead: `e357e934-6f9a-4d75-bf12-8db0cd1bf701`
  - Appointment lead: `bd30eb53-5bc1-460d-95a2-13c2f7c5e2bb`
  - Detail lead: `da26711a-69dd-4ce2-ab48-8efcf9811f14`

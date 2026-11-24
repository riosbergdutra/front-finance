# Frontend deployment

## Production build

```bash
npm ci
npm run build:prod
```

The Angular production bundle is environment-independent: API endpoints are read
from `runtime-config.js` at browser startup instead of embedding a domain in the
compiled JavaScript.

## Runtime API configuration

The default configuration uses the same origin as the frontend:

- HTTP API: `https://<frontend-host>`
- Notifications WebSocket: `wss://<frontend-host>/ws/notifications`

The reverse proxy must route the backend's API paths (including `/auth` and
`/ws/notifications`) to the backend service. This keeps the session cookie
first-party and avoids requiring a cross-origin browser session.

If the API is hosted on a different origin, edit the deployed
`runtime-config.js` file (without rebuilding the Angular bundle):

```javascript
window.__FINANCEFLOW_CONFIG__ = {
  apiUrl: 'https://api.example.com',
  wsUrl: 'wss://api.example.com/ws/notifications',
};
```

Use the actual HTTPS API host configured for the environment. Configure the
backend CORS allowlist and cookie policy for the frontend origin before enabling
cross-origin requests. Do not use wildcard CORS origins with credentials.

## Operational requirements

- Serve `runtime-config.js` with revalidation/no-cache headers so endpoint
  changes are not hidden by a stale browser or CDN cache.
- Keep the frontend and API on HTTPS in production; the WebSocket endpoint must
  use WSS.
- Do not put API keys, client secrets, access tokens, refresh tokens, or other
  credentials in frontend configuration. Browser-delivered values are public.
- Validate login, callback, CSRF, refresh, logout and WebSocket session behavior
  against the real staging identity provider before production release.

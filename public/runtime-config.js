/*
 * Runtime configuration for the deployed frontend.
 *
 * Default: same-origin API and WebSocket endpoints behind the reverse proxy.
 * For a separate API host, set apiUrl and wsUrl here before serving the app.
 * Never place credentials, OAuth tokens or secrets in this file.
 */
window.__FINANCEFLOW_CONFIG__ = window.__FINANCEFLOW_CONFIG__ || {};

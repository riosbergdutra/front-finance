declare global {
  interface Window {
    __FINANCEFLOW_CONFIG__?: {
      apiUrl?: string;
      wsUrl?: string;
    };
  }
}

const configuredApiUrl = window.__FINANCEFLOW_CONFIG__?.apiUrl?.trim();
const apiUrl = (configuredApiUrl || window.location.origin).replace(/\/+$/, '');
const apiOrigin = new URL(apiUrl, window.location.origin);
const configuredWsUrl = window.__FINANCEFLOW_CONFIG__?.wsUrl?.trim();
const wsProtocol = apiOrigin.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = (configuredWsUrl
  || `${wsProtocol}//${apiOrigin.host}/ws/notifications`).replace(/\/+$/, '');

export const environment = {
  production: true,
  apiUrl,
  wsUrl,
};

const BACKEND_PORT = process.env.REACT_APP_BACKEND_PORT || '5000';

const getBackendHost = () => {
  if (process.env.REACT_APP_BACKEND_HOST) {
    return process.env.REACT_APP_BACKEND_HOST;
  }

  if (typeof window !== 'undefined' && window.location.hostname) {
    return window.location.hostname;
  }

  return 'localhost';
};

const getHttpProtocol = () => {
  if (process.env.REACT_APP_API_PROTOCOL) {
    return process.env.REACT_APP_API_PROTOCOL;
  }

  return typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? 'https'
    : 'http';
};

const getWsProtocol = () => {
  if (process.env.REACT_APP_WS_PROTOCOL) {
    return process.env.REACT_APP_WS_PROTOCOL;
  }

  return typeof window !== 'undefined' && window.location.protocol === 'https:'
    ? 'wss'
    : 'ws';
};

export const API_BASE =
  process.env.REACT_APP_API_URL ||
  `${getHttpProtocol()}://${getBackendHost()}:${BACKEND_PORT}/api`;

export const WS_URL =
  process.env.REACT_APP_WS_URL ||
  `${getWsProtocol()}://${getBackendHost()}:${BACKEND_PORT}`;

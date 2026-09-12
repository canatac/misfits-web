/**
 * PWA Offline Status Banner (Connectivity Indicator)
 *
 * Monitors browser connectivity and shows a banner when:
 * - User goes offline
 * - Connection is slow/unstable
 * - Connection is restored
 */

export type ConnectivityStatus = 'online' | 'offline' | 'slow' | 'restored';

export interface ConnectivityState {
  status: ConnectivityStatus;
  wasOffline: boolean;
  timestamp: number;
}

type Listener = (state: ConnectivityState) => void;

const listeners = new Set<Listener>();

let currentState: ConnectivityState = {
  status: 'online',
  wasOffline: false,
  timestamp: Date.now(),
};

/**
 * Get current connectivity state
 */
export function getConnectivityState(): ConnectivityState {
  return { ...currentState };
}

/**
 * Check if user is currently offline
 */
export function isOffline(): boolean {
  return currentState.status === 'offline';
}

/**
 * Check if user was previously offline (for "restored" detection)
 */
export function wasOffline(): boolean {
  return currentState.wasOffline;
}

/**
 * Subscribe to connectivity changes
 */
export function onConnectivityChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Update connectivity status (called by network event handlers)
 */
export function updateConnectivity(status: ConnectivityStatus): void {
  const prevStatus = currentState.status;

  if (status === 'online' && prevStatus === 'offline') {
    currentState = {
      status: 'restored',
      wasOffline: true,
      timestamp: Date.now(),
    };
  } else {
    currentState = {
      status,
      wasOffline: currentState.wasOffline || status === 'offline',
      timestamp: Date.now(),
    };
  }

  notifyListeners();
}

/**
 * Reset offline tracking (e.g., after user explicitly refreshes)
 */
export function resetOfflineState(): void {
  currentState = {
    status: 'online',
    wasOffline: false,
    timestamp: Date.now(),
  };
  notifyListeners();
}

/**
 * Initialize connectivity listeners (for client-side use)
 * Sets up online/offline event listeners and connection monitoring
 */
export function initConnectivityMonitoring(): () => void {
  const handleOnline = () => updateConnectivity('online');
  const handleOffline = () => updateConnectivity('offline');

  // Use Network Information API for slow connection detection
  const nav = navigator as Navigator & {
    connection?: { effectiveType: string; addEventListener: (e: string, cb: () => void) => void };
  };

  const handleConnectionChange = () => {
    const connection = nav.connection;
    if (connection?.effectiveType === '2g' || connection?.effectiveType === 'slow-2g') {
      updateConnectivity('slow');
    }
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  nav.connection?.addEventListener('change', handleConnectionChange);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    // Note: connection.removeEventListener not broadly supported
  };
}

/**
 * Get display message for current state
 */
export function getBannerMessage(state: ConnectivityState = currentState): string {
  switch (state.status) {
    case 'offline':
      return 'You are offline. Some features may be unavailable.';
    case 'slow':
      return 'Connection is slow. Loading may take longer than usual.';
    case 'restored':
      return 'Connection restored! Syncing changes...';
    default:
      return '';
  }
}

/**
 * Get banner severity class for styling
 */
export function getBannerSeverity(state: ConnectivityState = currentState): 'warning' | 'error' | 'success' | 'none' {
  switch (state.status) {
    case 'offline':
      return 'error';
    case 'slow':
      return 'warning';
    case 'restored':
      return 'success';
    default:
      return 'none';
  }
}

function notifyListeners(): void {
  for (const listener of listeners) {
    listener({ ...currentState });
  }
}

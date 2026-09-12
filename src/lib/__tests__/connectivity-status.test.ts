import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getConnectivityState,
  isOffline,
  wasOffline,
  updateConnectivity,
  resetOfflineState,
  onConnectivityChange,
  getBannerMessage,
  getBannerSeverity,
} from '../connectivity-status';

describe('connectivity-status', () => {
  beforeEach(() => {
    resetOfflineState();
  });

  describe('updateConnectivity', () => {
    it('updates status to offline', () => {
      updateConnectivity('offline');
      expect(getConnectivityState().status).toBe('offline');
    });

    it('updates status to slow', () => {
      updateConnectivity('slow');
      expect(getConnectivityState().status).toBe('slow');
    });

    it('sets wasOffline flag when going offline', () => {
      updateConnectivity('offline');
      expect(wasOffline()).toBe(true);
    });

    it('sets status to restored when coming back from offline', () => {
      updateConnectivity('offline');
      updateConnectivity('online');
      expect(getConnectivityState().status).toBe('restored');
    });

    it('does not set restored when going online from slow', () => {
      updateConnectivity('slow');
      updateConnectivity('online');
      expect(getConnectivityState().status).toBe('online');
    });

    it('updates timestamp on each change', () => {
      const before = getConnectivityState().timestamp;
      vi.useFakeTimers();
      vi.advanceTimersByTime(1000);
      updateConnectivity('offline');
      const after = getConnectivityState().timestamp;
      expect(after).toBeGreaterThan(before);
      vi.useRealTimers();
    });
  });

  describe('isOffline', () => {
    it('returns false when online', () => {
      expect(isOffline()).toBe(false);
    });

    it('returns true when offline', () => {
      updateConnectivity('offline');
      expect(isOffline()).toBe(true);
    });
  });

  describe('wasOffline', () => {
    it('returns false initially', () => {
      expect(wasOffline()).toBe(false);
    });

    it('returns true after offline event', () => {
      updateConnectivity('offline');
      expect(wasOffline()).toBe(true);
    });

    it('persists after coming back online', () => {
      updateConnectivity('offline');
      updateConnectivity('online');
      expect(wasOffline()).toBe(true);
    });
  });

  describe('resetOfflineState', () => {
    it('resets all state to defaults', () => {
      updateConnectivity('offline');
      resetOfflineState();
      expect(isOffline()).toBe(false);
      expect(wasOffline()).toBe(false);
      expect(getConnectivityState().status).toBe('online');
    });
  });

  describe('onConnectivityChange', () => {
    it('calls listener on status change', () => {
      const listener = vi.fn();
      onConnectivityChange(listener);
      updateConnectivity('offline');
      expect(listener).toHaveBeenCalled();
    });

    it('returns unsubscribe function', () => {
      const listener = vi.fn();
      const unsub = onConnectivityChange(listener);
      unsub();
      updateConnectivity('offline');
      expect(listener).not.toHaveBeenCalled();
    });

    it('passes current state to listener', () => {
      const listener = vi.fn();
      onConnectivityChange(listener);
      updateConnectivity('offline');
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ status: 'offline' }));
    });
  });

  describe('getBannerMessage', () => {
    it('returns offline message', () => {
      expect(getBannerMessage({ status: 'offline', wasOffline: false, timestamp: 0 })).toContain('offline');
    });

    it('returns slow message', () => {
      expect(getBannerMessage({ status: 'slow', wasOffline: false, timestamp: 0 })).toContain('slow');
    });

    it('returns restored message', () => {
      expect(getBannerMessage({ status: 'restored', wasOffline: true, timestamp: 0 })).toContain('restored');
    });

    it('returns empty for online', () => {
      expect(getBannerMessage({ status: 'online', wasOffline: false, timestamp: 0 })).toBe('');
    });
  });

  describe('getBannerSeverity', () => {
    it('returns error for offline', () => {
      expect(getBannerSeverity({ status: 'offline', wasOffline: false, timestamp: 0 })).toBe('error');
    });

    it('returns warning for slow', () => {
      expect(getBannerSeverity({ status: 'slow', wasOffline: false, timestamp: 0 })).toBe('warning');
    });

    it('returns success for restored', () => {
      expect(getBannerSeverity({ status: 'restored', wasOffline: true, timestamp: 0 })).toBe('success');
    });

    it('returns none for online', () => {
      expect(getBannerSeverity({ status: 'online', wasOffline: false, timestamp: 0 })).toBe('none');
    });
  });
});

import { describe, it, expect } from 'vitest';
import {
  getIndicator,
  getIndicatorIcon,
  getIndicatorLabel,
  hasIndicator,
} from '../reply-forward-indicators';

describe('reply-forward-indicators', () => {
  describe('getIndicator', () => {
    it('returns replied for Re:', () => {
      expect(getIndicator('Re: Meeting')).toBe('replied');
    });

    it('returns forwarded for Fwd:', () => {
      expect(getIndicator('Fwd: News')).toBe('forwarded');
    });

    it('returns forwarded for Fw:', () => {
      expect(getIndicator('Fw: Info')).toBe('forwarded');
    });

    it('returns none for normal subject', () => {
      expect(getIndicator('Normal subject')).toBe('none');
    });
  });

  describe('getIndicatorIcon', () => {
    it('returns correct icons', () => {
      expect(getIndicatorIcon('replied')).toBe('↩');
      expect(getIndicatorIcon('forwarded')).toBe('↪');
      expect(getIndicatorIcon('none')).toBe('');
    });
  });

  describe('hasIndicator', () => {
    it('returns true for replied/forwarded', () => {
      expect(hasIndicator('replied')).toBe(true);
      expect(hasIndicator('forwarded')).toBe(true);
      expect(hasIndicator('none')).toBe(false);
    });
  });
});

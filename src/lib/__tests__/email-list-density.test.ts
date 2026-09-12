import { describe, it, expect } from 'vitest';
import {
  getDensityConfig,
  getRowHeight,
  shouldShowPreview,
  cycleDensity,
  getDensityLabel,
  type ListDensity,
} from '../email-list-density';

describe('email-list-density', () => {
  describe('getDensityConfig', () => {
    it('returns compact config', () => {
      const config = getDensityConfig('compact');
      expect(config.rowHeight).toBe(36);
      expect(config.showPreview).toBe(false);
    });

    it('returns spacious config', () => {
      const config = getDensityConfig('spacious');
      expect(config.rowHeight).toBe(64);
      expect(config.showPreview).toBe(true);
    });
  });

  describe('getRowHeight', () => {
    it('returns correct heights', () => {
      expect(getRowHeight('compact')).toBe(36);
      expect(getRowHeight('comfortable')).toBe(48);
      expect(getRowHeight('spacious')).toBe(64);
    });
  });

  describe('shouldShowPreview', () => {
    it('compact hides preview', () => {
      expect(shouldShowPreview('compact')).toBe(false);
    });

    it('spacious shows preview', () => {
      expect(shouldShowPreview('spacious')).toBe(true);
    });
  });

  describe('cycleDensity', () => {
    it('cycles through densities', () => {
      expect(cycleDensity('compact')).toBe('comfortable');
      expect(cycleDensity('comfortable')).toBe('spacious');
      expect(cycleDensity('spacious')).toBe('compact');
    });
  });

  describe('getDensityLabel', () => {
    it('returns human-readable labels', () => {
      expect(getDensityLabel('compact')).toBe('Compact');
      expect(getDensityLabel('spacious')).toBe('Spacious');
    });
  });
});

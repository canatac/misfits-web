import { describe, it, expect } from 'vitest';
import {
  buildThreadTree,
  getMaxDepth,
  flattenTree,
  getDepthIndent,
} from '../thread-depth-indicators';

describe('thread-depth-indicators', () => {
  describe('buildThreadTree', () => {
    it('builds a flat tree when no parents', () => {
      const nodes = [
        { id: '1', parentId: null },
        { id: '2', parentId: null },
      ];
      const tree = buildThreadTree(nodes);
      expect(tree).toHaveLength(2);
      expect(tree[0].depth).toBe(0);
    });

    it('nests children under parents', () => {
      const nodes = [
        { id: '1', parentId: null },
        { id: '2', parentId: '1' },
        { id: '3', parentId: '1' },
      ];
      const tree = buildThreadTree(nodes);
      expect(tree).toHaveLength(1);
      expect(tree[0].children).toHaveLength(2);
    });

    it('assigns correct depth', () => {
      const nodes = [
        { id: '1', parentId: null },
        { id: '2', parentId: '1' },
        { id: '3', parentId: '2' },
      ];
      const tree = buildThreadTree(nodes);
      expect(tree[0].depth).toBe(0);
      expect(tree[0].children[0].depth).toBe(1);
      expect(tree[0].children[0].children[0].depth).toBe(2);
    });
  });

  describe('getMaxDepth', () => {
    it('returns 0 for flat tree', () => {
      const nodes = [{ id: '1', parentId: null, depth: 0, children: [] }];
      expect(getMaxDepth(nodes)).toBe(0);
    });

    it('returns max depth', () => {
      const nodes = [
        { id: '1', parentId: null, depth: 0, children: [
          { id: '2', parentId: '1', depth: 1, children: [
            { id: '3', parentId: '2', depth: 2, children: [] }
          ]}
        ]}
      ];
      expect(getMaxDepth(nodes)).toBe(2);
    });
  });

  describe('flattenTree', () => {
    it('flattens tree to array', () => {
      const nodes = buildThreadTree([
        { id: '1', parentId: null },
        { id: '2', parentId: '1' },
        { id: '3', parentId: '2' },
      ]);
      const flat = flattenTree(nodes);
      expect(flat).toHaveLength(3);
    });
  });

  describe('getDepthIndent', () => {
    it('returns pixel indent', () => {
      expect(getDepthIndent(0)).toBe('0px');
      expect(getDepthIndent(1)).toBe('20px');
      expect(getDepthIndent(2)).toBe('40px');
    });

    it('accepts custom indent size', () => {
      expect(getDepthIndent(1, 30)).toBe('30px');
    });
  });
});

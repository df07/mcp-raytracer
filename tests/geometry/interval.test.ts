import { Interval } from '../../src/geometry/interval.js';

describe('Interval', () => {
  it('should initialize correctly with values', () => {
    const interval = new Interval(1, 5);
    expect(interval.min).toBe(1);
    expect(interval.max).toBe(5);
  });

  it('should initialize as EMPTY by default', () => {
    const interval = new Interval();
    expect(interval.min).toBe(Infinity);
    expect(interval.max).toBe(-Infinity);
    expect(interval).toEqual(Interval.EMPTY);
  });

  it('should have correct EMPTY static constant', () => {
    expect(Interval.EMPTY.min).toBe(Infinity);
    expect(Interval.EMPTY.max).toBe(-Infinity);
  });

  it('should have correct UNIVERSE static constant', () => {
    expect(Interval.UNIVERSE.min).toBe(-Infinity);
    expect(Interval.UNIVERSE.max).toBe(Infinity);
  });

  it('should calculate size correctly', () => {
    expect(new Interval(1, 5).size()).toBe(4);
    expect(new Interval(-2, 3).size()).toBe(5);
    expect(Interval.EMPTY.size()).toBeLessThan(0);
    expect(Interval.UNIVERSE.size()).toBe(Infinity);
  });

  describe('contains', () => {
    const interval = new Interval(1, 5);
    it('should return true for values within the interval (inclusive)', () => {
      expect(interval.contains(1)).toBe(true);
      expect(interval.contains(3)).toBe(true);
      expect(interval.contains(5)).toBe(true);
    });
    it('should return false for values outside the interval', () => {
      expect(interval.contains(0.9)).toBe(false);
      expect(interval.contains(5.1)).toBe(false);
    });
    it('should handle UNIVERSE correctly', () => {
      expect(Interval.UNIVERSE.contains(0)).toBe(true);
      expect(Interval.UNIVERSE.contains(-1e10)).toBe(true);
      expect(Interval.UNIVERSE.contains(1e10)).toBe(true);
    });
    it('should handle EMPTY correctly', () => {
      expect(Interval.EMPTY.contains(0)).toBe(false);
    });
  });

  describe('surrounds', () => {
    const interval = new Interval(1, 5);
    it('should return true for values strictly within the interval', () => {
      expect(interval.surrounds(1.1)).toBe(true);
      expect(interval.surrounds(3)).toBe(true);
      expect(interval.surrounds(4.9)).toBe(true);
    });
    it('should return false for values on the boundaries or outside', () => {
      expect(interval.surrounds(1)).toBe(false);
      expect(interval.surrounds(5)).toBe(false);
      expect(interval.surrounds(0.9)).toBe(false);
      expect(interval.surrounds(5.1)).toBe(false);
    });
     it('should handle UNIVERSE correctly', () => {
      expect(Interval.UNIVERSE.surrounds(0)).toBe(true);
      expect(Interval.UNIVERSE.surrounds(-1e10)).toBe(true);
      expect(Interval.UNIVERSE.surrounds(1e10)).toBe(true);
    });
    it('should handle EMPTY correctly', () => {
      expect(Interval.EMPTY.surrounds(0)).toBe(false);
    });
  });

  describe('clamp', () => {
    const interval = new Interval(1, 5);
    it('should return the value if it is within the interval', () => {
      expect(interval.clamp(3)).toBe(3);
      expect(interval.clamp(1)).toBe(1);
      expect(interval.clamp(5)).toBe(5);
    });
    it('should clamp to min if the value is below the interval', () => {
      expect(interval.clamp(0)).toBe(1);
      expect(interval.clamp(-10)).toBe(1);
    });
    it('should clamp to max if the value is above the interval', () => {
      expect(interval.clamp(6)).toBe(5);
      expect(interval.clamp(100)).toBe(5);
    });
    it('should handle UNIVERSE correctly', () => {
        expect(Interval.UNIVERSE.clamp(100)).toBe(100);
        expect(Interval.UNIVERSE.clamp(-100)).toBe(-100);
    });
     it('should handle EMPTY correctly (clamps to min which is Infinity)', () => {
        expect(Interval.EMPTY.clamp(0)).toBe(Infinity); // Clamping to EMPTY interval results in min (Infinity)
    });
  });
});

/**
 * Represents a mathematical interval [min, max].
 */
export class Interval {
    min: number;
    max: number;

    /**
     * Represents an empty interval.
     */
    static readonly EMPTY = new Interval(Infinity, -Infinity);

    /**
     * Represents the interval of all real numbers.
     */
    static readonly UNIVERSE = new Interval(-Infinity, Infinity);

    /**
     * Initializes a new interval.
     * Defaults to an empty interval if no arguments are provided.
     * @param min The minimum value (inclusive).
     * @param max The maximum value (inclusive).
     */
    constructor(min: number = Infinity, max: number = -Infinity) {
        this.min = min;
        this.max = max;
    }

    /**
     * Returns the size of the interval (max - min).
     * Returns a negative value for empty intervals.
     */
    size(): number {
        return this.max - this.min;
    }

    /**
     * Checks if the interval contains the value x (inclusive).
     * @param x The value to check.
     * @returns True if min <= x <= max.
     */
    contains(x: number): boolean {
        return this.min <= x && x <= this.max;
    }

    /**
     * Checks if the interval surrounds the value x (exclusive).
     * @param x The value to check.
     * @returns True if min < x < max.
     */
    surrounds(x: number): boolean {
        return this.min < x && x < this.max;
    }

    /**
     * Clamps the value x to the interval [min, max].
     * @param x The value to clamp.
     * @returns The clamped value.
     */
    clamp(x: number): number {
        if (x < this.min) return this.min;
        if (x > this.max) return this.max;
        return x;
    }
}

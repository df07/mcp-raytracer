/* Specs: hittable.md */

import { HitRecord, Hittable } from './hittable.js';
import { Ray } from './ray.js';
import { Interval } from './interval.js'; // Added import

/**
 * Represents a list of Hittable objects.
 * Implements the Hittable interface to check for intersections
 * against all objects in the list.
 */
export class HittableList implements Hittable {
  public objects: Hittable[] = [];

  /**
   * Creates an empty HittableList or initializes it with a single object.
   * @param object Optional initial Hittable object to add.
   */
  constructor(object?: Hittable) {
    if (object) {
      this.add(object);
    }
  }

  /**
   * Adds a Hittable object to the list.
   * @param object The Hittable object to add.
   */
  public add(object: Hittable): void {
    this.objects.push(object);
  }

  /**
   * Clears all Hittable objects from the list.
   */
  public clear(): void {
    this.objects = [];
  }
  
  /**
   * Returns the number of objects in the hittable list.
   */
  public get count(): number {
    return this.objects.length;
  }

  /**
   * Checks if the ray hits any object in the list within the given interval.
   * Finds the closest hit point across all objects.
   *
   * NOTE: This deviates from the "Ray Tracing in One Weekend" tutorial (which uses
   * an out parameter for the HitRecord) to favor returning a value or null,
   * adhering to a more common TypeScript idiom. Do not revert this change.
   *
   * @param r The ray to check for intersection.
   * @param rayT The interval of valid t values along the ray.
   * @returns The HitRecord for the closest hit found within the interval, or null if no object was hit.
   */
  public hit(r: Ray, rayT: Interval): HitRecord | null {
    let closestHitRecord: HitRecord | null = null;
    let closestSoFar = rayT.max; // Start with the max of the interval

    for (const object of this.objects) {
      // Pass a narrowed interval [rayT.min, closestSoFar] to each object's hit method.
      // This ensures we only consider hits closer than the closest one found so far.
      const currentHitRecord = object.hit(r, new Interval(rayT.min, closestSoFar));

      if (currentHitRecord) {
        closestSoFar = currentHitRecord.t; // Update the upper bound for the next check
        closestHitRecord = currentHitRecord; // Store the record of the closest hit found so far
      }
    }

    return closestHitRecord;
  }
}
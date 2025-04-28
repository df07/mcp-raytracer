/* Specs: hittable.md */

import { HitRecord, Hittable } from './hittable.js';
import { Ray } from './ray.js';

/**
 * Represents a list of Hittable objects.
 * Implements the Hittable interface to check for intersections
 * against all objects in the list.
 */
export class HittableList implements Hittable {
  private objects: Hittable[] = [];

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
   * Checks if the ray hits any object in the list within the given interval.
   * Finds the closest hit point across all objects.
   * @param r The incident ray.
   * @param tMin The minimum acceptable parameter value.
   * @param tMax The maximum acceptable parameter value.
   * @returns The HitRecord of the closest hit found within the interval, or null if no hit.
   */
  public hit(r: Ray, tMin: number, tMax: number): HitRecord | null {
    let closestHitRecord: HitRecord | null = null;
    let closestSoFar = tMax;

    for (const object of this.objects) {
      const hitResult = object.hit(r, tMin, closestSoFar);
      
      if (hitResult !== null) {
        closestSoFar = hitResult.t;
        closestHitRecord = hitResult;
      }
    }

    return closestHitRecord;
  }
} 
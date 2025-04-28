/* Specs: hittable.md */

import { HitRecord, Hittable } from './hittable.js';
import { ray } from './ray.js';

/**
 * Represents a list of Hittable objects.
 * Implements the Hittable interface to check for intersections
 * against all objects in the list.
 */
export class HittableList implements Hittable {
  objects: Hittable[] = [];

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
   * Updates the HitRecord with the closest hit found.
   * @param r The incident ray.
   * @param tMin The minimum acceptable parameter value.
   * @param tMax The maximum acceptable parameter value.
   * @param rec The HitRecord to update with the closest hit details.
   * @returns True if any object in the list was hit, false otherwise.
   */
  public hit(r: ray, tMin: number, tMax: number, rec: HitRecord): boolean {
    let hitAnything = false;
    let closestSoFar = tMax;
    const tempRec = new HitRecord(); // Use a temporary record for intermediate hits

    for (const object of this.objects) {
      if (object.hit(r, tMin, closestSoFar, tempRec)) {
        hitAnything = true;
        closestSoFar = tempRec.t;
        // Copy the data from the temporary record to the main record
        rec.copyFrom(tempRec);
      }
    }

    return hitAnything;
  }
} 
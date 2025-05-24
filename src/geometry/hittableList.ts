/* Specs: hittable.md, aabb-bvh.md, pdf-sampling.md */

import { HitRecord, Hittable, PDFHittable } from './hittable.js';
import { Ray } from './ray.js';
import { Interval } from './interval.js';
import { AABB } from './aabb.js';
import { Point3, Vec3 } from './vec3.js';

/**
 * Represents a list of Hittable objects.
 * Implements the Hittable interface to check for intersections
 * against all objects in the list.
 */
export class HittableList implements Hittable {
  public objects: Hittable[] = [];
  private _boundingBox?: AABB; // Cached bounding box

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
   * Returns the axis-aligned bounding box that encloses all objects in this list.
   * If the list is empty, returns an "empty" bounding box.
   * 
   * @returns The bounding box for all objects in the list
   */
  public boundingBox(): AABB {
    // Return cached bounding box if available
    if (this._boundingBox) {
      return this._boundingBox;
    }
    
    // If list is empty, return an empty bounding box
    if (this.objects.length === 0) {
      return AABB.empty();
    }
    
    // Start with the first object's bounding box
    let result = this.objects[0].boundingBox();
    
    // Expand to include all other objects
    for (let i = 1; i < this.objects.length; i++) {
      result = AABB.surroundingBox(result, this.objects[i].boundingBox());
    }
    
    // Cache the result
    this._boundingBox = result;
    
    return result;
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
    let interval = new Interval(rayT.min, rayT.max); // Start with the entire interval

    for (const object of this.objects) {
      // Pass a narrowed interval to each object's hit method.
      // This ensures we only consider hits closer than the closest one found so far.
      const currentHitRecord = object.hit(r, interval);

      if (currentHitRecord) {
        interval.max = currentHitRecord.t;   // Update the upper bound for the next check
        closestHitRecord = currentHitRecord; // Store the record of the closest hit found so far
      }
    }

    return closestHitRecord;
  }

  /**
   * Adds a Hittable object to the list.
   * @param object The Hittable object to add.
   */
  public add(object: Hittable): void {
    this.objects.push(object);
    // Invalidate cached bounding box
    this._boundingBox = undefined;
  }

  /**
   * Clears all Hittable objects from the list.
   */
  public clear(): void {
    this.objects = [];
    // Invalidate cached bounding box
    this._boundingBox = undefined;
  }
  
  /**
   * Returns the number of objects in the hittable list.
   */
  public get count(): number {
    return this.objects.length;
  }
}
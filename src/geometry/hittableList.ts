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
export class HittableList implements PDFHittable {
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

  /**
   * Calculates the probability density function value for a ray from the given origin
   * towards this list of objects in the specified direction.
   * 
   * Only considers SampleableHittable objects in the list.
   * Each object's contribution is weighted equally.
   * 
   * @param origin The origin point from which to evaluate PDF
   * @param direction The direction to evaluate
   * @returns The combined PDF value across all sampleable objects in the list
   */
  public pdfValue(origin: Point3, direction: Vec3): number {
    // Filter for objects that implement SampleableHittable
    const sampleableObjects = this.objects.filter(
      (obj): obj is PDFHittable => 'pdfValue' in obj && 'random' in obj
    );
    
    const count = sampleableObjects.length;
    if (count === 0) return 0;
    
    // Sum PDF values from all sampleable objects
    let sum = 0;
    for (const object of sampleableObjects) {
      sum += object.pdfValue(origin, direction);
    }
    
    // Return average PDF value across all objects
    return sum / count;
  }
  
  /**
   * Generates a random direction from the origin towards one of the objects in the list.
   * Randomly selects one sampleable object from the list and uses its random() method.
   * 
   * @param origin The origin point from which to sample a direction
   * @returns A random direction from the origin towards a sampleable object in the list
   */
  public pdfRandomVec(origin: Point3): Vec3 {
    // Filter for objects that implement SampleableHittable
    const sampleableObjects = this.objects.filter(
      (obj): obj is PDFHittable => 'pdfValue' in obj && 'random' in obj
    );
    
    const count = sampleableObjects.length;
    if (count === 0) {
      // If the list has no sampleable objects, return a default direction (up)
      return new Vec3(0, 1, 0);
    }
    
    // Select a random object from the sampleable objects
    const randomIndex = Math.floor(Math.random() * count);
    return sampleableObjects[randomIndex].pdfRandomVec(origin);
  }
}
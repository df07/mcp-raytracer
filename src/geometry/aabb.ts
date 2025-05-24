/* Specs: aabb-bvh.md */

import { Point3, Vec3 } from './vec3.js';

/**
 * Represents an axis-aligned bounding box (AABB) for efficient ray intersection testing.
 * An AABB is a rectangular box whose faces are aligned with the coordinate axes.
 */
export class AABB {
    /**
     * Creates an AABB with the specified minimum and maximum points.
     * 
     * @param minimum The minimum coordinates of the box (smallest x, y, z values)
     * @param maximum The maximum coordinates of the box (largest x, y, z values)
     */
    constructor(
        readonly minimum: Point3,
        readonly maximum: Point3
    ) { }

    /**
     * Tests if a ray intersects this bounding box within the given interval.
     * Uses the "slab method" for efficient AABB-ray intersection.
     * 
     * @param r The ray to test against
     * @param rayT The interval of valid t values along the ray
     * @returns True if the ray intersects the box within the interval, false otherwise
     */    
    hit(origin: Vec3, direction: Vec3, minT: number, maxT: number): boolean {
        // For each axis (x, y, z)
        for (let a = 0; a < 3; a++) {
            // Calculate inverse of ray direction for this axis
            // (avoids division and handles zero direction components)
            const invD = 1.0 / direction.glVec[a];
            
            // Calculate intersection with the two slabs (min and max planes)
            let t0 = (this.minimum.glVec[a] - origin.glVec[a]) * invD;
            let t1 = (this.maximum.glVec[a] - origin.glVec[a]) * invD;
            
            // If ray is traveling in negative direction, swap t0 and t1
            if (invD < 0) {
                const temp = t0;
                t0 = t1;
                t1 = temp;
            }
            
            // Update interval with the intersection of the current interval and this axis's interval
            const tMin = t0 > minT ? t0 : minT;
            const tMax = t1 < maxT ? t1 : maxT;
            
            // If the updated interval is empty, there's no intersection
            if (tMax <= tMin)
                return false;
        }
        
        // If we made it through all three axes with a non-empty interval, there's an intersection
        return true;
    }

    /**
     * Creates a new AABB that contains both input boxes.
     * 
     * @param box0 First bounding box
     * @param box1 Second bounding box
     * @returns A new AABB that encloses both input boxes
     */
    static surroundingBox(box0: AABB, box1: AABB): AABB {
        const small = new Vec3(
            Math.min(box0.minimum.x, box1.minimum.x),
            Math.min(box0.minimum.y, box1.minimum.y),
            Math.min(box0.minimum.z, box1.minimum.z)
        );

        const big = new Vec3(
            Math.max(box0.maximum.x, box1.maximum.x),
            Math.max(box0.maximum.y, box1.maximum.y),
            Math.max(box0.maximum.z, box1.maximum.z)
        );

        return new AABB(small, big);
    }

    /**
     * Creates an "empty" bounding box that represents no volume.
     * The minimum point has all coordinates set to positive infinity,
     * and the maximum point has all coordinates set to negative infinity.
     * This is useful as an identity element when combining bounding boxes.
     * 
     * @returns An empty bounding box
     */
    static empty(): AABB {
        return new AABB(
            new Vec3(Infinity, Infinity, Infinity),
            new Vec3(-Infinity, -Infinity, -Infinity)
        );
    }
}

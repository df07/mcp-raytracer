/* Specs: aabb-bvh.md */

import { Ray } from './ray.js';
import { HitRecord, Hittable } from './hittable.js';
import { Interval } from './interval.js';
import { AABB } from './aabb.js';
import { HittableList } from './hittableList.js';

const _emptyHittable: Hittable = {
    hit: (_r: Ray, _rayT: Interval): HitRecord | null => null,
    boundingBox: (): AABB => AABB.empty()
};

/**
 * Implements a Bounding Volume Hierarchy (BVH) for efficient ray intersection testing.
 * The BVH organizes objects in a binary tree structure, where each node contains a bounding box
 * that encloses all objects in its subtree.
 */
export class BVHNode implements Hittable {
    private left: Hittable;
    private right: Hittable;
    private box: AABB;
    
    // Maximum number of objects in a leaf node before splitting
    private static readonly MAX_LEAF_OBJECTS = 4;

    /**
     * Constructs a BVH node from a list of hittable objects.
     * 
     * @param objects Array of hittable objects to organize into a BVH
     * @param start Start index in the objects array
     * @param end End index in the objects array (exclusive)
     */
    constructor(objects: Hittable[], start: number, end: number) {
        // Make a copy of the objects array that we can modify
        const objectsList = objects.slice(start, end);
        
        // Determine the bounds of all objects in this node
        let nodeBounds: AABB | null = null;
        for (const obj of objectsList) {
            const box = obj.boundingBox();
            nodeBounds = nodeBounds ? AABB.surroundingBox(nodeBounds, box) : box;
        }
        
        // Calculate the extent along each axis
        const xExtent = nodeBounds!.maximum.x - nodeBounds!.minimum.x;
        const yExtent = nodeBounds!.maximum.y - nodeBounds!.minimum.y;
        const zExtent = nodeBounds!.maximum.z - nodeBounds!.minimum.z;
        
        // Find the longest axis
        let axis = 0; // x-axis
        if (yExtent > xExtent && yExtent > zExtent) {
            axis = 1; // y-axis
        } else if (zExtent > xExtent && zExtent > yExtent) {
            axis = 2; // z-axis
        }
        
        const objectsSpan = end - start;

        // Handle different cases based on how many objects we're dealing with
        if (objectsSpan === 1) {
            // Only one object, both children are the same
            this.left = objectsList[0];
            this.right = objectsList[0];
        } else if (objectsSpan === 2) {
            // Two objects, sort them along the chosen axis
            if (this.compareBoxes(objectsList[0], objectsList[1], axis)) {
                this.left = objectsList[0];
                this.right = objectsList[1];
            } else {
                this.left = objectsList[1];
                this.right = objectsList[0];
            }
        } else if (objectsSpan <= BVHNode.MAX_LEAF_OBJECTS) {
            // Create a leaf node using HittableList for left child
            const leafList = new HittableList();
            for (const obj of objectsList) {
                leafList.add(obj);
            }
            
            // Left contains the HittableList, right is an empty hittable to avoid redundant checks
            this.left = leafList;
            this.right = _emptyHittable;
        } else {
            // Many objects, sort and split in half
            
            // Sort objects based on the position of their bounding boxes along the chosen axis
            objectsList.sort((a, b) => this.compareBoxes(a, b, axis) ? -1 : 1);
            
            // Find the midpoint
            const mid = Math.floor(objectsSpan / 2);
            
            // Recursively construct left and right subtrees
            this.left = new BVHNode(objectsList, 0, mid);
            this.right = new BVHNode(objectsList, mid, objectsSpan);
        }
        
        // Compute the bounding box for this node
        const boxLeft = this.left.boundingBox();
        const boxRight = this.right.boundingBox();
        this.box = AABB.surroundingBox(boxLeft, boxRight);
    }
    
    /**
     * Compares two hittable objects based on their bounding boxes along the specified axis.
     * 
     * @param a First object
     * @param b Second object
     * @param axis Axis to compare along (0 = x, 1 = y, 2 = z)
     * @returns True if a's bounding box minimum is less than b's along the axis
     */
    private compareBoxes(a: Hittable, b: Hittable, axis: number): boolean {
        const boxA = a.boundingBox();
        const boxB = b.boundingBox();
        
        return boxA.minimum.glVec[axis] < boxB.minimum.glVec[axis];
    }

    /**
     * Checks if a ray intersects any object in this BVH node.
     * First tests against the node's bounding box, then recursively tests child nodes
     * if the ray intersects the bounding box.
     * 
     * @param r The ray to test
     * @param rayT The interval of valid t values along the ray
     * @returns A hit record for the closest intersection, or null if no intersection
     */
    hit(r: Ray, rayT: Interval): HitRecord | null {
        // If the ray doesn't hit the bounding box, there's no need to check children
        if (!this.box.hit(r, rayT)) {
            return null;
        }
        
        // Check if the ray hits the left child
        const hitLeft = this.left.hit(r, rayT);
        
        // Check if the ray hits the right child
        // If we hit the left child, only check for closer intersections
        const rightInterval = hitLeft 
            ? new Interval(rayT.min, hitLeft.t)
            : rayT;
        const hitRight = this.right.hit(r, rightInterval);
        
        // Return the closer of the two hits (or null if neither hit)
        return hitRight || hitLeft;
    }

    /**
     * Returns the bounding box for this BVH node.
     * 
     * @returns The bounding box that encloses all objects in this node's subtree
     */
    boundingBox(): AABB {
        return this.box;
    }

    /**
     * Creates a BVH from a list of hittable objects.
     * This is a convenience method to construct a BVH from a simple list.
     * 
     * @param objects The objects to organize into a BVH
     * @returns A new BVHNode containing all the objects
     */
    static fromList(objects: Hittable[]): BVHNode {
        return new BVHNode(objects, 0, objects.length);
    }
}

/* Specs: dielectric.md, pdf-sampling.md */

import { Ray } from '../geometry/ray.js';
import { Color, Vec3 } from '../geometry/vec3.js';
import { HitRecord } from '../geometry/hittable.js';
import { DefaultMaterial, ScatterResult } from './material.js';

/**
 * Dielectric material that simulates transparent substances like glass, water, and diamonds.
 * Exhibits both reflection and refraction based on angles and material properties.
 */
export class Dielectric extends DefaultMaterial {
    readonly indexOfRefraction: number;
    public static readonly AIR_IOR = 1.0;
    public static readonly GLASS_IOR = 1.5;
    public static readonly DIAMOND_IOR = 2.4;
    public static readonly WATER_IOR = 1.33;

    /**
     * Creates a new dielectric material.
     * @param indexOfRefraction The refractive index of the material
     *        (Air ≈ 1.0, Glass ≈ 1.5, Diamond ≈ 2.4, Water ≈ 1.33)
     */
    constructor(indexOfRefraction: number) {
        super();
        this.indexOfRefraction = indexOfRefraction;
    }

    /**
     * Scatters the incoming ray according to the dielectric refraction and reflection model.
     * @param rIn The incoming ray.
     * @param rec The hit record.
     * @returns A ScatterResult with the ray and attenuation, or null if absorbed.
     */
    override scatter(rIn: Ray, rec: HitRecord): ScatterResult | null {
        // For a pure dielectric, light isn't absorbed - attenuation is always 1.0
        const attenuation = new Color(1.0, 1.0, 1.0);
        
        // Calculate whether we're entering or exiting the material
        // and adjust the refraction ratio accordingly
        const refractionRatio = rec.frontFace ? 
            (1.0 / this.indexOfRefraction) : 
            this.indexOfRefraction;

        // Normalize the incoming ray direction
        const unitDirection = rIn.direction.unitVector();
        
        // Calculate the cosine of the angle between the ray and the normal
        const cosTheta = Math.min(unitDirection.negate().dot(rec.normal), 1.0);
        const sinTheta = Math.sqrt(1.0 - cosTheta * cosTheta);
        
        // Check for total internal reflection
        // When refractionRatio * sinTheta > 1.0, there is no real solution to Snell's Law
        const cannotRefract = refractionRatio * sinTheta > 1.0;
        
        // Determine whether to reflect or refract
        let direction: Vec3;
        
        if (cannotRefract || this.reflectance(cosTheta, refractionRatio) > Math.random()) {
            // Reflect the ray
            direction = unitDirection.reflect(rec.normal);
        } else {
            // Refract the ray
            direction = unitDirection.refract(rec.normal, refractionRatio);
        }
        
        return { 
            attenuation: attenuation,
            scattered: new Ray(rec.p, direction)
        };
    }
    
    /**
     * Implements Schlick's approximation for reflectance.
     * Used to calculate the probability of reflection at different angles.
     * @param cosine Cosine of the angle between the ray and the normal.
     * @param refractionRatio Ratio of refractive indices (n1/n2).
     * @returns The reflectance value between 0 and 1.
     */
    private reflectance(cosine: number, refractionRatio: number): number {
        // Use Schlick's approximation for reflectance
        let r0 = (1 - refractionRatio) / (1 + refractionRatio);
        r0 = r0 * r0;
        return r0 + (1 - r0) * Math.pow((1 - cosine), 5);
    }
} 
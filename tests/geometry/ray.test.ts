import { Ray } from '../../src/geometry/ray.js';
import { Vec3, Point3 } from '../../src/geometry/vec3.js';

describe('Ray', () => {
    it('should initialize origin and direction correctly', () => {
        const origin = new Vec3(1, 2, 3);
        const direction = new Vec3(4, 5, 6);
        const r = new Ray(origin, direction);

        expect(r.origin.x).toBe(1);
        expect(r.origin.y).toBe(2);
        expect(r.origin.z).toBe(3);
        expect(r.direction.x).toBe(4);
        expect(r.direction.y).toBe(5);
        expect(r.direction.z).toBe(6);
    });

    it('should return the correct origin', () => {
        const origin = new Vec3(0, 0, 0);
        const direction = new Vec3(1, 0, 0);
        const r = new Ray(origin, direction);

        expect(r.origin).toBeInstanceOf(Vec3);
        expect(r.origin.x).toBe(0);
        expect(r.origin.y).toBe(0);
        expect(r.origin.z).toBe(0);
    });

    it('should return the correct direction', () => {
        const origin = new Vec3(0, 0, 0);
        const direction = new Vec3(1, 0, 0);
        const r = new Ray(origin, direction);

        expect(r.direction).toBeInstanceOf(Vec3);
        expect(r.direction.x).toBe(1);
        expect(r.direction.y).toBe(0);
        expect(r.direction.z).toBe(0);
    });

    describe('at', () => {
        it('should calculate the correct point at t=0', () => {
            const origin = new Vec3(1, 2, 3);
            const direction = new Vec3(4, 5, 6);
            const r = new Ray(origin, direction);
            const pointAtT: Point3 = r.at(0);

            expect(pointAtT).toBeInstanceOf(Vec3);
            expect(pointAtT.x).toBe(1);
            expect(pointAtT.y).toBe(2);
            expect(pointAtT.z).toBe(3);
        });

        it('should calculate the correct point at t=1', () => {
            const origin = new Vec3(1, 2, 3);
            const direction = new Vec3(4, 5, 6);
            const r = new Ray(origin, direction);
            const pointAtT: Point3 = r.at(1);

            expect(pointAtT).toBeInstanceOf(Vec3);
            expect(pointAtT.x).toBe(5);
            expect(pointAtT.y).toBe(7);
            expect(pointAtT.z).toBe(9);
        });

        it('should calculate the correct point at t=0.5', () => {
            const origin = new Vec3(1, 2, 3);
            const direction = new Vec3(4, 5, 6);
            const r = new Ray(origin, direction);
            const pointAtT: Point3 = r.at(0.5);

            expect(pointAtT).toBeInstanceOf(Vec3);
            expect(pointAtT.x).toBe(3);
            expect(pointAtT.y).toBe(4.5);
            expect(pointAtT.z).toBe(6);
        });

        it('should calculate the correct point at t=-1', () => {
            const origin = new Vec3(1, 2, 3);
            const direction = new Vec3(4, 5, 6);
            const r = new Ray(origin, direction);
            const pointAtT: Point3 = r.at(-1);

            expect(pointAtT).toBeInstanceOf(Vec3);
            expect(pointAtT.x).toBe(-3);
            expect(pointAtT.y).toBe(-3);
            expect(pointAtT.z).toBe(-3);
        });
    });
}); 
import { ray } from '../src/ray.js';
import { vec3, point3 } from '../src/vec3.js';

describe('ray', () => {
    it('should initialize origin and direction correctly', () => {
        const origin = new vec3(1, 2, 3);
        const direction = new vec3(4, 5, 6);
        const r = new ray(origin, direction);

        expect(r.origin().e).toEqual([1, 2, 3]);
        expect(r.direction().e).toEqual([4, 5, 6]);
    });

    it('should return the correct origin', () => {
        const origin = new vec3(0, 0, 0);
        const direction = new vec3(1, 0, 0);
        const r = new ray(origin, direction);

        expect(r.origin()).toBeInstanceOf(vec3);
        expect(r.origin().e).toEqual([0, 0, 0]);
    });

    it('should return the correct direction', () => {
        const origin = new vec3(0, 0, 0);
        const direction = new vec3(1, 0, 0);
        const r = new ray(origin, direction);

        expect(r.direction()).toBeInstanceOf(vec3);
        expect(r.direction().e).toEqual([1, 0, 0]);
    });

    describe('at', () => {
        it('should calculate the correct point at t=0', () => {
            const origin = new vec3(1, 2, 3);
            const direction = new vec3(4, 5, 6);
            const r = new ray(origin, direction);
            const pointAtT: point3 = r.at(0);

            expect(pointAtT).toBeInstanceOf(vec3);
            expect(pointAtT.e).toEqual([1, 2, 3]); // Should be same as origin
        });

        it('should calculate the correct point at t=1', () => {
            const origin = new vec3(1, 2, 3);
            const direction = new vec3(4, 5, 6);
            const r = new ray(origin, direction);
            const pointAtT: point3 = r.at(1);

            expect(pointAtT).toBeInstanceOf(vec3);
            // origin + 1 * direction = (1+4, 2+5, 3+6) = (5, 7, 9)
            expect(pointAtT.e).toEqual([5, 7, 9]); 
        });

        it('should calculate the correct point at t=0.5', () => {
            const origin = new vec3(1, 2, 3);
            const direction = new vec3(4, 5, 6);
            const r = new ray(origin, direction);
            const pointAtT: point3 = r.at(0.5);

            expect(pointAtT).toBeInstanceOf(vec3);
            // origin + 0.5 * direction = (1 + 0.5*4, 2 + 0.5*5, 3 + 0.5*6) = (1+2, 2+2.5, 3+3) = (3, 4.5, 6)
            expect(pointAtT.e).toEqual([3, 4.5, 6]);
        });

        it('should calculate the correct point at t=-1', () => {
            const origin = new vec3(1, 2, 3);
            const direction = new vec3(4, 5, 6);
            const r = new ray(origin, direction);
            const pointAtT: point3 = r.at(-1);

            expect(pointAtT).toBeInstanceOf(vec3);
            // origin + (-1) * direction = (1-4, 2-5, 3-6) = (-3, -3, -3)
            expect(pointAtT.e).toEqual([-3, -3, -3]);
        });
    });
}); 
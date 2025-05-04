# Spec: Camera Class

**Reference:** ["Ray Tracing in One Weekend"](https://raytracing.github.io/books/RayTracingInOneWeekend.html)
**Related Specs:** `specs/vec3.md`, `specs/ray.md`, `specs/hittable.md`, `specs/interval.md`, `specs/material.md`

## Goal

Define a `Camera` class responsible for managing view parameters, generating rays corresponding to image pixels, calculating ray colors, rendering the scene, and implementing anti-aliasing and support for material-based ray scattering.

## Motivation

To encapsulate camera logic and the core rendering loop, making the main application entry point (`raytracer.ts`) simpler and allowing for easier camera positioning and orientation adjustments.

## Requirements

1.  **File Location:** Implement this class within `src/camera.ts`.
2.  **Class Name:** The class must be named `Camera`.
3.  **Dependencies:** The implementation will depend on the `Vec3`, `Point3`, `Color`, `Ray`, `Hittable`, and `Interval` types/classes defined in other `src/` files.
4.  **State (Properties):** An instance of the `Camera` class must store:
    *   `imageWidth`: The width of the rendered image in pixels (`number`, `public readonly`).
    *   `imageHeight`: The height of the rendered image in pixels (`number`, `public readonly`).
    *   `center`: The position of the camera (`Point3`, `public readonly`).
    *   `pixel00Loc`: The location of the center of the pixel at (0, 0) (`Point3`, `public readonly`).
    *   `pixelDeltaU`: The offset vector from one pixel to the next horizontally (`Vec3`, `public readonly`).
    *   `pixelDeltaV`: The offset vector from one pixel to the next vertically (`Vec3`, `public readonly`).
    *   `u`, `v`, `w`: The orthonormal basis vectors for the camera's coordinate system (`Vec3`, `private readonly`).
    *   `world`: The scene containing hittable objects (`Hittable`, `private readonly`).
    *   `samplesPerPixel`: Number of random samples per pixel for anti-aliasing (`number`, `public readonly`).
    *   `maxDepth`: Maximum recursion depth for ray color calculations (`number`, `public readonly`).
5.  **Initialization (Constructor):**
    *   Provide a constructor: `constructor(imageWidth: number, imageHeight: number, vfovDegrees: number, lookfrom: Point3, lookat: Point3, vup: Vec3, world: Hittable, samplesPerPixel: number = 100, maxDepth: number = 50)`
    *   Store `imageWidth`, `imageHeight`, `center` (which is `lookfrom`), `world`, `samplesPerPixel`, and `maxDepth`.
    *   Calculate the aspect ratio (`imageWidth / imageHeight`).
    *   Convert vertical field-of-view (`vfovDegrees`) from degrees to radians.
    *   Calculate the viewport height (`h`) based on the `vfov` (using `tan(theta/2)`) and a fixed focal length of 1.0. `h = tan(vfovRadians / 2)`. The viewport height is `2 * h`.
    *   Calculate the viewport width based on the viewport height and aspect ratio.
    *   Calculate the camera's orthonormal basis vectors (`w`, `u`, `v`) using `lookfrom`, `lookat`, and `vup`:
        *   `w = unitVector(lookfrom.subtract(lookat))`
        *   `u = unitVector(cross(vup, w))`
        *   `v = cross(w, u)`
    *   Calculate the vectors along the horizontal (`viewportU`) and vertical (`viewportV`) viewport edges, scaled by the focal length (which is 1):
        *   `viewportU = u.multiply(viewportWidth)`
        *   `viewportV = v.multiply(-viewportHeight)` // `v` points up, viewport V points down
    *   Calculate the horizontal and vertical delta vectors between pixels:
        *   `pixelDeltaU = viewportU.divide(imageWidth)`
        *   `pixelDeltaV = viewportV.divide(imageHeight)`
    *   Calculate the location of the upper-left pixel (`pixel00Loc`):
        *   `viewportUpperLeft = center.subtract(w).subtract(viewportU.divide(2)).subtract(viewportV.divide(2))`
        *   `pixel00Loc = viewportUpperLeft.add(pixelDeltaU.add(pixelDeltaV).multiply(0.5))`
6.  **Core Functionality (Methods):**
    *   `getRay(i: number, j: number): Ray`:
        *   For no anti-aliasing, simply:
            *   Calculates the target pixel's center location: `pixelCenter = pixel00Loc.add(pixelDeltaU.multiply(i)).add(pixelDeltaV.multiply(j))`
            *   Calculates the ray direction: `rayDirection = pixelCenter.subtract(center)`
            *   Returns a new `Ray` with the camera `center` as the origin and the calculated `rayDirection`.
        *   For anti-aliasing (when `samplesPerPixel > 1`):
            *   Adds random offsets to the ray:
            *   Generates random offsets `du` and `dv` in the range [-0.5, 0.5]
            *   Calculates the target pixel's center with jittered offset: `pixelCenter = pixel00Loc.add(pixelDeltaU.multiply(i + du)).add(pixelDeltaV.multiply(j + dv))`
            *   Rest of the calculation remains the same.
    *   `rayColor(r: Ray, depth: number): Color`:
        *   Adds depth parameter to limit recursion and prevent stack overflow.
        *   If `depth <= 0`, returns black (`new Vec3(0, 0, 0)`) to terminate recursion.
        *   Traces the given ray `r` into the stored `world` using `world.hit(r, new Interval(0.001, Infinity))` (using a small positive `tMin` to avoid shadow acne).
        *   If the ray hits an object (`hitRecord` is not `null`):
            *   If `hitRecord.material` exists, attempts to scatter the ray:
                *   Calls `hitRecord.material.scatter(r, hitRecord)`.
                *   If scattering occurs (result is not null), recursively calls `rayColor(scattered, depth-1)` and multiplies by the attenuation.
                *   If no scatter occurs, returns black (ray absorbed).
            *   Fallback (when material is null): returns a color based on the hit normal: `hitRecord.normal.add(new Vec3(1, 1, 1)).multiply(0.5)`.
        *   If the ray misses:
            *   Calculates a background gradient color based on the ray's y-direction.
            *   `unitDirection = r.direction.unitVector()`
            *   `a = 0.5 * (unitDirection.y + 1.0)`
            *   Returns `lerp(white, lightBlue, a)` where `white = (1,1,1)` and `lightBlue = (0.5, 0.7, 1.0)`.
    *   `render(pixelData: Uint8ClampedArray, verbose: boolean = false): void`:
        *   Iterates through each pixel (`j` from 0 to `imageHeight`, `i` from 0 to `imageWidth`).
        *   Optionally logs progress to `stderr` if `verbose` is true.
        *   For each pixel `(i, j)`:
            *   Initializes a `pixelColor` to black (`new Vec3(0, 0, 0)`).
            *   For anti-aliasing, takes `samplesPerPixel` samples per pixel:
                *   Loops `samplesPerPixel` times:
                    *   Gets a jittered ray for the current pixel using `getRay(i, j)` with random offsets.
                    *   Calls `rayColor(ray, maxDepth)` to get the color.
                    *   Adds the color to the accumulating `pixelColor`.
                *   Divides `pixelColor` by `samplesPerPixel` to get the average color.
            *   Applies gamma correction to the resulting color by taking the square root of each component.
            *   Writes the calculated `Color` to the `pixelData` buffer at the correct offset using the `writeColorToBuffer` helper function.
7.  **Helper Function (Module Scope):**
    *   `writeColorToBuffer(buffer: Uint8ClampedArray, offset: number, pixelColor: Color): void`:
        *   Takes a `Uint8ClampedArray`, an offset, and a `Color`.
        *   Applies gamma correction (gamma=2) by taking the square root of each color component.
        *   Writes the R, G, B components of the `pixelColor` (scaled from [0, 1] to [0, 255]) into the buffer at `offset`, `offset + 1`, `offset + 2`.
        *   Writes 255 (opaque) to the alpha channel at `offset + 3`.

## Implementation Guidance

*   Leverage the existing `Vec3` class and its methods extensively.
*   Pay close attention to vector directions (e.g., `v` vs `viewportV`).
*   Use `Point3` and `Color` type aliases appropriately for clarity.
*   Ensure trigonometric functions (like `tan`) use radians.
*   Use `readonly` for properties that are set in the constructor and never change.
*   Use `private` for internal implementation details (`u`, `v`, `w`, `world`).

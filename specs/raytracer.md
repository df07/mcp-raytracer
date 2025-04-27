# Spec: Raytracer MCP Tool

**Reference:** ["Ray Tracing in One Weekend"](https://raytracing.github.io/books/RayTracingInOneWeekend.html)

**Related Specs:** `specs/vec3.md`, `specs/ray.md`

**Goal:** Implement the MCP tool (`raytrace`) to generate an image based on the principles outlined in "Ray Tracing in One Weekend".
**Motivation:** Establish the basic framework for the raytracer, integrate it with the MCP server for visual output, and implement progress reporting.

## Core Raytracing Logic (`src/raytracer.ts`)

**Dependencies:** Utilizes `vec3`, `point3`, `color` types/classes from `src/vec3.ts` and the `ray` class from `src/ray.ts`.

### 1. Image Generation (`generateImageBuffer`)

*   **Purpose:** Orchestrates the image generation process based on ray tracing principles.
*   **Image Dimensions:** 
    *   Calculate image height based on a fixed `imageWidth` (e.g., 400 pixels) and a standard `aspectRatio` (e.g., 16:9).
*   **Camera Setup:**
    *   Define a virtual camera positioned at the origin (`0,0,0`).
    *   Define a virtual viewport positioned in front of the camera along the negative z-axis, based on a specified `focalLength` and `viewportHeight`.
    *   Calculate the viewport's width based on the image's aspect ratio.
    *   Determine the vectors representing the viewport's horizontal (`viewport_u`) and vertical (`viewport_v`) edges.
    *   Calculate the vectors representing the horizontal and vertical distance between adjacent pixel centers (`pixelDelta_u`, `pixelDelta_v`).
    *   Determine the 3D location corresponding to the center of the top-left pixel (`pixel00_loc`).
*   **Pixel Iteration:** Iterate through each pixel location `(j, i)` of the image.
    *   For each pixel, calculate the 3D location of the pixel's center in the viewport.
    *   Calculate the direction vector from the `cameraCenter` to the pixel's center.
    *   Construct a `ray` originating from the `cameraCenter` with the calculated direction.
    *   Determine the color for the current pixel by calling the `rayColor` function with the constructed `ray`.
    *   Write the determined `pixelColor` to the output image buffer using the `writeColorToBuffer` helper.

### 2. Ray Color Calculation (`rayColor`)

*   **Signature:** `function rayColor(r: ray): color`
*   **Purpose:** Determines the color contribution for a given ray cast into the scene.
*   **Current Behavior (Chapter 4 - Background):** 
    *   If the ray doesn't intersect any objects (always true for now), return a background color.
    *   The background color should be a vertical gradient, blending linearly from white (`1,1,1`) at the top to a light blue (`0.5, 0.7, 1.0`) at the bottom, based on the y-component of the ray's normalized direction vector.

### 3. Color Writing Helper (`writeColorToBuffer`)

*   **Signature:** `function writeColorToBuffer(pixelData: Buffer, offset: number, pixelColor: color): number`
*   **Purpose:** Translates a calculated `color` (represented as `vec3` with components in [0,1]) into RGB byte values and writes them to a raw image buffer.
*   **Functionality:** 
    *   Scale each color component (R, G, B) from the [0,1] range to the [0, 255] integer range.
    *   Clamp the scaled values to ensure they fall within [0, 255].
    *   Write the resulting R, G, B byte values into the provided `pixelData` buffer at the specified `offset`.
    *   Return the next buffer offset.

## MCP Integration & Setup

### 1. MCP Tool Definition (`src/index.ts`)

*   **Name:** `raytrace`
*   **Purpose:** Provides an MCP interface to trigger the raytracing process defined in `generateImageBuffer`.
*   **Parameters:**
    *   `verbose: boolean` (optional, default: `false`) - If true, enables progress logging during image generation.

### 2. Output Format

*   The `raytrace` tool must return the generated image data.
*   **Encoding:** Use the `sharp` library within `generateImageBuffer` to encode the raw pixel data buffer into a standard PNG format.
*   **MCP Response:** The tool's response must be an MCP `content` object with:
    *   `type: 'image'`
    *   `data`: The base64-encoded string of the PNG image buffer.
    *   `mimeType: 'image/png'`.

### 3. Progress Reporting

*   **Location:** Implemented within the `generateImageBuffer` function.
*   **Condition:** Progress messages should only be logged if the `verbose` parameter provided to the `raytrace` tool is `true`.
*   **Destination:** All progress messages must be written to `stderr` (e.g., using `console.error`) to avoid interfering with MCP communication over `stdout`.
*   **Content:** Log messages indicating the start of generation, the approximate number of scanlines remaining (updated periodically, e.g., every 10%), and the completion of the process.

### 4. Language

*   All implementation code must be in Typescript.

**Future Considerations:**

*   Adding hittable objects to the scene (Chapter 5).
*   Implementing surface normals and shading (Chapter 6).
*   Adding spheres and other geometric primitives.
*   Refactoring camera logic into its own class/module.
*   Adapting the output format for better display via MCP.
*   Adding parameters to the `raytrace` tool (e.g., image dimensions, scene selection).
*   Implementing subsequent chapters of the raytracing guide (rays, objects, materials, etc.). 
# Spec: Raytracer MCP Tool (Chapter 2)

**Reference:** ["Ray Tracing in One Weekend" - Chapter 2](https://raytracing.github.io/books/RayTracingInOneWeekend.html#outputanimage)
**Related Specs:** `specs/vec3.md`

**Goal:** Implement the initial MCP tool (`raytrace`) to generate a simple gradient image based on Chapter 2 ("Output an image") of the reference book.

**Motivation:** To establish the basic framework for the raytracer, integrate it with the MCP server for visual output, and implement progress reporting.

**Requirements:**

1.  **New MCP Tool:**
    *   **Name:** `raytrace` (defined in `src/index.ts`)
    *   **Purpose:** Triggers the generation and return of the raytraced image.
    *   **Parameters:**
        *   `verbose: boolean` (optional, default: `false`) - Enables progress logging to `stderr`.
2.  **Image Generation (`generateGradientPngBuffer` in `src/raytracer.ts`):**
    *   Generate an image with default dimensions (e.g., 256x256 pixels).
    *   The image should represent a color gradient.
    *   Pixel colors should vary based on their position (x, y coordinates), using the `color` type (see `specs/color.md`) for representation.
        *   Red component varies from 0.0 to 1.0 (left to right).
        *   Green component varies from 1.0 to 0.0 (top to bottom).
        *   Blue component is fixed (e.g., 0.25).
    *   Use the `writeColorToBuffer` helper (see `specs/color.md`) to write scaled pixel colors to a raw buffer.

4.  **Color Writing Helper (`writeColorToBuffer` in `src/raytracer.ts`):**
    *   **Signature:** `function writeColorToBuffer(pixelData: Buffer, offset: number, pixelColor: color): number`
    *   **Purpose:** Takes a `color` (vec3) object, scales components [0,1] to integers [0, 255], clamps them, and writes RGB to the `pixelData` buffer at `offset`.
    *   **Scaling/Clamping:** Use `Math.max(0, Math.min(255, Math.floor(255.999 * component)))`.
    *   **Return:** The updated buffer `offset`.

5.  **Output Format:**
    *   The `raytrace` tool should return the generated image data encoded as a PNG.
    *   Utilize the `sharp` library to convert the raw pixel buffer to a PNG buffer.
    *   The MCP response content should be of type `image`.
    *   The `data` field should contain the base64-encoded PNG data.
    *   The `mimeType` field should be `image/png`.
6.  **Language:**
    *   All implementation code must be in Typescript.
7.  **Progress Reporting:**
    *   If the `verbose` parameter is `true`, log progress to `stderr` (using `console.error`) within `generateGradientPngBuffer`.
    *   Log the start of generation.
    *   Log scanlines remaining approximately every 10% completion.
    *   Log the final "0 remaining" scanline.
    *   Log completion.
    *   If `verbose` is `false`, no progress messages should be logged.

**Implementation Plan:**

1.  Define the `raytrace` tool signature and handler in `src/index.ts`, including the optional `verbose` parameter.
2.  Implement the `generateGradientPngBuffer` function in `src/raytracer.ts`.
    *   Calculate pixel colors using the `color` type (requires `vec3` from `specs/vec3.md`).
    *   Use the `writeColorToBuffer` function specified above to populate a raw pixel buffer.
    *   Add conditional `stderr` logging based on the `verbose` parameter.
3.  Use the `sharp` library within `generateGradientPngBuffer` to encode the raw pixel buffer into a PNG buffer.
4.  Ensure the `raytraceToolHandler` calls `generateGradientPngBuffer` (passing `verbose`) and returns the PNG buffer in the correct MCP `image` content format (base64 encoded).

**Future Considerations:**

*   Adapting the output format for better display via MCP.
*   Adding parameters to the `raytrace` tool (e.g., image dimensions, scene selection).
*   Implementing subsequent chapters of the raytracing guide (rays, objects, materials, etc.). 
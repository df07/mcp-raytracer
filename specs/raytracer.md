# Spec: Basic Raytracer Integration (Chapter 2)

**Goal:** Implement the initial step of the raytracer based on Chapter 2 ("Output an image") of ["Ray Tracing in One Weekend"](https://raytracing.github.io/books/RayTracingInOneWeekend.html), outputting the result via a new MCP server tool.

**Motivation:** To establish the basic framework for the raytracer and integrate it with the MCP server for visual output.

**Requirements:**

1.  **New MCP Tool:**
    *   Create a new MCP server tool named `raytrace`.
    *   This tool will trigger the generation and return of the raytraced image.
    *   Initially, it will take no parameters, but this may change later.
    *   Add an optional boolean parameter `verbose` (defaulting to `false`).
2.  **Image Generation:**
    *   Generate an image with default dimensions of 256x256 pixels.
    *   The image should represent a color gradient.
    *   Pixel colors should vary based on their position (x, y coordinates).
        *   Red component should vary from left to right (0.0 to 1.0).
        *   Green component should vary from top to bottom (1.0 to 0.0).
        *   Blue component should be fixed (e.g., 0.25).
    *   Pixel color values should be scaled to the range [0, 255].
3.  **Output Format:**
    *   The `raytrace` tool should return the generated image data encoded as a PNG.
    *   The MCP response content should be of type `image`.
    *   The `data` field should contain the base64-encoded PNG data.
    *   The `mimeType` field should be `image/png`.
4.  **Language:**
    *   All implementation code must be in Typescript.
5.  **Progress Reporting:**
    *   If the `verbose` parameter is set to `true`, report progress during image generation by printing messages to `stderr` (using `console.error`).
    *   If `verbose` is `false` (or omitted), no progress messages should be logged.
    *   When enabled, logging should occur approximately every 10% of the total scanlines completed.
    *   The final line (0 remaining) should always be logged.
    *   This mimics the behavior described in the reference book, but reduces log verbosity.
    *   *(Limitation: This progress is visible in the server console, not necessarily in the client UI.)*

**Implementation Plan:**

1.  Define the `raytrace` tool signature within the MCP server framework, including the optional `verbose: boolean` parameter.
2.  Create a new Typescript module/file (e.g., `src/raytracer.ts`) to house the image generation logic.
3.  Install an image processing library (e.g., `sharp`).
4.  Update the `generateGradientPngBuffer` function to accept an optional `verbose` boolean parameter.
    *   Add conditional logging to `stderr` (e.g., `console.error`) within the pixel generation loop, only executing if `verbose` is true.
        *   Log the start of generation (e.g., "Generating image...").
        *   Log progress approximately every 10% of scanlines (e.g., "Scanlines remaining: X").
        *   Ensure the final state (0 remaining) is logged.
        *   Log completion (e.g., "Done generating image.").
5.  Use the library to encode the raw pixel data into a PNG buffer/base64 string.
6.  Update the `raytraceToolHandler` to accept the `verbose` argument from the tool call and pass it to `generateGradientPngBuffer`.
7.  Connect the `raytrace` tool to call this image generation function.
8.  Return the PNG data in the correct MCP `image` content format.

**Future Considerations:**

*   Adapting the output format for better display via MCP.
*   Adding parameters to the `raytrace` tool (e.g., image dimensions, scene selection).
*   Implementing subsequent chapters of the raytracing guide (vectors, rays, objects, etc.). 
# Spec: Basic Raytracer Integration (Chapter 2)

**Goal:** Implement the initial step of the raytracer based on Chapter 2 ("Output an image") of ["Ray Tracing in One Weekend"](https://raytracing.github.io/books/RayTracingInOneWeekend.html), outputting the result via a new MCP server tool.

**Motivation:** To establish the basic framework for the raytracer and integrate it with the MCP server for visual output.

**Requirements:**

1.  **New MCP Tool:**
    *   Create a new MCP server tool named `raytrace`.
    *   This tool will trigger the generation and return of the raytraced image.
    *   Initially, it will take no parameters, but this may change later.
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

**Implementation Plan:**

1.  Define the `raytrace` tool signature within the MCP server framework.
2.  Create a new Typescript module/file (e.g., `src/raytracer.ts`) to house the image generation logic.
3.  Install an image processing library (e.g., `sharp`).
4.  Implement the Typescript function to generate raw pixel data for the gradient.
5.  Use the library to encode the raw pixel data into a PNG buffer/base64 string.
6.  Connect the `raytrace` tool to call this image generation function.
7.  Return the PNG data in the correct MCP `image` content format.

**Future Considerations:**

*   Adapting the output format for better display via MCP.
*   Adding parameters to the `raytrace` tool (e.g., image dimensions, scene selection).
*   Implementing subsequent chapters of the raytracing guide (vectors, rays, objects, etc.). 
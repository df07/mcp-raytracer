// Import necessary items directly from src/mcp.js
import { greetToolHandler, showImageToolHandler } from "../src/mcp.js"; 
import fs from "fs/promises"; // Import fs normally
import path from "path";
import { jest } from '@jest/globals'; 

// We use jest.spyOn to mock fs.readFile for the showImageToolHandler tests.

describe("MCP Server (src/index.ts)", () => {

  // Use more specific type for the spy instance
  let readFileSpy: jest.SpiedFunction<typeof fs.readFile>;
  let consoleErrorSpy: jest.SpiedFunction<typeof console.error>; // Add type for console spy

  beforeEach(() => {
    // Reset all mocks (useful if other mocks are added later)
    jest.clearAllMocks(); 
    // Spy on fs.readFile
    readFileSpy = jest.spyOn(fs, 'readFile').mockImplementation(async () => { 
      // This default implementation will throw if called unexpectedly
      throw new Error("fs.readFile mock called unexpectedly"); 
    });
    // Spy on console.error and silence it
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original implementations after each test
    jest.restoreAllMocks();
  });

  // --- Tool Handler Tests ---

  describe("Tool: greetToolHandler", () => {
    it("should return a text greeting including the provided name", async () => {
      const result = await greetToolHandler({ name: "Tester" });
      expect(result).toEqual({
        content: [{ type: "text", text: `Hi there, Tester!` }],
      });
      // Verify readFile was NOT called in this test
      expect(readFileSpy).not.toHaveBeenCalled();
    });
  });

  describe("Tool: showImageToolHandler", () => {
    const mockImageData = Buffer.from("fake-image-data");
    const mockBase64Data = mockImageData.toString('base64');

    it("should return image content when file read is successful", async () => {
      // Use the spy to provide a resolved value for this test
      readFileSpy.mockResolvedValue(mockImageData);
      
      const result = await showImageToolHandler();

      // Expect on the spy instance
      expect(readFileSpy).toHaveBeenCalledWith(expect.stringContaining(path.join('assets', 'red-circle.png')));
      expect(result).toEqual({
        content: [
          {
            type: "image",
            data: mockBase64Data,
            mimeType: "image/png",
          },
        ],
      });
    });

    it("should return an error message when file read fails", async () => {
      const errorMessage = "File not found";
      const testError = new Error(errorMessage);
      // Use the spy to provide a rejected value for this test
      readFileSpy.mockRejectedValue(testError);
      
      const result = await showImageToolHandler();

      // Expect on the spy instance
      expect(readFileSpy).toHaveBeenCalledWith(expect.stringContaining(path.join('assets', 'red-circle.png')));
      expect(result).toEqual({
        content: [
          {
            type: "text",
            text: `Error processing image for showImage tool: ${errorMessage}`,
          },
        ],
        isError: true,
      });
    });
  });

}); 
# Project Rules - Quick Reference

# Core Coding Checklist
1. Follow rules .github/copilot-instructions.md when writing code; suggest updates when needed.
2. Always have a spec in `specs/`; review before coding and keep updated.
3. Follow testing guidelines and ensure adequate test coverage.

# Execution context
- Run builds with `npm run build` and tests with `npm run test`
- Run benchmarks with `benchmark.ps1` and check results in `benchmark_results/`.
- Usually we are executing code in Powershell, so use ";" as a command separator.

# TypeScript Idioms
- Use `PascalCase` for classes, interfaces, type aliases, and enums.
- Use `camelCase` for variables, functions, methods, and properties.
- Prefer `get` accessors over `getX()` methods for simple property retrieval.
- Mark internal implementation details as `private`.
- Use `readonly` for properties that should not change after object construction.
- Only use explicit `public` when needed for clarity.

## Immutability
- Favor methods that return new instances rather than modifying the original object.
- Avoid mutating arguments passed as "out parameters".
- Return new data structures or `null`/`undefined` instead of modifying passed objects.
- Exception: Document clearly when mutating objects for performance optimization.

# MCP Server Rules
- To test MCP, call the "raytrace" tool that this project exposes for testing.
- You can't start the MCP server yourself. Ask the user to restart it manually.
- Use `stderr` for logs when using `StdioServerTransport` (use `console.error`).
- Avoid `stdout` (e.g., `console.log`) as it interferes with MCP JSON-RPC communication.

# Specification Management
- Place all specification files (.md) inside the 'specs/' directory.
- Keep specs concise and focused on one feature or component.
- Prefer bullet points and lists over long prose.
- Include concrete examples where appropriate.
- Focus on *what* needs to be built and *why*, not *how* (unless critical).
- Add spec references in code: `/* Specs: feature.md */` near the top of TypeScript files.

# Testing Guidelines
- Use Jest as the primary testing framework.
- Place all test files in the top-level `/tests` directory.
- Name test files using the pattern `[filename].test.ts`.
- Mirror the `src` directory structure in `/tests` where appropriate.
- Structure tests using `describe`, `it` (or `test`), and `expect` blocks.
- Follow Arrange-Act-Assert (AAA) pattern within each test case.
- Keep tests independent and runnable in any order.
- Use specific Jest matchers for assertions.
- Use Jest's mocking capabilities to isolate the unit under test.
- Use `async/await` for asynchronous tests.
- Avoid complex logic within tests.
- Focus on meaningful test coverage, not just high percentages.
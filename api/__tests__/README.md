# Testing with Vitest and Cloudflare Workers

This project uses Vitest with the Cloudflare Workers integration for testing. The setup provides both unit and integration testing capabilities.

## Setup

The testing setup includes:

- **Vitest**: Fast testing framework
- **@cloudflare/vitest-pool-workers**: Cloudflare Workers integration for Vitest
- **TypeScript support**: Full type checking for tests

## Configuration Files

- `vitest.config.ts`: Main Vitest configuration using Cloudflare Workers pool
- `test/tsconfig.json`: TypeScript configuration for tests
- `test/env.d.ts`: Environment type declarations

## Running Tests

```bash
# Run tests in watch mode (recommended for development)
pnpm test

# Run tests once
pnpm test:run

# Run tests with UI (if available)
pnpm test:ui
```

## Test Files

### `simple.test.ts`
Integration tests using the `SELF` fetcher approach. These tests:
- Test the main worker endpoints
- Create rooms and verify their state
- Test WebSocket upgrade handling
- Verify CORS and error handling

### `unit.test.ts` and `integration.test.ts`
Alternative test approaches (may have type issues with current setup).

### `gameroom.test.ts`
Tests for GameRoom functionality and dice rolling logic.

## Writing Tests

### Integration Tests (Recommended)
Use the `SELF` fetcher for integration tests:

```typescript
import { SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";

describe("My Worker", () => {
  it("responds correctly", async () => {
    const response = await SELF.fetch("http://example.com/");
    expect(response.status).toBe(200);
  });
});
```

### Unit Tests
For unit tests, you can import and test individual functions:

```typescript
import { env } from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src";

describe("Worker Unit Tests", () => {
  it("handles requests", async () => {
    const request = new Request("http://example.com/");
    const response = await worker.fetch(request, env);
    expect(response.status).toBe(200);
  });
});
```

## Features

- **Hot Module Reloading**: Tests automatically re-run when code changes
- **Isolated Storage**: Each test runs with isolated storage (enabled by default)
- **Type Safety**: Full TypeScript support with proper type checking
- **Runtime Compatibility**: Tests run in the same runtime as production Workers

## Troubleshooting

### Type Errors
If you encounter type errors, make sure:
1. The `worker-configuration.d.ts` file is up to date (run `pnpm cf-typegen`)
2. The test TypeScript configuration includes the correct types
3. The environment type declaration is properly set up

### Test Failures
- Check that your Worker is properly configured in `wrangler.jsonc`
- Ensure all required bindings are available in the test environment
- Verify that the compatibility date is set correctly

## Resources

- [Cloudflare Workers Vitest Integration Guide](https://developers.cloudflare.com/workers/testing/vitest/)
- [Vitest Documentation](https://vitest.dev/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/) 
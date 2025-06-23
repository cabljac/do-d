interface RateLimiter {
  check(identifier: string, limit: number, windowMs: number): Promise<boolean>;
}

// In-memory rate limiter for development
class InMemoryRateLimiter implements RateLimiter {
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();

  async check(identifier: string, limit: number, windowMs: number): Promise<boolean> {
    const now = Date.now();
    const record = this.rateLimitMap.get(identifier);

    if (!record || record.resetTime < now) {
      this.rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= limit) {
      return false;
    }

    record.count++;
    return true;
  }
}

// Cloudflare rate limiter for production
class CloudflareRateLimiter implements RateLimiter {
  constructor(private env: any) {}

  async check(identifier: string, limit: number, windowMs: number): Promise<boolean> {
    // Cloudflare's rate limiting is configured in wrangler.toml
    // This is a placeholder that always returns true since CF handles it at the edge
    // In a real implementation, you might use Durable Objects or KV for custom logic
    return true;
  }
}

// No-op rate limiter for tests
class NoOpRateLimiter implements RateLimiter {
  async check(): Promise<boolean> {
    return true;
  }
}

// Factory function to get the appropriate rate limiter
export function getRateLimiter(env?: any): RateLimiter {
  // Check if we're in a test environment
  if (globalThis.process?.env?.NODE_ENV === "test") {
    return new NoOpRateLimiter();
  }

  // Check if we have Cloudflare environment (production)
  if (env?.ENVIRONMENT === "production") {
    return new CloudflareRateLimiter(env);
  }

  // Default to in-memory for development
  return new InMemoryRateLimiter();
}

// Helper function for backward compatibility
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number,
  env?: any,
): Promise<boolean> {
  const rateLimiter = getRateLimiter(env);
  return rateLimiter.check(identifier, limit, windowMs);
}

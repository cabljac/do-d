export function getSecurityHeaders(corsHeaders: Record<string, string>): Record<string, string> {
  return {
    ...corsHeaders,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": "default-src 'self'; connect-src 'self' wss: https:",
  };
}

export function sanitizeInput(input: string, maxLength: number = 1000): string {
  return input
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: URLs
    .trim()
    .slice(0, maxLength);
}

export function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

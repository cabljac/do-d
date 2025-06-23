# Rate Limiting Documentation

## Overview

three-tier rate limiting strategy:

1. **Test Environment**: No rate limiting (for CI/CD)
2. **Development Environment**: In-memory rate limiting
3. **Production Environment**: Cloudflare's edge rate limiting

## Configuration

### Development (Local)
- Uses `--env dev` flag with `ENVIRONMENT: "development"`
- In-memory rate limiting with these defaults:
  - Room creation: 5 per hour per IP
  - WebSocket connections: 10 per minute per IP
  - State requests: 30 per minute per IP/room

### Staging
- Uses `--env staging` flag with `ENVIRONMENT: "staging"`
- In-memory rate limiting (same as development)
- Deployed as `vtt-game-staging` worker

### Production
- Default environment with `ENVIRONMENT: "production"`
- Cloudflare Rate Limiting Rules should be configured in the dashboard
- See `cloudflare-rate-limit.example.json` for recommended rules
- Deployed as `vtt-game` worker

## Cloudflare Rate Limiting Setup

1. Go to Cloudflare dashboard
2. Navigate to Security > WAF > Rate limiting rules
3. Create rules based on `cloudflare-rate-limit.example.json`
4. Recommended actions:
   - `challenge`: Shows CAPTCHA for suspicious traffic
   - `block`: Blocks traffic exceeding limits

## Rate Limits

| Endpoint | Limit | Window | Identifier |
|----------|-------|---------|------------|
| `/api/room/create` | 5 | 1 hour | IP address |
| `/room/{id}/ws` | 10 | 1 minute | IP address |
| `/room/{id}/state` | 30 | 1 minute | IP + Room ID |

## Testing Rate Limiting

### Local Development
```bash
# Start dev server
pnpm dev

# Test rate limiting with curl
for i in {1..6}; do
  curl -X POST http://localhost:8787/api/room/create \
    -H "Content-Type: application/json" \
    -d '{"password":"test"}'
done
# 6th request should be rate limited
```

### Production
Rate limiting is handled at Cloudflare's edge before requests reach your Worker.

## Monitoring

- Check Cloudflare Analytics > Security for rate limit hits
- Set up alerts for high rate limit violations
- Monitor 429 response codes in your logs
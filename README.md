# Durable Objects & Dragons

A real-time, multiplayer virtual tabletop application built with modern web technologies, designed for tabletop gaming sessions with features like game boards, tokens, dice rolling, and chat.

[![Bundle Analysis](https://github.com/cabljac/do-d/actions/workflows/analyze.yml/badge.svg)](https://github.com/cabljac/virtual-tabletop/actions/workflows/analyze.yml)
[![Tests](https://github.com/cabljac/do-d/actions/workflows/test.yml/badge.svg)](https://github.com/cabljac/virtual-tabletop/actions/workflows/test.yml)
[![Biome](https://github.com/cabljac/do-d/actions/workflows/biome.yml/badge.svg)](https://github.com/cabljac/virtual-tabletop/actions/workflows/biome.yml)

## 📊 Reports & Analysis

- **📦 [Bundle Analysis](https://cabljac.github.io/do-d/)** - JavaScript and CSS bundle size analysis
- **🔍 [Quality Reports](https://cabljac.github.io/do-d/quality/)** - Test coverage and performance results
- **📋 [All Reports](https://cabljac.github.io/do-d/reports.html)** - Complete reports index

## Architecture Overview

### Technology Stack

#### Backend
- **Cloudflare Workers**: Serverless edge computing platform for the API
- **Durable Objects**: Stateful serverless computing for persistent game rooms
- **WebSockets**: Real-time bidirectional communication
- **SQLite**: Game state persistence (via Durable Objects)
- **TypeScript**: Type-safe development

#### Frontend
- **Vite**: Fast build tool and development server
- **TypeScript**: Type-safe development
- **Canvas API**: High-performance game board rendering
- **WebSockets**: Real-time updates from the server

### Why Durable Objects?

Durable Objects were chosen as the core technology for this virtual tabletop application due to their unique WebSocket handling capabilities and cost optimization features:

#### WebSocket Hibernation
Unlike traditional WebSocket servers that must remain in memory to maintain connections, Durable Objects support **WebSocket Hibernation** - a Cloudflare-specific feature that allows WebSocket connections to remain active even when the Durable Object is evicted from memory during periods of inactivity.

**Key Benefits:**
- **Cost Optimization**: No billable duration (GB-seconds) charges during idle periods
- **Scalability**: Single Durable Object instance can handle thousands of WebSocket connections
- **Automatic Recovery**: When a message arrives, the Durable Object is automatically recreated and the message is delivered to the appropriate handler
- **Persistent Connections**: Clients stay connected even when the server-side object is hibernated

#### Single-Point Coordination
Durable Objects provide a single point of coordination between multiple clients, making them ideal for:
- **Multiplayer Game State**: All players in a game room share the same Durable Object instance
- **Real-time Synchronization**: Game state updates are broadcast to all connected players
- **State Persistence**: Game state is automatically saved and survives object hibernation

#### Architecture Comparison

| Feature | Traditional WebSocket Server | Durable Objects |
|---------|------------------------------|-----------------|
| Memory Usage | Always in memory | Hibernates when idle |
| Cost Model | Pay for idle time | Pay only when active |
| Scalability | Limited by memory | Thousands of connections per instance |
| State Management | Requires external storage | Built-in persistence |
| Recovery | Manual reconnection logic | Automatic message delivery |

This architecture enables the virtual tabletop to support multiple concurrent game rooms with minimal infrastructure costs while maintaining real-time responsiveness for all players.

### Project Structure

```
virtual-tabletop/
├── api/                    # Backend API package
│   ├── src/
│   │   ├── GameRoom.ts    # Durable Object for game state
│   │   ├── index.ts       # Worker entry point & routing
│   │   └── utils/         # Security and rate limiting
│   └── __tests__/         # API test suite
├── website/               # Frontend package
│   ├── src/
│   │   ├── canvas/       # Game board rendering
│   │   ├── components/   # UI components
│   │   ├── services/     # API communication
│   │   └── managers/     # State management
│   └── __tests__/        # Frontend test suite
└── turbo.json           # Monorepo configuration
```

## Features

### Core Functionality
- **Real-time Multiplayer**: WebSocket-based synchronization across all players
- **Persistent Game State**: Automatic saving via Durable Objects
- **Interactive Canvas**: Drag-and-drop token management with grid-based movement
- **Token Management**: Create, move, and customize tokens with properties
- **Dice Rolling**: Multiple dice types with visual feedback (`/roll 2d6+3`)
- **Chat System**: Real-time messaging with dice roll integration
- **Player Management**: Join/leave notifications, player list, and permissions
- **Room Management**: Create and join game rooms with optional passwords

### Accessibility
- WCAG 2.1 AA compliant
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Automated accessibility testing with axe-core

## Development

### Prerequisites

- Node.js 22.0.0 or higher (required for WebSocket API support)
- pnpm 8.0.0 or higher (enforced)

### Getting Started

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev
# API runs on http://localhost:8787
# Website runs on http://localhost:5173

# Run tests
pnpm test

# Build for production
pnpm build

# Format and lint code
pnpm format-and-lint
```

### Development Tools

- **Biome**: Fast formatter and linter for TypeScript/JavaScript
- **Vitest**: Unit testing framework with native TypeScript support
- **Playwright**: End-to-end testing for accessibility and functionality
- **Lighthouse CI**: Performance testing and monitoring
- **Turbo**: Build system orchestration for the monorepo
- **Wrangler**: Cloudflare Workers CLI for local development

### Environment Variables

#### API (`api/wrangler.jsonc`)
- `FRONTEND_URL`: Allowed origin for CORS (default: `http://localhost:3000`)
- `ENVIRONMENT`: Environment name (`development`, `staging`, `production`)
- `CREATE_ROOM_API_KEY`: API key required for room creation

#### Website
- No environment variables required for local development
- Production deployment handled via Cloudflare Pages

## Security

### Authentication & Authorization
- **API Key Authentication**: Room creation requires a valid API key via `X-API-Key` header
- **Password-Protected Rooms**: Optional password protection for game sessions
- **Player Identification**: Unique player IDs generated per session

### Rate Limiting

Multiple levels of rate limiting protect against abuse:

| Endpoint | Limit | Window | Identifier |
|----------|-------|--------|------------|
| Room Creation | 5 | 1 hour | IP Address |
| WebSocket Connections | 10 | 1 minute | IP Address |
| Room State Requests | 30 | 1 minute | IP + Room ID |

### Security Headers

All API responses include comprehensive security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: default-src 'self'; connect-src 'self' wss: https:`

### Input Validation
- Sanitization of user inputs (chat messages, player names)
- URL validation for external links
- Maximum length enforcement
- HTML tag stripping
- JavaScript URL prevention

## Testing Strategy

### Unit Tests
- Vitest for both API and website
- Mock WebSocket connections
- Isolated component testing
- Coverage tracking with V8

### Integration Tests
- API endpoint testing
- WebSocket communication testing
- State synchronization verification

### E2E Tests
- Playwright for user flows
- Accessibility testing with axe-core
- Performance testing with Lighthouse
- Cross-browser compatibility

```bash
# Run all tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm -F website test:coverage

# Run accessibility tests
pnpm -F website test:a11y

# Run performance tests
pnpm -F website test:perf
```

## CI/CD Pipeline

### GitHub Actions Workflows

#### 1. Testing (`test.yml`)
- Runs on every push and pull request
- Executes unit tests with coverage reporting
- Tests both API and website packages
- Requires all tests to pass for merge

#### 2. Code Quality (`biome.yml`)
- Enforces consistent code formatting
- Runs linting checks
- Blocks PRs with formatting issues

#### 3. Bundle Size Check (`size-check.yml`)
- Monitors production bundle size
- Enforces 100KB limit for optimal performance
- Provides detailed size reports on PRs

#### 4. Reports & Analysis (`analyze.yml`)
- Generates comprehensive quality reports
- Lighthouse performance testing
- Test coverage visualization
- Bundle analysis with file breakdown
- Deploys reports to GitHub Pages

### Deployment

#### API Deployment
```bash
# Production
pnpm -F api deploy

# Staging
pnpm -F api deploy:staging
```

#### Website Deployment
```bash
# Production
pnpm -F website deploy

# Staging
pnpm -F website deploy:staging
```

## Infrastructure & Costs

### Cloudflare Workers (API)
- **Free Tier**: 100,000 requests/day
- **Paid Tier**: $5/month for 10M requests + $0.50/million additional
- **Durable Objects**: $0.15/million requests + storage costs

### Cloudflare Pages (Website)
- **Free Tier**: Unlimited requests, 500 builds/month
- **No bandwidth charges**

### Estimated Monthly Costs

For a typical deployment with moderate usage:
- **Low Usage** (< 100k requests/day): $0 (free tier)
- **Medium Usage** (1M requests/day): ~$5-10/month
- **High Usage** (10M requests/day): ~$15-25/month

Cost factors include:
- Number of WebSocket connections
- Frequency of state updates
- Storage usage for game rooms
- Geographic distribution of users

### Performance Targets
- **Bundle Size**: < 100KB (enforced by CI)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **WebSocket Latency**: < 100ms (varies by region)

## Monitoring & Observability

### Cloudflare Analytics
- Request metrics and error rates
- Geographic distribution
- Performance metrics
- Durable Object analytics

### Error Tracking
- Console error logging
- Structured error responses
- Client-side error boundaries

### Performance Monitoring
- Lighthouse CI for performance regression
- Bundle size tracking
- Core Web Vitals monitoring

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (commits will be signed by CI)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Write tests for new features
- Maintain < 100KB bundle size
- Follow existing code patterns
- Update documentation as needed
- Ensure accessibility compliance
- Use pnpm for all package operations

## License

MIT License - see LICENSE file for details.

## Support

For issues, feature requests, or questions:
- GitHub Issues: https://github.com/cabljac/virtual-tabletop/issues
- Documentation: https://cabljac.github.io/virtual-tabletop/

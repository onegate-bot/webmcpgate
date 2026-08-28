# Autonomous Agent Readiness & WebMCP Testing Suite (AART)

A complete, production-ready framework for evaluating, linting, and continuously gating websites for AI Agent readiness, Model Context Protocol (WebMCP), Schema.org linked data, and Generative Engine Optimization (GEO).

## Contents

- **`agent-readiness/`**: Generic, schema-agnostic evaluation engine & CLI (4-dimension audit).
- **`tests/`**: Unit & integration test suites using Vitest and Cheerio.
- **`public/`**: Ready-to-deploy `webmcp-manifest.json`, `llms.txt`, and `.well-known/webmcp.json` templates.
- **`.github/workflows/`**: Universal GitHub Actions CI/CD pipelines to enforce a score gate (default `>= 9.0/10.0`).
- **`docs/`**: Comprehensive markdown reports and audit documentation.

## Quick Start

```bash
# Install dependencies
npm install

# Run the generic CLI evaluation against any URL
TARGET_URL=https://dev.zivisaiah.com npm run audit

# Run unit tests (static schemas, JSON-LD, WebMCP)
npm run test:unit

# Run integration tests (WAF, live bot UA probing, MCP tool endpoints)
TEST_BASE_URL=https://dev.zivisaiah.com npm run test:integration
```

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Super Protocol integration solution for Langflow - a powerful visual AI workflow builder. The solution runs Langflow as a secure tunnel client within the Super Protocol ecosystem, enabling users to build, deploy, and manage AI workflows in a privacy-preserving environment.

## Architecture

### Core Components

**Tunnel Client Integration** (`src/index.ts`):
- Main entry point that initializes the Super Protocol tunnel client
- Reads configuration from `/sp/inputs` and establishes secure tunnel connections
- Uses `@super-protocol/tunnels-lib` for tunnel management

**Langflow Server Management** (`src/server.ts`):
- Worker thread that manages the Langflow Python application
- Handles TLS certificate provisioning from environment variables
- Spawns the `langflow run` command with HTTPS configuration
- Manages Langflow's database and cache directories

**Configuration System**:
- `src/config.ts` - Main configuration including blockchain URLs, paths, and timeouts  
- `src/server-config.ts` - Server-specific configuration for TLS and Langflow paths
- Environment variable validation with `src/env-utils.ts`

### Langflow Integration

**Submodule Structure**:
- `langflow/` contains the full Langflow codebase as a git submodule
- Backend Python components in `langflow/src/backend/`
- Frontend React/TypeScript components in `langflow/src/frontend/`
- Comprehensive documentation in `langflow/docs/`

**Runtime Environment**:
- Langflow runs with SQLite database at `/sp/output/langflow.db`
- Cache directory mounted at `/sp/inputs/cache`
- Environment variables automatically stored and managed

## Common Development Commands

### TypeScript Build & Development
```bash
# Build the tunnel client TypeScript code
npm run build

# The solution has no npm start script - use Docker for running
```

### Docker Development
```bash
# Build the multi-stage Docker image
docker build -t sp-langflow .

# Run with docker-compose (handles volume mounts and environment)
docker-compose up

# The build process installs both Node.js and Python dependencies
```

### Langflow Submodule Development
```bash
# Initialize and update the Langflow submodule
git submodule update --init --recursive

# For Langflow development (inside langflow/ directory):
make init                    # Setup backend/frontend dependencies
make install_backend         # Install Python dependencies with uv
make install_frontend        # Install Node.js dependencies  
make build_frontend          # Build React frontend
uv run langflow run          # Start Langflow directly

# Langflow runs on http://localhost:7860 when run directly
```

## Key Configuration

### Required Environment Variables
- `BLOCKCHAIN_URL` - Super Protocol blockchain endpoint
- `BLOCKCHAIN_CONTRACT_ADDRESS` - Contract address for tunnel configuration
- `HTTPS_PORT` - Port for Langflow HTTPS server
- `TLS_KEY` - TLS private key for HTTPS
- `TLS_CERT` - TLS certificate for HTTPS

### Directory Structure
- `/sp/inputs` - Configuration files and tunnel certificates
- `/sp/output` - Langflow database and persistent data
- `/sp/inputs/cache` - Langflow cache directory
- `dist/` - Compiled TypeScript output
- `langflow/` - Langflow submodule source code

### Tunnel Configuration
The solution reads tunnel configuration from:
- `/sp/inputs/input-0002/tunnel-client-config.json` - Tunnel client settings
- Certificate files in `/sp/inputs/input-0002/` for tunnel authentication

## Multi-Stage Docker Build

**Builder Stage**:
- Node.js 20 environment for TypeScript compilation
- Installs dependencies and builds the tunnel client
- Optimized with npm cache mounting

**Runtime Stage**:
- Python 3.12 base with Node.js 20 installed
- Uses `uv` for fast Python package management
- Installs Langflow system-wide with `uv pip install --system langflow`
- Copies built tunnel client and Langflow submodule
- Creates required Super Protocol directories (`/sp/inputs`, `/sp/output`, `/sp/run`, `/sp/secrets`)
- Runs as root (required for Super Protocol environment)

## Integration Points

### Super Protocol Ecosystem
- Uses `@super-protocol/tunnels-lib` for secure tunnel management
- Leverages `@super-protocol/solution-utils` for configuration parsing
- Integrates with Super Protocol's TEE (Trusted Execution Environment)

### Langflow Features
- Visual workflow builder with drag-and-drop interface
- Support for major LLM providers (OpenAI, Anthropic, etc.)
- Vector database integrations
- Multi-agent orchestration capabilities  
- API deployment and MCP server functionality

## Development Notes

### Logging
- Uses `pino` structured logging throughout
- Child loggers created per module for better traceability
- Log level configurable via `LOG_LEVEL` environment variable

### Error Handling
- Graceful shutdown on SIGINT/SIGTERM signals
- Proper cleanup of tunnel connections and child processes
- Error propagation from Langflow server to tunnel client

### Security Considerations
- TLS certificates handled securely in memory and temp files
- Root execution required for Super Protocol TEE environment
- Isolated file system with proper permission management
- Environment variable validation prevents startup with missing required config

### Worker Thread Architecture
- Main process (`src/index.ts`) manages tunnel client connections
- Langflow server runs in separate Node.js worker thread (`src/server.ts`)
- Inter-process communication handled via worker thread messaging
- Graceful shutdown propagated from main process to worker thread
# My Project

A monorepo using pnpm workspaces with frontend and backend applications.

## Project Structure

```
my-project/
├── frontend/          # Frontend application
├── backend/           # Backend API server
├── package.json       # Root package.json
└── pnpm-workspace.yaml # Workspace configuration
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
# Install dependencies for all workspaces
pnpm install
```

### Development

```bash
# Start all workspaces in development mode
pnpm dev

# Start specific workspace
pnpm --filter frontend dev
pnpm --filter backend dev
```

### Building

```bash
# Build all workspaces
pnpm build

# Build specific workspace
pnpm --filter frontend build
pnpm --filter backend build
```

### Testing

```bash
# Run tests for all workspaces
pnpm test

# Run tests for specific workspace
pnpm --filter frontend test
pnpm --filter backend test
```

## Workspace Commands

- `pnpm --filter <workspace-name> <command>` - Run command in specific workspace
- `pnpm --parallel --recursive <command>` - Run command in all workspaces in parallel
- `pnpm --recursive <command>` - Run command in all workspaces sequentially

## Adding Dependencies

```bash
# Add dependency to specific workspace
pnpm --filter frontend add react-router-dom

# Add dev dependency to specific workspace
pnpm --filter backend add -D jest

# Add dependency to root workspace
pnpm add -w typescript
```

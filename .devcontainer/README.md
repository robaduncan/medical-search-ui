# DevContainer Setup for Medical Data Search UI

This devcontainer provides a complete development environment for the React-based Medical Data Search UI project.

## Features

- **Node.js 20** with npm, yarn, and pnpm available
- **VS Code Extensions** pre-configured for React/TypeScript development:
  - Prettier for code formatting
  - ESLint for code linting 
  - TypeScript support
  - Tailwind CSS IntelliSense
  - Playwright for testing
  - JSON language support

- **Port Forwarding** configured for:
  - Port 3000 (Create React App dev server)
  - Port 5173 (Vite dev server)

- **Development Tools**:
  - Git and GitHub CLI
  - Docker-in-Docker for containerized testing
  - Node modules volume mount for better performance

## Getting Started

1. Open this project in VS Code
2. When prompted, click "Reopen in Container" or use the Command Palette: `Dev Containers: Reopen in Container`
3. Wait for the container to build and install dependencies
4. Start developing!

## Project Structure Expected

After setup, you can initialize your React project with either:

```bash
# Using Create React App
npx create-react-app medical-search-ui --template typescript
cd medical-search-ui

# Or using Vite (recommended for faster development)
npm create vite@latest medical-search-ui -- --template react-ts
cd medical-search-ui
npm install
```

## Environment Variables

The devcontainer sets `NODE_ENV=development` by default. You may want to add:

- `REACT_APP_FHIR_BASE_URL` - for the OntoServer endpoint
- `REACT_APP_OFFLINE_MODE` - to toggle between live API and local JSON files

## Performance

The devcontainer uses a named volume for `node_modules` to improve file system performance, especially on Windows/macOS with Docker Desktop. 
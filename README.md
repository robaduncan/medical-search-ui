# Medical Data Search UI

A React TypeScript application for searching medical procedures and diagnoses using FHIR ValueSet `$expand` and CodeSystem `$lookup` operations with SNOMED CT terminologies.

## 📚 Documentation Navigation

### Quick Start

- [Getting Started](#getting-started) - Installation and setup
- [Development Setup](docs/Development.md) - DevContainer and local development
- [Configuration](#configuration) - Environment variables and settings

### Technical Documentation

- [🏗️ Architecture Overview](docs/Architecture.md) - Code structure, patterns, and design decisions
- [🧪 Testing Strategy](docs/Testing.md) - Comprehensive test coverage and methodology
- [⚛️ Component Guide](docs/Components.md) - Detailed component documentation and usage
- [🔌 API Integration](docs/API.md) - FHIR endpoints, data flow, and error handling

### Project Resources

- [Project Structure](#project-structure) - File organization
- [Sample Data](#sample-data) - Test files and offline mode
- [Contributing Guidelines](#contributing) - Development standards

---

## Table of Contents

- [Project Overview](#project-overview)
- [Getting Started](#getting-started)
- [Features](#features)
- [Configuration](#configuration)
- [Testing](#testing)
- [Project Structure](#project-structure)
- [Sample Data](#sample-data)
- [Contributing](#contributing)

## Project Overview

This application implements a comprehensive medical terminology search interface that:

1. **🔍 Search Phase**: Type-ahead search using FHIR ValueSet `$expand` with SNOMED CT concepts
2. **📋 Detail Phase**: Detailed concept lookup via CodeSystem `$lookup` endpoint
3. **📊 Display Phase**: Rich presentation of medical concept relationships and properties

### Key Technical Features

- **Comprehensive Test Coverage**: 247+ unit tests across all components and services
- **DRY Architecture**: Single Responsibility Pattern with modular design
- **Error Resilience**: Robust error handling for API failures and edge cases
- **Accessibility**: Full WCAG compliance with keyboard navigation
- **Offline Development**: Local sample data for consistent testing

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- VS Code (recommended for DevContainer support)

### Quick Installation

```bash
# Clone repository
git clone <repository-url>
cd medical-search-ui

# Install dependencies
npm install

# Start development server
npm run dev
# Opens on http://localhost:3000

# Run comprehensive test suite
npm test
```

### Development Modes

**Online Mode** (Default):

```bash
VITE_OFFLINE_MODE=false npm run dev
```

- Queries live OntoServer FHIR endpoints
- Real-time SNOMED CT data
- Network error handling

**Offline Mode** (Development):

```bash
VITE_OFFLINE_MODE=true npm run dev
```

- Uses local sample JSON files
- Consistent testing environment
- No network dependencies

## Features

### 🔍 Search Capabilities

- **Debounced Type-ahead**: 300ms delay with configurable timing
- **Real-time Suggestions**: Live SNOMED CT concept matching
- **Smart Filtering**: Handles partial matches and synonyms
- **Keyboard Navigation**: Arrow keys, Enter, Escape support

### 📊 Data Presentation

- **Comprehensive Details**: Definitions, synonyms, relationships
- **Hierarchical Display**: Parent/child concept navigation
- **Designation Management**: Multiple language and use case support
- **Property Visualization**: SNOMED CT metadata and attributes

### 🛡️ Robustness Features

- **Error Boundaries**: Graceful degradation on failures
- **Loading States**: Clear user feedback during operations
- **Network Resilience**: Retry logic and timeout handling
- **Data Validation**: Comprehensive input sanitization

## Configuration

### Environment Variables

Create `.env` file:

```bash
# FHIR Server Configuration
VITE_FHIR_BASE_URL=https://r4.ontoserver.csiro.au/fhir
VITE_OFFLINE_MODE=false

# UI Behavior
VITE_DEBOUNCE_DELAY=300
VITE_DEFAULT_COUNT=100
```

### Configuration Options

| Variable              | Default    | Description                |
| --------------------- | ---------- | -------------------------- |
| `VITE_FHIR_BASE_URL`  | OntoServer | FHIR endpoint base URL     |
| `VITE_OFFLINE_MODE`   | `false`    | Enable offline sample data |
| `VITE_DEBOUNCE_DELAY` | `300`      | Search input delay (ms)    |
| `VITE_DEFAULT_COUNT`  | `100`      | Max search results         |

## Testing

### Comprehensive Test Suite (247+ Tests)

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run with UI dashboard
npm run test:ui

# Run in watch mode during development
npm run test:watch

# Run specific test categories
npm run test -- src/test/App.test.tsx
npm run test -- src/test/SearchInput.test.tsx
```

### Test Coverage Overview

| Component            | Tests     | Coverage Focus                                  |
| -------------------- | --------- | ----------------------------------------------- |
| **App.tsx**          | 95 tests  | State management, API integration, user flows   |
| **SearchInput**      | 47 tests  | Keyboard navigation, debouncing, accessibility  |
| **ConceptDetails**   | 31 tests  | Data display, conditional rendering, edge cases |
| **fhirApi Service**  | 35 tests  | API calls, error handling, offline mode         |
| **useDebounce Hook** | 25 tests  | Timer management, cleanup, performance          |
| **FHIR Parsing**     | 14+ tests | Data validation, malformed response handling    |

### Coverage Requirements

- **Minimum Coverage**: 80% for all metrics (lines, functions, branches, statements)
- **New Code**: Must maintain 80%+ coverage
- **Critical Paths**: 100% coverage for core functionality
- **CI Gate**: Build fails if coverage drops below threshold

For detailed testing documentation, see [Testing Strategy](docs/Testing.md).

## CI/CD Pipeline

### 🚀 Automated CI Pipeline

The project includes a comprehensive GitHub Actions CI pipeline that runs on every push and pull request:

#### **CI Jobs Overview**

```yaml
🧪 Tests & Coverage    # 247+ unit tests with coverage reporting
📝 Lint & Format      # ESLint, TypeScript, Prettier checks
🏗️ Build             # Production builds (online & offline modes)
🔒 Security Audit    # Dependency vulnerability scanning
🎯 Test Matrix       # Multi-OS and Node.js version testing
🏁 CI Status         # Aggregated status reporting
```

#### **Quality Gates**

- ✅ **Test Coverage**: Minimum 80% coverage required
- ✅ **Code Quality**: ESLint rules must pass
- ✅ **Type Safety**: TypeScript strict mode compilation
- ✅ **Security**: No high/critical vulnerabilities
- ✅ **Build**: Successful production builds

#### **Coverage Reporting**

- **Codecov Integration**: Automatic coverage analysis
- **Coverage Comments**: PR comments with coverage diff
- **Component Coverage**: Separate tracking for components, services, hooks
- **Coverage Artifacts**: Downloadable HTML reports

#### **Automated Dependency Updates**

- **Dependabot**: Weekly dependency updates
- **Security Patches**: Automatic security vulnerability fixes
- **Major Version Control**: Manual approval for breaking changes

### 📊 CI Dashboard

| Metric           | Badge                                                                                                      | Description                |
| ---------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------- |
| **Build Status** | ![CI](https://github.com/USER/REPO/workflows/CI/badge.svg)                                                 | Overall CI pipeline status |
| **Coverage**     | [![codecov](https://codecov.io/gh/USER/REPO/branch/main/graph/badge.svg)](https://codecov.io/gh/USER/REPO) | Test coverage percentage   |
| **Dependencies** | ![Dependencies](https://img.shields.io/david/USER/REPO)                                                    | Dependency status          |

### 🔧 Local CI Simulation

```bash
# Run the full CI pipeline locally
npm run ci

# Individual CI steps
npm run type-check    # TypeScript compilation
npm run lint         # ESLint checks
npm run test:coverage # Tests with coverage
npm run build        # Production build
npm run audit        # Security audit
```

## Project Structure

```
medical-search-ui/
├── 📁 docs/                    # Comprehensive documentation
│   ├── Architecture.md         # Code structure and patterns
│   ├── Testing.md              # Test strategy and coverage
│   ├── Components.md           # Component documentation
│   ├── API.md                  # FHIR integration guide
│   └── Development.md          # Development workflow
├── 📁 src/
│   ├── 📁 components/          # React components with tests
│   │   ├── SearchInput.tsx     # Type-ahead search component
│   │   ├── ConceptDetails.tsx  # Concept detail display
│   │   └── *.css               # Component-specific styles
│   ├── 📁 hooks/               # Custom React hooks
│   │   └── useDebounce.ts      # Debouncing hook with tests
│   ├── 📁 services/            # API service layer
│   │   └── fhirApi.ts          # FHIR endpoint integration
│   ├── 📁 test/                # Component test files
│   │   ├── App.test.tsx        # 95 comprehensive tests
│   │   ├── SearchInput.test.tsx# 47 interaction tests
│   │   ├── ConceptDetails.test.tsx # 31 display tests
│   │   ├── fhirApi.test.ts     # 35 service tests
│   │   ├── useDebounce.test.ts # 25 hook tests
│   │   └── setup.ts            # Test configuration
│   ├── 📁 test-files/          # Sample FHIR responses
│   │   ├── 1st-expand-response.json
│   │   └── 2nd-lookup-response.json
│   ├── 📁 types/               # TypeScript definitions
│   │   └── fhir.ts             # FHIR data structures
│   └── 📁 utils/               # Utility functions
│       └── __tests__/          # Enhanced parsing tests
├── 📁 .devcontainer/           # Development environment
└── 📁 test-files/              # Additional test resources
```

## Sample Data

### Test Files for Offline Development

Located in `src/test-files/`:

- **`1st-expand-response.json`** (5.6KB)
  - ValueSet expansion for "total hip replacement"
  - Multiple SNOMED CT concepts with designations
  - Used for search functionality testing

- **`2nd-lookup-response.json`** (4.1KB)
  - CodeSystem lookup for concept "52734007"
  - Complete concept details with relationships
  - Used for detail display testing

These files enable:

- ✅ Consistent testing environment
- ✅ Offline development capability
- ✅ Predictable test scenarios
- ✅ No external API dependencies

## 🚀 Suggested Enhancements

The following enhancements would further improve the application's functionality, user experience, and technical capabilities:

### 🎯 User Experience Enhancements

- **🔍 Advanced Search Filters**
  - Filter by concept status (active/inactive)
  - Filter by terminology system (SNOMED CT, ICD-10, LOINC)
  - Date range filters for concept versions
  - Semantic similarity search options

- **📝 Search History & Favorites**
  - Recent searches dropdown with timestamp
  - Bookmark frequently accessed concepts
  - Export search history to CSV/JSON
  - Persistent user preferences

- **🎨 Enhanced UI/UX**
  - Dark/light theme toggle with system preference detection
  - Concept relationship visualization (tree/graph view)
  - Drag-and-drop concept comparison
  - Responsive mobile-first design improvements

### 🔧 Technical Enhancements

- **⚡ Performance Optimizations**
  - Implement virtual scrolling for large result sets
  - Add service worker for offline caching
  - Lazy loading for concept details
  - Search result pagination with infinite scroll

- **📊 Data Visualization**
  - Interactive concept hierarchy charts (D3.js/Recharts)
  - Search analytics dashboard
  - Concept usage frequency heatmaps
  - SNOMED CT relationship network graphs

- **🔌 API Enhancements**
  - Multiple FHIR server support with server switching
  - Bulk concept lookup operations
  - Search result caching with TTL
  - GraphQL API layer for complex queries

### 🛡️ Quality & Security Improvements

- **🔒 Security Features**
  - OAuth2/OIDC authentication integration
  - API rate limiting and throttling
  - Content Security Policy (CSP) implementation
  - FHIR resource access control

- **📈 Monitoring & Analytics**
  - Application performance monitoring (APM)
  - User interaction analytics
  - Error tracking and reporting
  - Search query performance metrics

- **🧪 Testing Enhancements**
  - End-to-end testing with Playwright/Cypress
  - Visual regression testing
  - Performance testing benchmarks
  - Accessibility testing automation

### 🌐 Integration & Export Features

- **📤 Data Export Options**
  - Export search results to Excel/CSV
  - Generate PDF reports with concept details
  - FHIR Bundle export for selected concepts
  - Integration with external EMR systems

- **🔗 Third-party Integrations**
  - FHIR Questionnaire builder integration
  - Clinical decision support hooks
  - Terminology mapping services
  - Multi-language support for international terminologies

### 📱 Progressive Web App Features

- **🔄 Offline Capabilities**
  - Background sync for search queries
  - Offline concept browsing
  - Push notifications for concept updates
  - App-like mobile experience

- **🎯 Advanced Features**
  - Voice search input
  - Barcode scanning for medical devices
  - AI-powered concept suggestions
  - Machine learning search result ranking

### 🏗️ Architecture Improvements

- **🔄 State Management**
  - Implement Redux Toolkit for complex state
  - Add optimistic updates for better UX
  - State persistence across browser sessions
  - Undo/redo functionality for search actions

- **📦 Microservices Architecture**
  - Separate search and lookup services
  - Dedicated caching service
  - Authentication microservice
  - Analytics and logging service

---

## Contributing

### Development Standards

1. **DRY Principles**: Follow Single Responsibility Pattern
2. **Test Coverage**: Maintain >80% coverage for all new code
3. **Error Handling**: Implement comprehensive error boundaries
4. **Accessibility**: Ensure WCAG 2.1 AA compliance
5. **Documentation**: Update relevant docs for changes

### Code Quality Checklist

- [ ] Unit tests written and passing
- [ ] Error scenarios tested
- [ ] Accessibility tested
- [ ] TypeScript strict mode compliance
- [ ] ESLint warnings resolved
- [ ] Debug logging removed
- [ ] Documentation updated

### Testing Requirements

Before merging:

1. Run full test suite: `npm test`
2. Verify test coverage: `npm run test:coverage`
3. Test offline mode: `VITE_OFFLINE_MODE=true npm run dev`
4. Test accessibility: Screen reader navigation
5. Test error scenarios: Network failures, malformed data

For detailed development guidelines, see [Development Guide](docs/Development.md).

---

## 🔗 Quick Links

- **[🏗️ Architecture](docs/Architecture.md)** - Code structure and design patterns
- **[🧪 Testing](docs/Testing.md)** - Comprehensive testing methodology
- **[⚛️ Components](docs/Components.md)** - Component API and usage
- **[🔌 API Integration](docs/API.md)** - FHIR endpoints and data handling

## License

This project is for educational and research purposes related to medical terminology systems.

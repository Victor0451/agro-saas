# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-02-02

### Added
- **Multi-Tenant Support**: Full implementation of organization-based data isolation using RLS.
- **Onboarding Flow**: New `/onboarding` page for creating organizations after registration.
- **Production Modules**:
    - `Almácigos`: Seedbed management and tray tracking.
    - `Cultivo`: Cultural labor recording (irrigation, fertilization).
    - `Cosecha`: Harvest data entry.
- **History Tracking**: Visual history components for all production stages.
- **Forms**: Comprehensive forms with Zod validation for Fincas, Lotes, Insumos, and Labores.

### Changed
- **Type Safety Overhaul**: Replaced widespread use of `any` types with strict TypeScript interfaces (`Finca`, `Insumo`, `AlmacigoHistoryItem`, etc.).
- **Error Handling**: Standardized API error responses and frontend catch blocks to use `unknown` type guards and `ZodError` checks.
- **UI Improvements**: Updated `Layout` and navigation structure for better responsiveness.
- **Performance**: Optimized `useEffect` dependencies and memoized data fetching in critical dashboard pages.

### Fixed
- **Linting Errors**: Resolved all ESLint warnings including `no-explicit-any`, unused variables, and exhausted-deps in hooks.
- **Build Process**: Fixed production build failures related to strict type checking.
- **Duplicate Declarations**: Corrected variable shadowing issues in `almacigos/page.tsx`.
- **Layout Imports**: Restored missing icon imports in the main dashboard layout.

### Security
- **Audit Logging**: Enhanced `logAudit` function to accurately capture resource IDs and tenant context.
- **API Protection**: Enforced tenant ID validation on critical write operations.

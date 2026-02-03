# Product Requirements Document (PRD) - AgroERP

## 1. Introduction
AgroERP is a specialized Enterprise Resource Planning (ERP) system designed for the agricultural sector, specifically tailored for tobacco production and similar intensive crops. It provides a comprehensive solution for managing farms (fincas), plots (lotes), supplies (insumos), and production cycles, offering multi-tenant support to serve multiple producers or organizations securely.

### 1.1 Goals
- **Centralize Information**: Consolidate all production data into a single, accessible platform.
- **Optimize Resource Management**: Track input usage, costs, and stock levels in real-time.
- **Ensure Traceability**: Monitor the entire production process from seeding to harvest.
- **Scalability**: Support multiple organizations/tenants with isolated data environments.

## 2. Target Audience
- **Agricultural Producers**: Owners and managers of farms needing detailed production supervision.
- **Agronomists**: Technical advisors monitoring crop health and labor execution.
- **Administrators**: Personnel managing inventory, purchasing, and system configuration.

## 3. Key Features

### 3.1 Authentication & Security (Completed)
- **Multi-Tenancy**: Strict data isolation using Row Level Security (RLS). Users only access data within their assigned organization.
- **Secure Access**: Email/password authentication via Supabase Auth.
- **Onboarding Flow**: Streamlined registration and organization creation process.

### 3.2 Core Management (Completed)
- **Fincas (Farms)**: Register and manage multiple production units with geolocation and surface area details.
- **Lotes (Plots)**: Define specific plots within farms for granular tracking of crops.
- **Insumos (Supplies)**: Comprehensive inventory management with categorization (Fertilizers, Agrochemicals, etc.), stock tracking, and cost control.

### 3.3 Production Modules (In Progress)
- **Almácigos (Seedbeds)**: Track seeding dates, varieties, and germination rates.
- **Labores Culturales**: Record daily field tasks (irrigation, fertilization, pest control) and resource consumption.
- **Plantación**: Manage transplanting activities from seedbeds to production plots.
- **Cosecha (Harvest)**: Record yields, weights, and quality metrics during harvest.

### 3.4 Future Roadmap
- **Post-Harvest Management**: Curing, classification, and baling processes.
- **Financial Module**: Cost analysis, labor payments, and profitability reports.
- **Advanced Analytics**: Interactive dashboards for yield prediction and historical comparisons.

## 4. Technical Architecture
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Shadcn UI.
- **Backend**: Supabase (PostgreSQL), Server Actions, Edge Functions.
- **Security**: PostgreSQL Row Level Security (RLS) for tenant isolation.
- **Infrastructure**: Vercel (Frontend), Supabase (Database & Auth).

## 5. User Flows
1.  **Onboarding**: User registers -> Creates Organization (Tenant) -> Dashboard.
2.  **Setup**: Admin creates Fincas -> Defines Lotes -> Loads Insumos stock.
3.  **Operation**: Field manager records Daily Tasks (Labores) -> Consumes Insumos -> System updates Stock.

## 6. Success Metrics
- Reduction in inventory discrepancies.
- Reduced time for generating production reports.
- 100% data isolation between tenants.

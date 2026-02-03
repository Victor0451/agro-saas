# AgroERP System

![Status](https://img.shields.io/badge/status-active-success.svg)
![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)
![License](https://img.shields.io/badge/license-Private-red.svg)

AgroERP is a modern, cloud-based ERP solution built for comprehensive agricultural management. It allows producers to manage farms, track crop cycles, control inventory, and monitor production costs in real-time, all within a secure, multi-tenant environment.

## 🚀 Key Features

- **Multi-Tenant Architecture**: Isolate data and configurations per organization.
- **Farm Management**: Create and track multiple Fincas (farms) and Lotes (plots).
- **Inventory Control**: Real-time stock tracking for Insumos (supplies) with categorized management.
- **Production Tracking**: Monitor seeding (Almácigos), cultural practices (Labores), and harvest (Cosecha).
- **Secure Access**: Role-based access control and strict data privacy via RLS.
- **Modern UI**: Responsive dashboard built with Shadcn UI and Tailwind CSS.

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
- **Database**: [Supabase](https://supabase.com/) (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React Hooks & Context API
- **Form Handling**: React Hook Form + Zod Validation

## 📦 Installation

To get started with the development environment:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-org/erp-system.git
    cd erp-system
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Environment Setup:**
    Create a `.env.local` file in the root directory and add your Supabase credentials:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🏗 Project Structure

```
├── src/
│   ├── app/                # App Router pages and layouts
│   │   ├── (auth)/         # Authentication routes (login, register)
│   │   ├── (dashboard)/    # Verified user area (main app)
│   │   └── api/            # API Routes (Next.js server functions)
│   ├── components/         # Reusable UI components
│   │   ├── forms/          # Specific form components
│   │   └── ui/             # Shadcn primitives
│   ├── lib/                # Utility functions and configurations
│   │   ├── supabase/       # Supabase client setup
│   │   └── validations/    # Zod schemas
│   └── contexts/           # React Context providers (e.g., FincaContext)
├── public/                 # Static assets
└── docs/                   # Project documentation
```

## 📜 License

This project is private and proprietary. Unauthorized copying or distribution is strictly prohibited.

## 🤝 Contributing

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

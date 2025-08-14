# Overview

This is a mobile-first digital ledger web application designed for small business owners to manage client transactions. The app replicates a traditional ledger book with modern digital features, allowing users to record, track, and analyze financial transactions across multiple clients. Built with React frontend and Express backend, it features comprehensive authentication, client management, transaction recording, and reporting capabilities.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React SPA**: Single-page application using React 18 with TypeScript
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Mobile-First Design**: Responsive design optimized for mobile devices with desktop support

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API with JSON responses
- **Authentication**: Replit Auth integration with OIDC (OpenID Connect)
- **Session Management**: Express sessions with PostgreSQL storage
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Build System**: Vite for frontend bundling, esbuild for backend compilation

## Database Design
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **Schema Management**: Drizzle Kit for migrations and schema generation
- **Core Entities**:
  - Users: Authentication and profile data
  - Clients: Customer/client information per user
  - Transactions: Financial records with debit/credit amounts and running balances
  - Sessions: Authentication session storage

## Authentication & Authorization
- **Provider**: Replit Auth with OIDC protocol
- **Session Storage**: Server-side sessions stored in PostgreSQL
- **Data Isolation**: Strict user-based data isolation using userId foreign keys
- **Authorization Pattern**: Middleware-based route protection with user context injection

## Transaction Management
- **Balance Calculation**: Automatic running balance computation after each transaction
- **Transaction Types**: Support for both debit and credit entries
- **Data Integrity**: Transactional operations to maintain consistency
- **Filtering**: Date range, transaction type, and text search capabilities

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## Authentication Services  
- **Replit Auth**: OIDC-based authentication service
- **openid-client**: OpenID Connect client implementation
- **Passport.js**: Authentication middleware with OIDC strategy

## UI Component Libraries
- **Radix UI**: Accessible, unstyled UI primitives (@radix-ui/react-*)
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Lucide React**: Icon library for UI elements

## Development Tools
- **Vite**: Frontend build tool with HMR and development server
- **Tailwind CSS**: Utility-first CSS framework
- **TypeScript**: Static type checking for both frontend and backend
- **TanStack Query**: Data fetching and caching for React applications

## Validation & Forms
- **Zod**: Runtime type validation and schema definition
- **React Hook Form**: Form state management with validation
- **drizzle-zod**: Integration between Drizzle ORM and Zod schemas
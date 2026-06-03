# AGENTS.md - Development Guidelines for Lowkey Gem

This document provides essential guidelines for agentic coding assistants working in this repository. Follow these conventions to maintain code quality and consistency.

## Build, Lint, and Test Commands

### Development Server
- **Start development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Install dependencies**: `npm install`

### Testing
- No automated testing framework is currently configured
- Manual testing should be performed by running the development server and verifying functionality
- For component testing: Use browser dev tools and manual interaction testing
- For API testing: Test endpoints manually through the UI or use browser network tab

### Linting and Code Quality
- No linting tools (ESLint, Prettier) are currently configured
- TypeScript compilation serves as the primary code quality check
- Code style is enforced through manual review and these guidelines
- Build will fail on TypeScript compilation errors

## Code Style Guidelines

### TypeScript/React Conventions

#### File Structure
- **Components**: `src/components/` - PascalCase filenames (e.g., `Toast.tsx`)
- **Pages**: `src/pages/` - PascalCase filenames (e.g., `FreelancerPortalPage.tsx`)
- **Services**: `src/services/` - camelCase filenames (e.g., `jobsService.ts`)
- **Hooks**: `src/hooks/` - camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Types**: `src/types/` - camelCase filenames (e.g., `database.ts`)
- **Routes**: `src/routes/` - PascalCase filenames (e.g., `ProtectedRoute.tsx`)

#### Naming Conventions
- **Components**: PascalCase (e.g., `Toast`, `FreelancerPortal`)
- **Functions/Methods**: camelCase (e.g., `getActive`, `showToast`)
- **Variables**: camelCase (e.g., `userProfile`, `isAuthLoading`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `VITE_SUPABASE_URL`)
- **Types/Interfaces**: PascalCase (e.g., `JobInsert`, `ToastProps`)
- **Database Tables**: snake_case (defined in migrations)

#### Import Organization
```typescript
// React imports first
import React, { useEffect, useState } from 'react';

// Third-party libraries
import { BrowserRouter } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Local imports - relative paths
import { useAuth } from '../hooks/useAuth';
import type { Job } from '../types/database';
```

#### Component Structure
- Use functional components with hooks
- Prefer named exports over default exports
- Destructure props in function parameters
- Use TypeScript interfaces for props

```typescript
interface ToastProps {
  message: string;
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, duration = 3000, onClose }: ToastProps) {
  // Component logic
}
```

#### Service Layer Pattern
- All API calls go through service modules in `src/services/`
- Services return `{ data, error }` objects for consistent error handling
- Use async/await for all Supabase operations

```typescript
export const jobsService = {
  async getActive() {
    const { data, error } = await supabase
      .from('jobs')
      .select('*, client:profiles(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    return { data: data as JobWithClient[] | null, error };
  },
};
```

#### Error Handling
- Services return `{ data, error }` - check error before using data
- Use try/catch for component-level error boundaries
- Log errors with descriptive messages
- Show user-friendly error messages via toast notifications

#### TypeScript Types
- Define interfaces for all data structures in `src/types/database.ts`
- Use union types for enums (e.g., `UserType = 'freelancer' | 'client' | 'admin'`)
- Prefer explicit types over `any`
- Use optional properties with `?:` for nullable fields

#### Styling
- Mix of inline styles and CSS classes
- Use CSS custom properties for consistent theming
- Inline styles for dynamic values and animations
- CSS classes for static styling

#### Formatting
- 2-space indentation
- No semicolons at end of statements (except where required by TypeScript)
- Single quotes for strings
- Trailing commas in multi-line objects/arrays
- Line length: No strict limit, but prefer readable line breaks

### Database and API Guidelines

#### Supabase Integration
- All database operations through Supabase client
- Use Row-Level Security (RLS) policies for data access
- Real-time subscriptions for live features (chat, notifications)
- File uploads through Supabase Storage with appropriate bucket permissions

#### Authentication
- Use Supabase Auth for user management
- Implement role-based access control (freelancer, client, admin)
- Protect routes with `ProtectedRoute` component
- Handle auth state with `useAuth` hook

### Development Workflow

#### Code Changes
1. Make changes following the style guidelines above
2. Test functionality by running `npm run dev`
3. Verify no TypeScript compilation errors (build will fail if present)
4. Check that authentication and authorization work correctly
5. Test on different user types (freelancer, client, admin)

#### Database Changes
1. Create migration files in `supabase/migrations/`
2. Update TypeScript types in `src/types/database.ts`
3. Test database operations thoroughly
4. Update RLS policies as needed

### Security Considerations

#### Data Protection
- Never log sensitive information (passwords, API keys, personal data)
- Use environment variables for secrets (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- Implement proper RLS policies for data access control
- Validate user input on both client and server side

#### File Uploads
- Use Supabase Storage with appropriate bucket permissions
- Validate file types and sizes
- Private buckets for sensitive documents (KYC, work submissions)
- Public buckets for avatars and portfolios

### Performance Guidelines
- Use React.lazy() for route-based code splitting
- Implement pagination for large datasets
- Use Supabase real-time subscriptions judiciously
- Cache frequently accessed data when appropriate

### Build Process

#### Development Setup
- Vite is used as the build tool with React SWC plugin
- Development server runs on port 3000 with auto-open enabled
- TypeScript compilation happens during build and dev server
- Path aliases configured: `@` points to `./src`

#### Deployment
- Build command: `npm run build`
- Output directory: `build`
- Environment variables must be configured in deployment platform
- PWA service worker is included for offline functionality

### Testing Strategy
- No automated testing framework is currently configured
- Manual testing: Run `npm run dev` and verify functionality
- Test all user types (freelancer, client, admin) and permission levels
- Test complete user flows and error scenarios

This document should be updated as the project evolves and new tools/conventions are adopted.
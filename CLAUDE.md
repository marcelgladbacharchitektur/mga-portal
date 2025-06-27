# MGA Portal - Project Documentation

## Overview
Marcel Gladbach Architektur - Project Management Portal
A SvelteKit-based PWA for managing architectural projects, contacts, and time tracking.

## Tech Stack
- **Framework**: SvelteKit
- **Database**: Supabase (PostgreSQL)
- **Auth**: Google OAuth2
- **Styling**: Tailwind CSS
- **Icons**: Phosphor Icons
- **PWA**: @vite-pwa/sveltekit

## Key Features
- Project management with Google Drive integration
- Contact management (project-specific contacts)
- Time tracking system
- Apple Shortcuts integration
- Google Calendar & Tasks integration
- Drive Browser for file management
- Progressive Web App (installable)

## Project Structure
```
src/
├── routes/
│   ├── +page.svelte              # Dashboard/Home
│   ├── projekte/                 # Projects
│   │   ├── +page.svelte         # Projects list
│   │   └── [id]/+page.svelte   # Project details
│   ├── kontakte/+page.svelte    # Contacts
│   ├── zeiterfassung/+page.svelte # Time tracking
│   └── api/
│       ├── projects-supabase/    # Projects API
│       ├── contacts/             # Contacts API
│       ├── time-entries/         # Time entries API
│       ├── shortcuts/            # Apple Shortcuts API
│       └── auth/google/          # Google OAuth
├── lib/
│   ├── components/
│   │   ├── OmniCreate.svelte    # Create menu (FAB)
│   │   ├── ProjectCard.svelte   # Project cards
│   │   ├── ContactCard.svelte   # Contact cards
│   │   └── ...                  # Dialog components
│   └── server/
│       └── google-oauth.ts      # OAuth utilities
└── app.css                      # Global styles
```

## Database Schema (Supabase)
- **projects**: id, created_at, name, description, client, status, drive_folder_id, calendar_id
- **contacts**: id, created_at, name, email, phone, company, role, notes
- **project_contacts**: id, created_at, project_id, contact_id
- **time_entries**: id, created_at, project_id, date, hours, description

## Environment Variables
```
PUBLIC_SUPABASE_URL
PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI
GOOGLE_ACCESS_TOKEN
GOOGLE_REFRESH_TOKEN
API_TOKEN
```

## Commands
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run check      # Run svelte-check
```

## Design System
- **Primary Color**: #5A614B (Dark Green)
- **Background**: #FAF9F7 (Light Cream)
- **Text**: #3B3F33 (Dark)
- **Border**: #E5E5E0 (Light Gray)
- **Font**: Inter

## Current UI Issues to Fix
1. OmniCreate menu looks playful/cluttered
2. Time entries cannot be deleted
3. Redundant UI elements exist
4. Overall design needs more professional consistency

## API Endpoints
- `/api/projects-supabase` - Project CRUD
- `/api/contacts` - Contact CRUD
- `/api/time-entries` - Time entry CRUD
- `/api/shortcuts` - Apple Shortcuts integration
- `/api/auth/google/login` - OAuth login
- `/api/auth/google/callback` - OAuth callback
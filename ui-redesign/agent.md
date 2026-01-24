# ALPHASCRAPE - Architecture Documentation

## Overview

alphascrape is an AI-powered web scraping management interface designed for fashion resale hunters. The application targets niche fashion influencers and resellers, providing tools to create, manage, and monitor automated searches for rare fashion items across resale platforms.

## Technology Stack

### Core Framework
- **Next.js 16** - React framework with App Router
- **React 19.2** - UI library with canary features (useEffectEvent, Activity)
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling with zero-config design tokens

### UI Components
- **shadcn/ui** - Accessible component library built on Radix UI
- **Radix UI** - Unstyled, accessible component primitives
- **Lucide React** - Icon system

### State Management
- **Zustand** - Lightweight client-side state management for search data

### Development Runtime
- **next-lite** - Browser-based Next.js runtime for rapid prototyping
  - No package.json required (dependencies auto-inferred)
  - Full Next.js feature support (Server Actions, Route Handlers)
  - Environment variables via Vercel integration

## Project Structure

```
/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx               # Root layout with fonts and metadata
│   ├── page.tsx                 # Dashboard with stats and quick actions
│   ├── globals.css              # Global styles and design tokens
│   ├── searches/                # Search management routes
│   │   ├── layout.tsx          # Searches layout wrapper
│   │   ├── page.tsx            # Search list view (grid/list toggle)
│   │   ├── loading.tsx         # Suspense boundary loading state
│   │   └── [id]/               # Dynamic route for create/edit
│   │       ├── page.tsx        # Handles both create and edit modes
│   │       └── loading.tsx     # Detail page loading state
│   ├── settings/               # User settings page
│   │   └── page.tsx
│   └── help/                   # Help and support page
│       └── page.tsx
│
├── components/                  # React components
│   ├── navigation.tsx          # Responsive nav (top bar → sidebar)
│   ├── search-card.tsx         # Search display card with actions
│   ├── search-form.tsx         # Create/edit search form
│   ├── image-upload.tsx        # Drag-and-drop image uploader
│   └── ui/                     # shadcn/ui primitives
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       ├── switch.tsx
│       ├── sheet.tsx           # Mobile sidebar
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── accordion.tsx
│       ├── select.tsx
│       └── ...
│
├── lib/                        # Utilities and shared logic
│   ├── types.ts               # TypeScript type definitions
│   ├── search-store.ts        # Zustand store for search state
│   └── utils.ts               # Utility functions (cn, etc.)
│
└── agent.md                    # This file
```

## Architecture Decisions

### 1. UUID-Based Routing for Create/Edit

**Problem:** Next.js dynamic routes `[id]` conflict with static `/new` routes, causing redirect loops.

**Solution:** Generate UUIDs client-side before navigation:
- Click "NEW SEARCH" → Generate `crypto.randomUUID()` → Navigate to `/searches/[uuid]`
- Detail page checks if search exists with that ID
- If exists: Edit mode with prefilled form
- If not exists: Create mode with empty form, saves with pre-generated UUID

**Benefits:**
- Single detail page handles both create and edit
- No route conflicts
- Predictable URLs
- Optimistic navigation (no server roundtrip to create resource)

### 2. Client-Side State with Zustand

**Why not server state?**
- Next-lite runtime optimized for client-side prototyping
- No database in initial version (sample data in store)
- Fast, local state updates without network latency
- Easy to migrate to server state later (just swap Zustand hooks with data fetching)

**Store Structure:**
```typescript
interface SearchStore {
  searches: Search[]
  addSearch: (search, customId?) => Search
  updateSearch: (id, updates) => void
  deleteSearch: (id) => void
  getSearch: (id) => Search | undefined
  toggleActive: (id) => void
}
```

### 3. Brutalist Design System

**Aesthetic:** Underground Berlin art gallery meets fashion tech
- Dark backgrounds (`oklch(0.08 0 0)`)
- Stark white text (`oklch(0.95 0 0)`)
- Electric blue accent (`oklch(0.65 0.25 250)`)
- Zero border radius (brutalist sharp edges)
- Heavy 2px borders throughout
- Monospace typography (Space Mono) for labels
- Sans-serif (Inter) for body text

**Design Tokens (globals.css):**
```css
:root {
  --background: oklch(0.08 0 0);      /* Near black */
  --foreground: oklch(0.95 0 0);      /* Near white */
  --accent: oklch(0.65 0.25 250);     /* Electric blue */
  --border: oklch(0.25 0 0);          /* Dark gray */
  --radius: 0;                        /* No rounding */
}
```

**Interaction Patterns:**
- Hover: Border and shadow shift to accent blue
- Hover: Text/icons transition to accent color
- Images: Grayscale by default, color on hover
- Transitions: 150ms for snappy, industrial feel

### 4. Responsive Navigation

**Desktop (≥768px):**
- Top horizontal bar
- Brand logo + page links
- Fixed position with border-bottom

**Mobile (<768px):**
- Hamburger menu button (top-right)
- Slide-out Sheet sidebar
- Full-height navigation overlay

## Data Model

### Search Type

```typescript
interface Search {
  id: string                    // UUID
  title: string                 // e.g., "2000s Preppy"
  prompt: string                // Detailed aesthetic description
  searchTerms: string[]         // Keywords for scraper filtering
  images: string[]              // 1-5 example images (URLs)
  isActive: boolean             // Toggle for active/inactive
  createdAt: Date
  updatedAt: Date
}
```

### Example Fashion Aesthetics

1. **2000s Preppy** - Abercrombie/Hollister mall culture, low-rise denim, popped collars
2. **Japanese Horror Game Protagonist** - Dark coquette meets Fatal Frame, gothic lolita influences
3. **Kinderwhore** - 90s grunge/Riot Grrrl, babydoll dresses, Courtney Love style

## Key Features

### Search Management
- **Grid/List View Toggle** - Switch between card grid and list layout
- **Filter by Status** - All / Active / Inactive searches
- **Search Query** - Filter searches by title
- **Inline Toggle** - Enable/disable searches without opening detail page
- **Image Thumbnails** - First example image shown as card preview
- **Search Terms Display** - Show up to 3 tags, "+N" for additional terms

### Create/Edit Form
- **Title Input** - Search name
- **Style Description** - Detailed aesthetic explanation (textarea)
- **Search Terms** - Comma-separated keywords for scraper
- **Image Upload** - Drag-and-drop or click to upload 1-5 images
  - Preview thumbnails
  - Remove individual images
  - Reorder support (future enhancement)
- **Active Toggle** - Enable/disable on creation
- **Delete Confirmation** - Alert dialog for destructive action (edit mode only)

### Dashboard
- **Stats Overview** - Total, Active, Inactive search counts
- **Recent Searches** - Grid of latest searches with quick actions
- **Quick Actions** - Create Search, Manage Searches, Active Searches cards

## Styling Approach

### Tailwind CSS v4
- **No config file** - Design tokens defined in `@theme inline` block in globals.css
- **Utility-first** - Compose styles with Tailwind classes
- **Zero border radius** - `--radius: 0` for brutalist aesthetic
- **Custom fonts** - Space Mono (mono), Inter (sans)

### Component Patterns
```tsx
// Brutalist button with accent hover
<Button className="
  border-2 border-foreground 
  bg-foreground 
  text-background
  hover:border-accent 
  hover:bg-accent 
  hover:text-accent-foreground
  font-mono text-xs uppercase tracking-wider
">
  ACTION
</Button>

// Card with shadow shift hover
<div className="
  border-2 border-foreground 
  bg-card
  transition-all duration-150
  hover:translate-x-1 
  hover:-translate-y-1
  hover:border-accent
  hover:shadow-[4px_4px_0_0_var(--accent)]
">
  Content
</div>
```

### Typography Scale
- **Headings:** `font-mono font-bold uppercase tracking-wider`
- **Body:** `font-sans text-sm leading-relaxed`
- **Metadata:** `font-mono text-[10px] uppercase tracking-wider`
- **No decorative fonts** - Industrial/technical aesthetic only

## State Flow

### Creating a Search
1. User clicks "NEW SEARCH"
2. Client generates `crypto.randomUUID()`
3. Navigate to `/searches/[uuid]`
4. Detail page renders `<SearchForm mode="create" createId={uuid} />`
5. User fills form and clicks "SAVE"
6. Form calls `addSearch(data, uuid)`
7. Zustand store adds search with pre-generated ID
8. Navigate to `/searches` (list view)

### Editing a Search
1. User clicks search card or dropdown "Edit"
2. Navigate to `/searches/[id]`
3. Detail page fetches search from store with `getSearch(id)`
4. Renders `<SearchForm mode="edit" search={search} />`
5. User modifies form and clicks "SAVE"
6. Form calls `updateSearch(id, updates)`
7. Zustand store merges updates
8. Navigate to `/searches`

### Deleting a Search
1. User clicks dropdown "Delete" on card OR delete button in edit form
2. Alert dialog confirms action
3. Calls `deleteSearch(id)`
4. Zustand store filters out search
5. UI updates reactively (if in edit mode, navigate to `/searches`)

## Future Enhancements

### Backend Integration
- Replace Zustand with server state (SWR, React Query, or Server Components)
- Database storage (Supabase, Neon, etc.)
- User authentication
- Multi-user support

### Scraper Integration
- Connect to actual resale platform APIs (eBay, Depop, Grailed, Vinted)
- Run searches on schedule
- Store and display results
- Notification system for new matches

### Advanced Features
- Image reordering (drag-and-drop)
- Bulk actions (activate/deactivate multiple)
- Search templates
- Export/import search configurations
- Analytics dashboard (matches over time, success rate)

## Development Notes

### Adding New Pages
1. Create file in `app/[route]/page.tsx`
2. Add navigation link in `components/navigation.tsx`
3. Ensure page uses brutalist design tokens
4. Test responsive behavior (mobile sidebar)

### Adding New Components
1. Create in `components/` or `components/ui/`
2. Follow brutalist styling patterns
3. Use semantic design tokens (not direct colors)
4. Add accent color hovers for interactive elements
5. Ensure accessibility (ARIA labels, keyboard nav)

### Modifying Design Tokens
Edit `app/globals.css`:
```css
@theme inline {
  --accent: oklch(0.65 0.25 250);  /* Change hue for different accent */
}
```

### Adding shadcn Components
The project has all common components pre-installed. If needed, copy additional components from shadcn/ui documentation and ensure they use the brutalist theme (zero radius, heavy borders, accent hovers).

## Technical Constraints

- **Browser-only runtime** - No Node.js filesystem access
- **No npm install** - Dependencies auto-resolved from imports
- **Client-side state** - No persistent database (Zustand state resets on refresh)
- **Image storage** - Uses blob URLs (not persisted beyond session)

For production deployment, migrate to standard Next.js with proper database, file storage, and server-side rendering.

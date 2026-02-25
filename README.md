# TaskSplit — AI-Powered Task Breakdown

Break any project into structured rounds and micro-steps with AI.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your **Project URL** and **anon public key** from Settings → API

### 3. Configure environment variables

Edit `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
GEMINI_API_KEY=your-gemini-api-key-here
```

- Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)

### 4. Run the database migration

1. Open the Supabase SQL Editor in your project dashboard
2. Paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Click **Run** to create the tables and RLS policies

### 5. Configure authentication

#### Email/Password (enabled by default)
No extra setup needed.

#### Google OAuth (optional)
1. In Supabase Dashboard → Authentication → Providers → Google
2. Enable Google provider
3. Create OAuth credentials in [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
4. Set the redirect URL to: `https://your-project.supabase.co/auth/v1/callback`
5. Paste Client ID and Secret into Supabase

### 6. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── breakdown/route.ts    # AI breakdown endpoint (Gemini)
│   │   ├── sessions/route.ts     # Create session endpoint
│   │   └── steps/route.ts        # Toggle step completion
│   ├── auth/
│   │   ├── callback/route.ts     # OAuth callback handler
│   │   ├── layout.tsx
│   │   └── page.tsx              # Login/signup page
│   ├── session/
│   │   └── [id]/page.tsx         # Session detail view
│   ├── globals.css               # Dark purple theme
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Dashboard
├── components/
│   ├── GlassCard.tsx             # Glassmorphism card
│   ├── Navbar.tsx                # Top navigation
│   ├── ProgressBar.tsx           # Animated progress bar
│   ├── PromptInput.tsx           # Task input textarea
│   ├── RoundAccordion.tsx        # Collapsible round section
│   ├── SessionList.tsx           # Past sessions grid
│   ├── SessionView.tsx           # Full session breakdown view
│   └── StepItem.tsx              # Checkbox step item
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Browser Supabase client
│   │   ├── middleware.ts         # Auth session middleware
│   │   └── server.ts             # Server Supabase client
│   ├── types/
│   │   └── database.ts           # TypeScript types
│   └── utils.ts                  # cn() utility
├── middleware.ts                  # Next.js route protection
supabase/
└── migrations/
    └── 001_initial_schema.sql    # Database schema + RLS
```

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript
- **Styling:** Tailwind CSS v4 (dark theme, glassmorphism)
- **Backend:** Supabase (Postgres, Auth, RLS)
- **AI:** Google Gemini 2.0 Flash (structured JSON output)
- **Icons:** Lucide React

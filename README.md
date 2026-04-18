# SSN·SNU Seva — NSS & YRC Platform

A production-grade web platform for SSN and SNU college NSS & YRC volunteers.

## ⚡ Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run the database schema
- Go to your Supabase project → SQL Editor
- Paste and run the contents of `supabase_schema.sql`

### 4. Start development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🏗️ Tech Stack
- **Frontend**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS + Framer Motion
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Fonts**: Syne (display) + DM Sans (body)

## 📁 Key Pages
| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/register` | Multi-step registration |
| `/login` | Sign in |
| `/dashboard` | Volunteer dashboard |
| `/events` | Browse & register for events |
| `/profile` | Profile & registrations |
| `/certificates` | Download certificates |
| `/leaderboard` | Volunteer rankings |
| `/admin` | Admin panel (admin role required) |
| `/admin/events` | Create/edit/delete events |
| `/admin/students` | View all volunteers |
| `/admin/attendance` | Mark attendance |

## 🔐 Make Yourself an Admin
After signing up, run this in Supabase SQL Editor:
```sql
UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';
```

## 🚀 Deploy to Vercel
```bash
npx vercel
```
Add all `.env.local` variables in Vercel → Project → Settings → Environment Variables.

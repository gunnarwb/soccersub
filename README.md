# SoccerSub - Soccer Substitution Tracker

A modern web app for soccer coaches to track player positions and playing time during matches. Built with React, TypeScript, Supabase, and optimized for mobile use.

## Features

- **Player Management**: Add players with names and jersey numbers
- **Match Control**: Start/end matches with customizable duration and halftime
- **Time Tracking**: Automatically track field time and position-specific time
- **Visual Formation**: Interactive soccer pitch with drag-and-drop player positioning
- **Multiple Formats**: Support for 7v7, 9v9, and 11v11 games
- **Real-time Updates**: Live time tracking during active matches
- **Mobile Optimized**: PWA with offline capabilities
- **Secure**: User authentication and data isolation

## Setup Instructions

### 1. Prerequisites
- Node.js 18+ and npm
- A Supabase account

### 2. Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API and copy your project URL and anon key
3. In the SQL Editor, run the SQL from `supabase-schema.sql` to create the database tables
4. Enable Row Level Security (RLS) - the schema includes the necessary policies

### 3. Local Development
1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the environment file and add your Supabase credentials:
   ```bash
   cp .env.example .env
   ```
4. Edit `.env` with your Supabase URL and anon key
5. Start the development server:
   ```bash
   npm run dev
   ```

### 4. Deploy to Vercel

#### Option A: Vercel CLI (Recommended)
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```
2. Login to Vercel:
   ```bash
   vercel login
   ```
3. Deploy:
   ```bash
   vercel
   ```
4. For production deployment:
   ```bash
   vercel --prod
   ```

#### Option B: GitHub Integration
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel at [vercel.com](https://vercel.com)
3. Vercel will automatically deploy on every push to main

#### Custom Domain Setup
1. In your Vercel project dashboard, go to Settings > Domains
2. Add `soccersub.com` and `www.soccersub.com`
3. Update your DNS records as instructed by Vercel

#### Environment Variables
Make sure to add your environment variables in Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Usage

1. **Sign up/Sign in**: Create an account or sign in
2. **Add Players**: Use the "Add Player" button to add your team roster
3. **Start Match**: Configure match details (opponent, score, duration) and start
4. **Track Time**: Use "Sub In"/"Sub Out" buttons to track field time
5. **Position Players**: Drag players from the bench onto field positions
6. **Manage Match**: Use halftime controls and end match when finished

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Drag & Drop**: React DND
- **PWA**: Vite PWA Plugin
- **Icons**: Lucide React

## Database Schema

- **players**: Player information and current state
- **matches**: Match sessions and metadata
- **time_logs**: Detailed time tracking history

All tables have Row Level Security enabled for user data isolation.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test thoroughly
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
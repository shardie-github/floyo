# Floyo Frontend

Next.js frontend application for Floyo.

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Features

- **Authentication**: User registration and login
- **Dashboard**: Overview of statistics, suggestions, patterns, and events
- **Realtime Updates**: WebSocket connection for live data
- **Responsive Design**: Modern UI built with Tailwind CSS

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- TanStack Query (React Query)
- Axios
- WebSocket API

## Project Structure

```
frontend/
??? app/              # Next.js app directory
?   ??? layout.tsx   # Root layout
?   ??? page.tsx     # Home page
?   ??? globals.css  # Global styles
??? components/      # React components
??? lib/             # Utilities and API client
??? hooks/           # Custom React hooks
??? public/          # Static assets
```

# 🎵 SoundBytez Platform

**The Ultimate Music Industry Networking and Project Management Platform**

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-2.49.8-green)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.11-38B2AC)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-11.8.1-orange)](https://firebase.google.com/)

---

## 🌟 **Platform Overview**

SoundBytez is a comprehensive music industry networking and project management platform designed to connect artists, producers, engineers, and music business professionals. Built with cutting-edge technology and enterprise-grade security, it provides everything needed to manage music projects, collaborate with industry professionals, and grow your music career.

### **🎯 Key Features**

- **🤝 Professional Networking**: Connect with artists, producers, engineers, and industry professionals
- **📁 Project Management**: Comprehensive tools for managing music projects from concept to completion
- **🛒 Services Marketplace**: Find and offer music services with integrated payment processing
- **🎤 Performance Management**: Event-centric performance planning with setlists, riders, and team management
- **💼 Career Planning**: Goal setting, milestone tracking, and career development tools
- **🔍 Advanced Search**: AI-powered search with fuzzy matching and intelligent filtering
- **🔒 Enterprise Security**: Multi-layer security with real-time threat detection and compliance monitoring
- **📊 Analytics Dashboard**: Comprehensive insights and performance metrics
- **🌐 Global CDN**: Fast, reliable access worldwide with 99.9% uptime

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Supabase account for backend services
- Firebase account for hosting and authentication

### Local Development

```sh
# Clone the repository
git clone https://github.com/SoundBytezRob/soundbytez-platform.git

# Navigate to the project directory
cd soundbytez-platform

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Environment Setup

Create a `.env.local` file with your configuration:

```env
# Next.js Environment Variables (migrated from VITE_)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

## 🛠️ Technology Stack

This project is built with modern web technologies:

- **Frontend**: React 18 + TypeScript + Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Backend**: Supabase (PostgreSQL + Real-time + Auth + Storage)
- **Hosting**: Firebase App Hosting
- **Authentication**: Supabase Auth + Google OAuth
- **File Storage**: Google Drive API + Supabase Storage
- **State Management**: React Query (TanStack Query)
- **SSR**: Next.js Server-Side Rendering

## 📜 Available Scripts

- `npm run dev` - Start Next.js development server (port 3000)
- `npm run build` - Next.js production build
- `npm run start` - Start Next.js production server
- `npm run lint` - Run Next.js ESLint

## 🚀 Deployment

The platform is deployed using Firebase App Hosting with Next.js 14 and GitHub Actions for CI/CD.

### Production URL
- **Live Site**: [soundbytez.cloud](https://soundbytez.cloud)
- **Firebase App Hosting**: [soundbytez-fffc9.web.app](https://soundbytez-fffc9.web.app)

### Deployment Process
```sh
# Automatic deployment via GitHub push
git add .
git commit -m "Deploy changes"
git push origin main

# Manual deployment (if needed)
npm run build
firebase deploy --only apphosting
```

### Migration Notes
- ✅ **Migrated from Vite to Next.js 14** for better Firebase App Hosting compatibility
- ✅ **Server-Side Rendering** enabled for improved SEO and performance
- ✅ **Environment variables** updated from `VITE_*` to `NEXT_PUBLIC_*`
- ✅ **App Router** implemented for modern Next.js routing

For detailed deployment instructions, see [NEXTJS_FIREBASE_DEPLOYMENT_GUIDE.md](./NEXTJS_FIREBASE_DEPLOYMENT_GUIDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software owned by RØB. All rights reserved.

## 📞 Support

For support, email [support@soundbytez.cloud](mailto:support@soundbytez.cloud) or join our community forums.

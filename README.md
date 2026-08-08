# AI Trip Planner

![Stack](https://img.shields.io/badge/Stack-MERN-green)
![AI](https://img.shields.io/badge/AI-Google%20Gemini-orange)
![Maps](https://img.shields.io/badge/Maps-OpenStreetMap-blue)
![Routing](https://img.shields.io/badge/Routing-OSRM-purple)
![Auth](https://img.shields.io/badge/Auth-JWT-red)
![Deployment](https://img.shields.io/badge/Deployment-Vercel%20%7C%20Render-black)

**AI Trip Planner** is a full-stack MERN application that uses AI-assisted reasoning and free, open-source mapping services to generate intelligent travel itineraries in real time.

The system focuses on practical integration, scalability, and user-centric planning with **zero paid API dependencies** for core functionality.

---

## TL;DR

AI Trip Planner combines **Google Gemini AI**, **OpenStreetMap**, and **OSRM routing** to create personalized travel plans with live location data, secure authentication, and a production-ready MERN architecture—**all using free, open-source services**.

---

## Problem Statement

Most travel planning platforms suffer from:

- **Static, non-personalized itineraries** that don't adapt to user preferences
- **Expensive API dependencies** that limit accessibility
- **Poor integration** between planning, navigation, and location discovery
- **No AI-driven reasoning** for trip optimization
- **Fragmented user experience** across multiple platforms

Users are forced to manually coordinate between multiple tools for maps, planning, and navigation.

---

## Solution Overview

AI Trip Planner solves this by acting as a **centralized, intelligent planning system** that:

- **Generates AI-powered itineraries** based on user preferences using Google Gemini AI
- **Integrates free location services** via OpenStreetMap, Nominatim, and Overpass API
- **Provides real-time routing** using OSRM (Open Source Routing Machine)
- **Supports secure authentication** with JWT dual-token system
- **Maintains a scalable MERN backend** for future expansion

The application is designed for **real-world usability**, not just demo output.

---

## Core Features

### AI-Powered Trip Planning

- **Personalized itinerary generation** using Google Gemini AI
- **Destination-based activity suggestions** with timing and cost estimates
- **Day-wise structured planning** with activities, meals, and transportation
- **Preference-aware optimization** (budget, duration, interests, travel style)
- **Multi-day support** (1-30+ days)
- **Cost breakdown** for each activity and day

### Location & Navigation (100% Free Services)

- **OpenStreetMap integration** for live location tracking
- **Nominatim geocoding** for address-to-coordinates conversion
- **Overpass API** for nearby places discovery (restaurants, attractions, parks, etc.)
- **OSRM routing** for directions and route optimization
- **Map-based UX** for trip exploration and planning
- **Saved locations** for favorite destinations

### User System

- **Secure JWT-based authentication** with dual-token system
  - Access tokens (15 minutes)
  - Refresh tokens (7 days, HTTP-only cookies)
- **Persistent login** with "Remember Me" functionality
- **Account security features**:
  - Password hashing with bcrypt (14 rounds)
  - Account lockout after 5 failed attempts
  - Rate limiting on sensitive endpoints
- **User dashboard** for:
  - Saved trips
  - Trip history
  - User preferences
  - Profile management

### Modern User Interface

- **Responsive design** optimized for desktop, tablet, and mobile
- **Smooth animations** powered by Framer Motion
- **Interactive components**: Dynamic forms, modals, tooltips, notifications
- **Real-time updates** via Socket.IO
- **Dark/Light mode** theme switching with persistence
- **Multi-language support** (English, Kannada, Telugu)
- **PDF export** for trip itineraries (planned)
- **Clean, intuitive UX** with Tailwind CSS

### Offline & PWA Features

- **Progressive Web App (PWA)** support for mobile and desktop
- **Offline mode** - View saved trips without internet
- **Service Worker** caching for faster load times
- **Background sync** for trip updates
- **Push notifications** (future feature)
- **Installable app** - Add to home screen

### Social & Collaboration

- **Social sharing** - Share trips on Facebook, Twitter, WhatsApp, LinkedIn, Telegram
- **Public trip links** - Generate shareable links for your itineraries
- **Collaborative planning** - Invite others to co-plan trips (real-time)
- **Multi-user editing** with role-based permissions (Owner, Editor, Viewer)
- **Comments and voting** on activities and destinations
- **Live cursor tracking** see where collaborators are editing

### Advanced Features

- **Itinerary versioning** - Save and restore previous versions of your trip
- **Version history** - Track all changes made to your itinerary
- **Version comparison** - Compare differences between versions
- **Cost optimization** - AI-powered suggestions to reduce trip expenses
- **Budget breakdown** - Detailed analysis of costs by category
- **Smart recommendations** - Get personalized money-saving tips

---

## ✨ Complete Feature List

### 🤖 AI & Intelligent Planning

- **Smart Destination Suggestions** - AI-powered destination recommendations with trending destinations, similar places, and popular routes
- **AI Itinerary Generation** - Personalized day-by-day travel plans using Google Gemini AI
- **Smart Activity Timing** - Automatic scheduling with optimal time allocation
- **Interest-Based Filtering** - Activities matched to your preferences
- **Cost-Aware Planning** - Budget-conscious activity suggestions
- **Multi-Day Optimization** - Support for 1-30+ day trips
- **Weather Integration** - Real-time weather data with travel recommendations
- **Surprise Me Generator** - Random trip suggestions with one-click planning

### 📊 Trip Analytics & Insights

- **Trip Compatibility Score** - Overall trip rating with compatibility breakdown:
  - Relaxation Score
  - Adventure Level
  - Budget Fit Analysis
  - Cultural Immersion Rating
  - Food Experience Score
  - Sustainability Index
- **Travel Insights Dashboard** - Comprehensive trip analytics:
  - Total distance calculation
  - Cities visited count
  - Travel time estimation
  - Accommodation tracking
  - Budget usage percentage
  - Day vs Night activity balance
  - Food experiences count
  - Trip pace analysis
- **Sustainability Panel** - Eco-friendly travel tracking:
  - Carbon footprint calculation
  - Trees needed to offset
  - Environmental impact factors
  - Eco-friendly recommendations

### 💰 Expense & Budget Management

- **Day-wise Expense Tracker** - Track spending by day with categories:
  - Food & Dining
  - Transportation
  - Accommodation
  - Activities & Tours
  - Shopping & Souvenirs
  - Miscellaneous
- **Real-Time Budget Tracking** - Live budget utilization with alerts
- **Category Breakdown** - Visual expense distribution by type
- **Per-Person Cost Calculation** - Split costs among travelers
- **Budget Alerts** - Color-coded warnings (green/yellow/red)
- **CSV Export** - Download expense reports
- **Advanced Cost Optimization** - AI suggestions to save money:
  - Transportation optimization
  - Accommodation alternatives
  - Activity discounts
  - Timing optimization
  - Food cost reduction

### 🎒 Travel Preparation

- **Auto-Generated Packing List** - Intelligent packing suggestions including:
  - Climate-aware clothing
  - Essential items
  - Climate-specific medicines
  - Required documents (with special permits)
  - Electronics recommendations
  - Toiletries & hygiene
  - Adventure gear (activity-based)
  - Miscellaneous items
- **Priority-Based Items** - Items tagged as Must Have, Important, Recommended, or Optional
- **Interactive Checklist** - Check off items as you pack
- **Download & Print** - Export packing list in multiple formats
- **Priority Tracking** - Progress bar for packing completion

### 🗺️ Maps & Navigation (100% Free)

- **OpenStreetMap Integration** - Live interactive maps
- **Route Optimization** - Find the best route visiting multiple stops
- **OSRM Routing** - Turn-by-turn directions and distance calculation
- **Nominatim Geocoding** - Address-to-coordinates conversion
- **Overpass API** - Discover nearby places:
  - Restaurants & cafes
  - Attractions & landmarks
  - Parks & nature spots
  - Hotels & accommodations
  - Gas stations
  - Hospitals & pharmacies
  - Shopping malls
  - Events & activities
  - Wellness facilities
- **Multi-Stop Route Planning** - Visit multiple locations in optimal order
- **Alternative Routes** - View different route options
- **Location Search** - Find destinations by name or coordinates
- **Distance & Duration Estimates** - Realistic travel time calculations

### 👥 Collaborative Features

- **Invite Collaborators** - Share trip planning via email invitations
- **Role-Based Permissions**:
  - Owner: Full control & management
  - Editor: Can modify itinerary and add comments
  - Viewer: Read-only access
- **Real-Time Sync** - Changes visible instantly to all collaborators
- **Comments & Discussion** - Discuss activities and destinations
- **Activity Voting** - Vote on activities and itinerary suggestions
- **Live Presence** - See who's editing in real-time
- **Shareable Public Links** - Generate unique links for trip preview
- **Social Media Sharing** - Share on Facebook, Twitter, WhatsApp, LinkedIn, Telegram, Email

### 📋 Itinerary Management

- **Version History** - Unlimited version saving with metadata
- **Version Restore** - Roll back to any previous version
- **Version Comparison** - Side-by-side comparison of versions
- **Auto-Save** - Automatic versioning on significant changes
- **Version Metadata** - Track changes, author, and timestamp
- **Day-by-Day Planning** - Structured itinerary with:
  - Morning activities
  - Afternoon activities
  - Evening activities
  - Night activities
  - Meal recommendations
  - Travel segments
- **Activity Details** - Duration, cost, location, and descriptions
- **Time-Based Schedule** - Hour-by-hour planning view

### 🎨 Customization & Preferences

- **Night vs Day Preferences** - Choose preferred activity times
- **Travel Style Selection** - Budget, Comfort, Luxury options
- **Interest-Based Filtering** - Select trip interests (culture, adventure, food, etc.)
- **Accommodation Preferences** - Hotel, hostel, homestay, resort options
- **Transportation Preferences** - Car, train, bus, flight options
- **Budget Range Selection** - Set spending limits per day
- **Traveler Type Analysis** - Backpacker, Family, Solo, Group classification
- **Theme Customization** - Dark/Light mode with system preference detection


### 🔐 Security & Authentication

- **JWT Dual-Token System**:
  - Access tokens (15-minute expiry)
  - Refresh tokens (7-day expiry, HTTP-only cookies)
- **Secure Password Hashing** - bcrypt with 14-round salting
- **Account Lockout Protection** - Automatic lockout after 5 failed attempts
- **Rate Limiting** - Protection against brute-force attacks
- **"Remember Me" Functionality** - Persistent login option
- **Two-Factor Authentication** (OTP support) - Extra security layer
- **Password Reset Flow** - Secure email-based password recovery
- **Session Management** - Automatic token refresh
- **CORS & CSRF Protection** - Security middleware implemented

### 🔔 User Experience Features

- **Real-Time Notifications** - Toast notifications for actions
- **Error Handling** - User-friendly error messages
- **Loading States** - Visual feedback during operations
- **Form Validation** - Client and server-side validation
- **Search & Filter** - Find destinations and activities
- **Favorites/Bookmarks** - Save favorite destinations
- **Trip History** - View and manage past trips
- **User Profile** - Manage preferences and settings
- **Account Security** - Login history and device management

### 📱 Mobile & PWA

- **Responsive Mobile Design** - Optimized for all screen sizes
- **Progressive Web App** - Install as standalone app
- **Offline Functionality** - Work without internet
- **Service Worker** - Intelligent caching strategy
- **App Shortcuts** - Quick access to favorite features
- **Touch-Optimized UI** - Large tap targets and gestures

### 🏨 Booking Integrations

- **Gas Agency Booking** - Reserve fuel with pricing
- **Hospital Directory** - Emergency contact info
- **Pharmacy Locator** - Find medicines and healthcare
- **Shopping Mall Search** - Discover shopping destinations
- **Events & Activities** - Find local events and tours
- **Wellness Centers** - Yoga studios, spas, and wellness

### 📊 Analytics & Reporting

- **Trip Statistics** - Comprehensive trip metrics
- **Expense Reports** - Detailed cost breakdown
- **Activity Summary** - All activities at a glance
- **Carbon Footprint Report** - Environmental impact assessment
- **Budget Analysis** - Spending patterns and trends
- **Export Options** - PDF, CSV, and print formats

---

---

## System Architecture

### Frontend Architecture

```
React SPA
├── Component-based UI (modular, reusable)
├── Tailwind CSS (responsive styling)
├── Framer Motion (smooth transitions)
├── React Router (client-side routing)
├── React Query (data fetching & caching)
├── Context API (global state management)
└── Axios (HTTP client with interceptors)
```

### Backend Architecture

```
Node.js + Express REST API
├── MongoDB + Mongoose (data persistence)
├── JWT Authentication (dual-token system)
├── Socket.IO (real-time communication)
├── Winston (structured logging)
├── Helmet + CORS (security)
├── Rate Limiting (abuse prevention)
└── Modular route & service layers
```

---

## Tech Stack

### Frontend

| Technology | Purpose |
|-----------|---------|
| **React 18** | UI framework with hooks and context |
| **React Router v6** | Client-side routing |
| **Tailwind CSS** | Utility-first styling |
| **Framer Motion** | Smooth animations |
| **React Query (TanStack)** | Data fetching & caching |
| **React Hook Form** | Form handling with validation |
| **Axios** | HTTP client |
| **Socket.IO Client** | Real-time communication |
| **React Icons** | Icon library |
| **React Leaflet** | Interactive maps (OpenStreetMap) |
| **Chart.js** | Data visualization |

### Backend

| Technology | Purpose |
|-----------|---------|
| **Node.js** | JavaScript runtime |
| **Express.js** | Web framework |
| **MongoDB** | NoSQL database |
| **Mongoose** | MongoDB ODM |
| **JWT** | Secure authentication |
| **bcryptjs** | Password hashing |
| **Socket.IO** | Real-time communication |
| **Winston** | Advanced logging |
| **Helmet** | Security headers |
| **Express Validator** | Input validation |
| **Compression** | Response compression |

### External Services (All Free)

| Service | Purpose | Cost |
|---------|---------|------|
| **Google Gemini AI** | AI itinerary generation | FREE (60 req/min) |
| **OpenStreetMap** | Map tiles and data | FREE |
| **Nominatim** | Geocoding | FREE |
| **Overpass API** | POI search | FREE |
| **OSRM** | Routing & directions | FREE |

---

## Project Structure

```
AI-TripPlanner/
├── client/                          # React Frontend
│   ├── public/
│   │   ├── index.html              # HTML template
│   │   └── manifest.json           # PWA manifest
│   ├── src/
│   │   ├── components/             # Reusable UI components
│   │   │   ├── auth/              # Login, Register, ProtectedRoute
│   │   │   ├── common/            # Button, Input, Modal, Card
│   │   │   ├── layout/            # Header, Footer, Sidebar
│   │   │   ├── maps/              # Map components (Leaflet)
│   │   │   └── trip/              # Trip cards, detail views
│   │   ├── contexts/              # React Context
│   │   │   ├── AuthContext.js    # Authentication state
│   │   │   └── NotificationContext.js  # Real-time notifications
│   │   ├── hooks/                 # Custom hooks
│   │   ├── pages/                 # Application pages
│   │   │   ├── Home.js           # Landing page
│   │   │   ├── Dashboard.js      # User dashboard
│   │   │   ├── TripPlanner.js    # AI trip planning
│   │   │   ├── TripDetail.js     # Trip detail view
│   │   │   ├── Maps.js           # Interactive maps
│   │   │   ├── Trips.js          # Trip list
│   │   │   ├── Profile.js        # User profile
│   │   │   └── auth/             # Login, Register
│   │   ├── services/              # API layer
│   │   │   └── api.js            # Axios config & endpoints
│   │   ├── App.js                # Main app component
│   │   ├── index.js              # React entry point
│   │   └── index.css             # Global styles
│   └── package.json
│
├── server/                          # Node.js Backend
│   ├── controllers/                # Route controllers
│   │   ├── aiController.js        # AI itinerary generation
│   │   ├── authControllerNew.js   # Authentication logic
│   │   ├── mapsController.js      # Maps & location services
│   │   └── tripController.js      # Trip CRUD operations
│   ├── middleware/                 # Express middleware
│   │   ├── auth.js               # JWT authentication
│   │   ├── logging.js            # Winston logger
│   │   └── security.js           # Security headers & rate limiting
│   ├── models/                     # Mongoose schemas
│   │   ├── User.js               # User model
│   │   └── Trip.js               # Trip model
│   ├── routes/                     # Express routes
│   │   ├── ai.js                 # AI endpoints
│   │   ├── authNew.js            # Auth endpoints
│   │   ├── maps.js               # Maps endpoints
│   │   ├── trips.js              # Trip endpoints
│   │   └── users.js              # User endpoints
│   ├── services/                   # External integrations
│   │   ├── geminiService.js      # Google Gemini AI
│   │   └── freeMapService.js     # OSM, Nominatim, OSRM
│   ├── utils/                      # Utilities
│   │   └── tokens.js             # JWT token management
│   ├── server.js                  # Express app setup
│   ├── .env.example              # Environment template
│   └── package.json
│
├── .gitignore
├── package.json                    # Root scripts
└── README.md
```

---

## Setup & Installation

### Prerequisites

- **Node.js** v14+ ([Download](https://nodejs.org/))
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Git** ([Download](https://git-scm.com/))

### Installation Steps

```bash
# 1. Clone the repository
git clone https://github.com/yashas98765/Ai-Travel-Planner.git
cd Ai-Travel-Planner

# 2. Install all dependencies
npm run install-all

# Or install manually:
npm install                    # Root dependencies
cd server && npm install       # Server dependencies
cd ../client && npm install    # Client dependencies
```

### Environment Configuration

Create `server/.env`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ai-trip-planner
MONGODB_URI_PROD=your_mongodb_atlas_uri_here

# JWT Secrets (Generate strong random strings)
JWT_ACCESS_SECRET=your_super_secure_access_secret_min_32_chars
JWT_REFRESH_SECRET=your_super_secure_refresh_secret_min_32_chars
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Google Gemini AI (Required - FREE)
GEMINI_API_KEY=your_gemini_api_key_here

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
CLIENT_URL=http://localhost:3000

# Security
BCRYPT_ROUNDS=14
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION=900000

# Optional: Custom User-Agent for OSM services
MAPS_USER_AGENT=AI-TripPlanner/1.0 (Educational Project)
```

Create `client/.env` (optional):

```env
# API Configuration
REACT_APP_API_URL=http://localhost:5000/api
```

### Get API Keys

#### Google Gemini AI (Required - FREE)

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add to `server/.env`: `GEMINI_API_KEY=your_key_here`
5. **Free tier**: 60 requests/minute

#### MongoDB Atlas (Recommended for Production)

1. Visit [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free M0 cluster
3. Get your connection string
4. Add to `server/.env`: `MONGODB_URI_PROD=mongodb+srv://...`
5. **Important**: Add `0.0.0.0/0` to Network Access (or your server's IP)

---

## Running the Application

### Quick Start (Auto-Start) 🚀

**Windows Users - Easiest Method:**

Simply double-click one of these files in the project root:

- **`start.bat`** - Batch script (works on all Windows versions)
- **`start.ps1`** - PowerShell script (enhanced version)

Or run from command line:

```bash
# Using Batch Script
start.bat

# Using PowerShell Script
powershell -ExecutionPolicy Bypass -File start.ps1
```

These scripts will:
- ✅ Automatically start MongoDB service (if installed)
- ✅ Clean up any existing processes
- ✅ Start both client and server simultaneously
- ✅ Open at http://localhost:3000

### Development Mode

**Option 1: Run both frontend and backend simultaneously** (Recommended)

```bash
# From the root directory
npm run dev
```

**Option 2: Run separately**

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm start
```

**Access the application:**

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

### Production Build

```bash
# Build the client
cd client
npm run build

# Start the server
cd ../server
NODE_ENV=production npm start
```

---

## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |
| POST | `/refresh` | Refresh access token | No |
| POST | `/logout` | User logout | Yes |
| GET | `/me` | Get current user | Yes |
| PUT | `/profile` | Update profile | Yes |
| POST | `/change-password` | Change password | Yes |

### AI Trip Planning (`/api/ai`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/generate-itinerary` | Generate AI itinerary | Yes |
| POST | `/optimize-itinerary` | Optimize itinerary | Yes |
| POST | `/travel-suggestions` | Get suggestions | Yes |
| GET | `/recommendations` | Get recommendations | Yes |

### Trip Management (`/api/trips`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all user trips | Yes |
| POST | `/` | Create new trip | Yes |
| GET | `/:id` | Get trip by ID | Yes |
| PUT | `/:id` | Update trip | Yes |
| DELETE | `/:id` | Delete trip | Yes |
| GET | `/stats` | Get trip statistics | Yes |

### Maps & Location (`/api/maps`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/places/nearby` | Get nearby places (OSM) | Yes |
| GET | `/places/search` | Search places | Yes |
| GET | `/directions` | Get directions (OSRM) | Yes |
| GET | `/geocode` | Geocode address | Yes |
| GET | `/reverse-geocode` | Reverse geocode | Yes |
| POST | `/save-location` | Save location | Yes |

---

## Security Features

- **JWT Authentication** with dual-token system
- **Password Hashing** with bcrypt (14 salt rounds)
- **Account Lockout** after 5 failed login attempts
- **Rate Limiting** on all endpoints
- **Input Validation** with express-validator
- **XSS Protection** with xss-clean
- **CORS** configured for specific origins
- **Helmet** for security headers
- **MongoDB Sanitization** to prevent NoSQL injection
- **HTTP-only Cookies** for refresh tokens

---

## Deployment

### Frontend (Vercel)

1. **Connect GitHub to Vercel**
2. **Configure Build Settings**:
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
3. **Environment Variables**:
   - `REACT_APP_API_URL`: `https://your-backend.onrender.com/api`
4. **Deploy** - Vercel auto-deploys on push to main

### Backend (Render)

1. **Create Web Service on Render**
2. **Configure Settings**:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
3. **Environment Variables** (copy from `.env.example`):
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_atlas_uri
   JWT_ACCESS_SECRET=your_secret
   JWT_REFRESH_SECRET=your_secret
   GEMINI_API_KEY=your_key
   ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
   CLIENT_URL=https://your-vercel-app.vercel.app
   ```
4. **Deploy** - Render auto-deploys on push

---

## Engineering Learnings

- Integrating **multiple free APIs** (OSM, Nominatim, Overpass, OSRM) in a production system
- Managing **AI latency** and implementing retry logic
- Designing **scalable MERN architectures** with modular services
- Handling **cross-origin authentication** (Vercel + Render)
- Building **production-ready API layers** with proper error handling
- Balancing **AI assistance** with deterministic logic
- Implementing **PWA features** with Service Workers and offline caching
- Building **real-time collaboration** with Socket.IO
- Managing **multi-language support** with i18next
- Designing **version control systems** for user-generated content
- Implementing **cost optimization algorithms** for travel planning
- Implementing **dual-token JWT** authentication system
- **Rate limiting** and security best practices

---

## Known Limitations

- No hotel booking integration (removed to avoid paid APIs)
- No flight/train booking (removed to avoid paid APIs)
- AI output quality depends on input clarity
- Free API tiers impose rate limits (Nominatim: 1 req/sec)
- Collaborative features require active internet connection
- Version history storage may impact database size for large trips

---

## Future Roadmap

- ✅ **Completed in Latest Version:**
  - Offline mode with PWA support
  - Multi-language support (English, Kannada, Telugu)
  - Social sharing features
  - Itinerary versioning
  - Advanced cost optimization
  - Collaborative trip planning (real-time)

- **Upcoming Features:**
  - Mobile app (React Native)
  - Voice-guided navigation
  - AR location previews
  - Weather integration improvements
  - Currency converter
  - Travel insurance recommendations
  - Visa requirement checker
- Dark mode

---

---

## Author

**Yashas S H**  
Full Stack Mern Developer

- **Email**: yashas.s.h2601@gmail.com

---

## Acknowledgments

- **Google Gemini AI** for intelligent itinerary generation
- **OpenStreetMap** for free, open-source mapping data
- **Nominatim** for geocoding services
- **OSRM** for routing and directions
- **MongoDB** for flexible database solutions
- **Vercel** & **Render** for free hosting
- **React** and **Node.js** communities

---

## Support

If you encounter issues:

1. Check the [Issues](https://github.com/yashas98765/Ai-Travel-Planner/issues) page
2. Create a new issue with detailed information
3. Contact: yashas.s.h2601@gmail.com

---

**AI Trip Planner** — Practical AI-assisted travel planning with real-world, free data.

Made with ❤️ by Yashas S H

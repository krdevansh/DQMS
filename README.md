# DQMS - Digital Queue Management System

A unified platform for managing queues across multiple service industries with a dual-theme experience.

## 📁 Project Structure

```
DQMS/
├── Salons/frontend/                   # Next.js 15 + TypeScript
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # DQMS Platform Home
│   │   │   └── salon/
│   │   │       ├── page.tsx           # Luxury Salon Hero
│   │   │       ├── login/page.tsx     # Customer Login
│   │   │       ├── register/page.tsx  # Salon Registration
│   │   │       ├── book/page.tsx      # 4-Step Booking
│   │   │       ├── dashboard/page.tsx# Salon Dashboard
│   │   │       └── customer/
│   │   │           ├── page.tsx       # Browse Salons
│   │   │           └── [slug]/page.tsx# Salon View
│   │   ├── themes/                 # Theme configs
│   │   ├── types/                 # TypeScript interfaces
│   │   └── lib/                   # Utilities
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── Clinics/                          # Coming Soon
├── Hospitals/                        # Coming Soon
├── Government_Offices/              # Coming Soon
└── Service_Centers/                  # Coming Soon
```

## 🚀 Quick Start

```bash
# Navigate to the salon frontend
cd Salons/frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Visit: `http://localhost:3000`

## 🎨 Dual Theme Experience

### DQMS Platform (Corporate SaaS)
| Property | Value |
|----------|-------|
| Background | #F5F7FA |
| Primary | #2563EB |
| Accent | #06B6D4 |
| Style | Clean, modern, scalable |

### Salon Module (Luxury Dark)
| Property | Value |
|----------|-------|
| Background | #0D0D0D |
| Gold | #D4AF37 |
| Neon | #FF8C42 |
| Style | Premium, cinematic |

## 🎯 Key Routes

| Route | Description |
|-------|-------------|
| `/` | DQMS Platform Home |
| `/salon` | Luxury Salon Hero |
| `/salon/login` | Customer PIN Login |
| `/salon/register` | Salon Owner Signup |
| `/salon/book` | 4-Step Premium Booking |
| `/salon/dashboard` | Salon Management |
| `/salon/customer` | Browse Nearby Salons |
| `/salon/customer/[slug]` | Individual Salon View |

## 📦 Tech Stack

- **Framework**: Next.js 14.2
- **Language**: TypeScript 5.5
- **Styling**: Tailwind CSS 3.4
- **Animations**: Framer Motion 11.3
- **Icons**: Lucide React 0.424

## 🔧 Backend Setup (Coming Soon)

The frontend is complete. Backend with the following features is planned:

### Required Dependencies
- Express.js or FastAPI for REST API
- PostgreSQL or MongoDB for database
- Redis for real-time queue updates
- JWT for authentication
- SMS gateway integration

### Environment Variables
Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### API Endpoints Required
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Customer/salon owner login |
| `/api/auth/register` | POST | Salon owner registration |
| `/api/salons` | GET | List all salons |
| `/api/salons/[slug]` | GET | Get salon details |
| `/api/queue/join` | POST | Join queue |
| `/api/queue/status` | GET | Get queue position |
| `/api/queue/complete` | POST | Mark service complete |
| `/api/bookings` | POST | Create booking |

### Database Schema (Planned)
- `users` - Customer and salon owner accounts
- `salons` - Salon information
- `services` - Available services per salon
- `queue_entries` - Current queue positions
- `bookings` - Appointment bookings

## 📱 Mobile Support

All pages are fully responsive and mobile-optimized.

## 🔒 Security Notes

- Never commit `.env` files with real credentials
- Use strong JWT secrets in production
- Implement rate limiting on API endpoints
- Sanitize all user inputs
- Use HTTPS in production

## 👤 Author

Kumar Devansh | B.Tech CSE, LPU University

## 📄 License

© {new Date().getFullYear()} Kumar Devansh. All Rights Reserved.
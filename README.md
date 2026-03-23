# Book Fair Entry Pass Registration System

A modern, mobile-responsive web application for managing Book Fair 2026 entry passes with OTP verification and admin panel.

## Features

### Public Registration
- Mobile-responsive registration form with real-time validation
- OTP verification via phone number
- Digital entry pass with QR code
- Beautiful Book Fair themed UI

### Admin Panel
- Secure admin login with JWT authentication
- Dashboard with real-time statistics
- Visitor management (view, search, paginate)
- Volunteer management (add, enable/disable)
- Export data to Excel
- Responsive sidebar layout

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Icons**: Lucide React
- **QR Code**: qrcode.react

## Prerequisites

- Node.js 16+ installed
- Backend API running on `http://localhost:3000` (or configured URL)

## Installation

```bash
# Install dependencies
npm install

# Set up environment variables
# Edit .env file with your backend API URL
VITE_API_BASE_URL=http://localhost:3000
```

## Development

```bash
# Start development server
npm run dev

# Type checking
npm run typecheck

# Build for production
npm run build
```

## API Integration

The application connects to the backend API at the URL specified in `.env`. Ensure your backend is running before using the application.

### Required API Endpoints

**Public:**
- `POST /api/send-otp` - Send OTP to phone
- `POST /api/verify-otp` - Verify OTP and register visitor

**Admin:**
- `POST /api/admin/login` - Admin login
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/visitors` - List all visitors (paginated)
- `GET /api/admin/volunteers` - List all volunteers
- `POST /api/admin/volunteer` - Create volunteer
- `PATCH /api/admin/volunteer/:id/status` - Toggle volunteer status
- `GET /api/admin/export` - Export visitors to Excel

## Default Credentials

**Admin:**
- Username: `admin`
- Password: `admin123`

## Project Structure

```
src/
├── components/           # Reusable components
│   ├── RegistrationForm.tsx
│   ├── OTPVerification.tsx
│   └── TicketPreview.tsx
├── pages/               # Page components
│   ├── AdminLogin.tsx
│   ├── AdminDashboard.tsx
│   └── admin/
│       ├── DashboardHome.tsx
│       ├── VisitorsPage.tsx
│       └── VolunteersPage.tsx
├── services/            # API service layer
│   └── api.ts
├── App.tsx             # Main app with routing
└── main.tsx            # Entry point
```

## Features Breakdown

### Registration Flow
1. User fills registration form with validation
2. Backend sends OTP to phone number
3. User enters OTP for verification
4. System generates unique Visitor ID
5. User receives digital pass with QR code

### Admin Features
- **Dashboard**: View total visitors, today's count, scanned entries, pending entries
- **Visitors**: Search, filter, and view all registered visitors
- **Volunteers**: Add new volunteers and manage their status
- **Export**: Download visitor data as Excel file

## Security

- JWT token-based authentication for admin routes
- Protected admin routes with automatic redirect
- Token stored in localStorage
- Real-time validation on all forms

## Mobile Responsive

The application is fully responsive and works seamlessly on:
- Mobile phones (320px+)
- Tablets (768px+)
- Desktops (1024px+)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

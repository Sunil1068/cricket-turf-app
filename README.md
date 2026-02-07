# Cricket Turf Booking Platform

A production-style web app for booking cricket turfs in India, similar to Playo.co.

## Features

- **Single Turf Management**: Book hourly slots for one cricket turf
- **Operating Hours**: 7:00 AM to 2:00 AM (next day)
- **Pricing**: ₹1500/hour (7 AM - 10 PM), ₹1600/hour (10 PM - 2 AM)
- **Slot Duration**: 60 minutes
- **Authentication**: NextAuth with credentials provider
- **Payments**: Razorpay integration (INR, TEST mode)
- **Role-based Access**: USER and OWNER roles
- **Dashboard**: User bookings, Owner management
- **CSV Export**: Owner can export bookings to CSV

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI**: shadcn/ui components
- **Backend**: Next.js API routes, Server Actions
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: Razorpay
- **Validation**: Zod
- **Forms**: React Hook Form
- **Date/Time**: Day.js

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Razorpay test account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cricket-turf-booking
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/cricket_turf_booking"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
RAZORPAY_KEY_ID="rzp_test_your_key_id"
RAZORPAY_KEY_SECRET="your_razorpay_key_secret"
```

4. Set up the database:
```bash
npx prisma migrate dev
npx prisma db seed
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### User
- id, name, email, phone, passwordHash, role, createdAt

### Booking
- id, userId, date, startTimeUtc, endTimeUtc, slotsCount, amountPaise, status, createdAt

### Payment
- id, bookingId, provider, razorpayOrderId, razorpayPaymentId, razorpaySignature, amountPaise, currency, status, createdAt

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/signin` - Sign in user (handled by NextAuth)

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `DELETE /api/bookings/[id]` - Cancel booking

### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment

### Owner
- `GET /api/owner/export-bookings` - Export bookings to CSV

## Business Logic

### Slot Generation
- Slots from 7:00 AM to 2:00 AM (IST)
- Hourly slots, 60 minutes each
- Pricing based on start time

### Booking Constraints
- Prevent double booking with database constraints
- PENDING bookings expire after 10 minutes
- Only CONFIRMED bookings block slots

### Payment Flow
1. Create booking (PENDING status)
2. Create Razorpay order
3. Complete payment
4. Verify payment signature
5. Update booking to CONFIRMED

## Default Users

After seeding, you can login with:

**Owner Account:**
- Email: `owner@turf.com`
- Password: `Owner@1234`

**Sample User:**
- Email: `user@example.com`
- Password: `User@1234`

## Deployment

1. Build the application:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

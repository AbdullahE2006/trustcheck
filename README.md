# TrustCheck - Cybersecurity Platform

## Overview

TrustCheck is a professional, modern cybersecurity web application designed to help ordinary internet users identify potential online threats, phishing attempts, suspicious URLs, scam messages, fraudulent emails, and unsafe online activities.

**Tagline:** "Stay Safe. Stay Smart. Trust Nothing Blindly."

## Features

### Core Security Tools

1. **URL Security Scanner** - Enter a URL to check for potential security risks including:
   - Invalid URL detection
   - HTTPS availability check
   - Suspicious URL pattern analysis
   - IP-based URL detection
   - Suspicious shortening services detection
   - Phishing indicator identification
   - Risk Score (0-100) with classification

2. **Scam Message Analyzer** - Paste suspicious messages from:
   - WhatsApp, SMS, Telegram, Facebook, Email
   - Analyzes for: urgent payment requests, suspicious links, OTP requests, fake prize claims, financial scams, impersonation language

3. **Email Phishing Analyzer** - Paste email content to check for:
   - Suspicious sender information
   - Urgent language patterns
   - Fake account warnings
   - Password requests
   - Financial requests
   - Suspicious URLs

4. **Password Strength Checker** - Local browser-based analysis:
   - Length analysis
   - Character diversity
   - Common password warnings
   - Estimated cracking difficulty category
   - **Never transmits passwords to external services**

5. **Website Security Information** - Basic security checks:
   - HTTPS status
   - Domain information
   - Security headers guidance
   - Clear distinction between unavailable and failed checks

### Cyber Academy

Learning center with 8 categories:
- Cybersecurity Fundamentals
- Phishing Awareness
- Password Security
- Network Security
- Malware Awareness
- Social Engineering
- Online Privacy
- Mobile Security

Each category includes 3-4 beginner-friendly lessons with practical examples.

### Additional Features

- **Responsive Design** - Works on mobile, tablet, desktop
- **Dark Cybersecurity Aesthetic** - Premium black theme with neon green accents
- **Glassmorphism Design** - Modern translucent effects
- **Smooth Transitions** - Professional animations
- **Optional Authentication** - Use tools without creating an account
- **Admin Dashboard** - Protected interface for moderation
- **Cybersecurity News** - Latest alerts and scam warnings

## Technology Stack

### Frontend
- React.js 18
- Vite 5
- TypeScript
- Tailwind CSS 3
- Lucide React Icons

### Backend
- Node.js with Express.js
- TypeScript
- Rate limiting
- Helmet security headers
- CORS configuration
- XSS protection
- express-rate-limit

### Development
- Free-tier services only
- No paid APIs or subscriptions
- Cloudflare Pages compatible
- GitHub for version control

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/trust-check.git
   cd trust-check
   ```

2. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd ../backend
   npm install
   ```

4. **Configure environment variables**
   ```bash
   cp backend/.env.example backend/.env
   # Edit .env with your configuration
   ```

5. **Start the development servers**
   ```bash
   # In one terminal
   cd frontend
   npm run dev

   # In another terminal
   cd backend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

### Building for Production

```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd backend
npm run build
```

## Deployment

### Frontend on Cloudflare Pages

1. Push your code to GitHub
2. Connect your repository to Cloudflare Pages
3. Set build command: `npm run build` (in frontend directory)
4. Set output directory: `dist`
5. Deploy

### Backend on Cloudflare Workers

1. The backend is designed to be compatible with Cloudflare Workers
2. Deploy the `backend/src` directory as a Worker
3. Update CORS origins in the deployment configuration

## Security

TrustCheck implements the following security measures:

- Input validation on all endpoints
- XSS protection via helmet and xss-clean
- CSRF protection where applicable
- Rate limiting (100 requests per 15 minutes)
- Secure HTTP headers (helmet)
- SQL injection prevention (express-mongo-sanitize)
- Safe error handling - no stack traces exposed to users
- Protection against SSRF - no arbitrary URL fetching
- Never stores actual passwords (only hashed for demo)
- Password analysis performed entirely in browser
- Clear disclosure that scan results are indicators, not guarantees

## Important Notes

- **Scan results are indicators only** - Not guaranteed malware detection
- **Never share OTP codes** - No legitimate service will ask for OTP via message
- **Verify URLs manually** - Always check the actual destination before clicking
- **Use HTTPS whenever possible** - Especially for sensitive transactions
- **Report suspicious activity** - Use the platform's reporting features

## License

This project is free to use for personal and educational purposes. No commercial licensing required.

## Contact

For support or questions, please visit the TrustCheck website or check the documentation.

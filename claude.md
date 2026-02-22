# The Rack Hack - E-commerce Clothing Store

## Project Overview
The Rack Hack is a React-based e-commerce website for selling pre-owned and new clothing. The site features a public-facing store and an admin dashboard for managing inventory.

## Tech Stack
- **Frontend**: React 19, React Router, Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication, Hosting)
- **Icons**: Lucide React
- **Image Upload**: Cloudinary
- **AI Image Generation**: Gemini 3 Pro (via server.js backend → Cloudinary)
- **Payment**: Stripe Checkout (via server.js backend)
- **Shipping**: ShipEngine API (USPS rates via server.js backend)
- **Typography**: Google Fonts (Rubik for headings, Nunito Sans for body)

## Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── ProductEditor.js # Modal for adding/editing products
│   ├── CloudinaryUpload.js # Image upload component
│   ├── GlamourGenerator.js # AI glamour photo generation modal
│   ├── ContactModal.js  # Contact form modal
│   ├── ProtectedRoute.js # Auth-protected routes
│   ├── CompleteCheckout.js # Full checkout form with shipping & Stripe payment
│   └── GlowButton.js    # Animated glow button component
├── contexts/
│   └── AuthContext.js   # Firebase authentication context
├── pages/              # Page components
│   ├── AboutPage.js    # About page
│   ├── ItemDetail.js   # Individual product page
│   ├── ShopPage.js     # Main shop listing
│   ├── CheckoutPage.js # Checkout page with cart summary
│   └── OrderSuccessPage.js # Post-payment confirmation page
├── services/
│   └── productService.js # Firebase Firestore operations
├── assets/             # Images and static files
├── firebase.js         # Firebase configuration
├── ClothingStore.js    # Main app component
└── App.js             # Root component with routing

public/
├── favicon.ico
├── favicon-16x16.png
├── favicon-32x32.png
├── apple-touch-icon.png
├── android-chrome-192x192.png
└── android-chrome-512x512.png
```

## Features

### Public Features
- Browse products by category (Men's, Women's, Kids)
- Filter by condition (New, Pre-Owned)
- View product details with full images and descriptions
- Shopping cart with quantity management
- Multi-step checkout: contact info, shipping (live USPS rates via ShipEngine), Stripe payment
- Orders stored in Firestore (visible in admin dashboard)

### Admin Features (Authentication Required)
- Login/Signup system using Firebase Authentication
- Add new products with:
  - Name, description, size, price, stock
  - Category (Tops, Bottoms, Dresses, Outerwear)
  - Gender (Men's, Women's, Kids)
  - Condition (New, Pre-Owned)
  - Up to 3 images (Cloudinary upload or URL)
  - AI Glamour Photo generation (Gemini → Cloudinary) per image slot
- Edit existing products
- Delete products
- View orders
- Edit About page content

## Firebase Setup

### Firestore Collections
1. **products**
   - Fields: name, description, size, price, stock, image, image2, image3, category, gender, condition, createdAt, updatedAt
   - Access: Public read, authenticated write

2. **orders**
   - Fields: customer (object), items, total, date, status, createdAt, updatedAt
   - Access: Public create, authenticated read/update/delete
   - Service functions: getAllOrders, addOrder, updateOrder

3. **about**
   - Fields: title, content
   - Access: Public read, authenticated write

### Security Rules
Located in `firestore.rules`:
- Products: Anyone can read, only authenticated admins can write
- Orders: Anyone can create, only admins can view/manage
- About: Anyone can read, only admins can edit

### Authentication
- Email/password authentication
- Admin accounts created via `/signup` route
- Protected routes use `ProtectedRoute` component

## Local Development

### Running the App
```bash
npm start          # React frontend on http://localhost:3000
node server.js     # Backend API server on http://localhost:3001
```
Both must be running for checkout (Stripe) and shipping (ShipEngine) to work.
Also accessible on local network at http://192.168.1.50:3000

### Environment Variables
Create a `.env` file in the project root (use `.env.example` as template):
```
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
REACT_APP_API_URL=http://localhost:3001
SHIPENGINE_API_KEY=your_shipengine_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
CLOUDINARY_CLOUD_NAME=dd2zdrc2z
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here
```
- Firebase config is in `src/firebase.js` (API keys are public-safe for client apps)
- Stripe publishable key uses `REACT_APP_` prefix (bundled into frontend - this is safe)
- Stripe secret key does NOT use `REACT_APP_` prefix (server-side only via server.js)
- `REACT_APP_API_URL` points to the backend server (localhost for dev, production URL for live)

### Admin Access
1. Navigate to http://localhost:3000/signup to create admin account
2. Login at http://localhost:3000/login
3. Access admin dashboard at http://localhost:3000/admin

## Deployment

### Frontend (Firebase Hosting)
```bash
npm run build
firebase deploy --only hosting
```

### Backend (server.js)
The Express backend must be deployed separately. Options:

**Option 1: Railway (Recommended for simplicity)**
1. Push to GitHub
2. Connect Railway to your repo
3. Set environment variables in Railway dashboard
4. Railway auto-deploys on push

**Option 2: Vercel**
1. Create `vercel.json` with Node.js config
2. Deploy via Vercel CLI or GitHub integration

**Option 3: Google Cloud Run**
1. Create Dockerfile
2. Build and push container
3. Deploy to Cloud Run

After deploying backend:
1. Update `REACT_APP_API_URL` in `.env` to production URL
2. Rebuild and redeploy frontend

### Stripe Webhook Setup
1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://your-backend-url/webhook/stripe`
3. Select event: `checkout.session.completed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### Custom Domain
- Domain: therackhack.com (GoDaddy)
- Connect via Firebase Console > Hosting > Add custom domain

## Important Files

### Configuration
- `firebase.json` - Firebase hosting and Firestore config
- `firestore.rules` - Database security rules
- `package.json` - Dependencies and scripts
- `.env` - API keys (gitignored)
- `.env.example` - Template for environment variables
- `server.js` - Express backend for Stripe and ShipEngine API calls

### Key Components
- `ClothingStore.js` - Main component with shop, cart, and admin views
- `CompleteCheckout.js` - Multi-step checkout (contact, shipping, payment)
- `ProductEditor.js` - Product add/edit modal with image upload
- `AuthContext.js` - Firebase authentication state management
- `productService.js` - All Firestore CRUD operations (products, orders, about)
- `GlamourGenerator.js` - AI glamour photo generation modal (Gemini 3 Pro)

## Recent Updates
1. Added product description field (optional textarea in admin)
2. Changed image display from crop to contain (shows full images)
3. Made admin table mobile-responsive with text buttons
4. Added all favicon icons to index.html
5. Deployed Firestore security rules to prevent unauthorized access
6. UI/UX improvements based on design review:
   - Added Google Fonts (Rubik headings, Nunito Sans body)
   - Improved touch targets (min 44x44px) for mobile accessibility
   - Added skeleton loading states for better perceived performance
   - Added lazy loading for images
   - Added condition badges (emerald=New, amber=Pre-Owned)
   - Added image hover zoom effects
   - Added professional footer with quick links
   - Improved filter button transitions and flex-wrap
7. Moved Stripe keys to environment variables for security
8. Pushed code to GitHub repository
9. Stripe security hardening:
   - Deleted insecure StripeCheckout.js (was calling Stripe API directly from frontend)
   - Renamed `REACT_APP_STRIPE_SECRET_KEY` to `STRIPE_SECRET_KEY` (prevents secret key from being bundled into frontend JS)
   - All Stripe calls now route through server.js backend
   - Dynamic success/cancel URLs (no more hardcoded localhost)
10. Migrated orders from localStorage to Firestore (persists across devices, visible in admin)
11. Migrated About page from localStorage to Firestore
12. Removed dead localStorage backup for products
13. Added updateOrder function to productService.js
14. Added GlowButton component with gradient/glow effect for action buttons
15. Production readiness improvements:
    - Added Stripe webhook endpoint for payment verification
    - Created OrderSuccessPage for post-payment confirmation
    - Orders now created in Firestore after successful Stripe payment
    - Inventory automatically decremented after purchase
    - Added getProductById function to productService.js
    - Environment variables for API URL (no more hardcoded localhost)
    - CORS restricted to allowed domains
    - Full order metadata passed to Stripe for webhook processing

16. AI Glamour Photo Generation:
    - Integrated Google AI Studio app (Gemini 3 Pro) into admin ProductEditor
    - New `/api/generate-glamour` endpoint in server.js (Gemini API → Cloudinary upload)
    - GlamourGenerator.js component with mode, model type, lighting, and custom prompt controls
    - "AI Generate" button on each image slot in ProductEditor
    - Generated images auto-uploaded to Cloudinary and populated into product image fields
    - Source app exported from Google AI Studio in `glamour-app/` directory
17. Fullscreen image lightbox:
    - Click any image in ItemDetail (product page) to view fullscreen, click again to dismiss
    - Click image thumbnails in admin CloudinaryUpload to view fullscreen
    - Click source image or generated result in GlamourGenerator to view fullscreen
    - Uses fixed overlay with z-[100] (product/admin) or z-[200] (GlamourGenerator, above its modal)
18. Admin navbar now includes "Shop" link to navigate back to the storefront

## Known Issues / TODO
- Cart still uses localStorage (by design — per-browser, no auth required)
- Server.js needs to be deployed separately from Firebase Hosting (see Deployment section)

## Production Checklist
Before going live:
1. [ ] Switch Stripe keys from `pk_test_`/`sk_test_` to `pk_live_`/`sk_live_`
2. [ ] Deploy server.js to production (Railway, Vercel, or Cloud Run)
3. [ ] Update `REACT_APP_API_URL` to production backend URL
4. [ ] Set up Stripe webhook endpoint and configure `STRIPE_WEBHOOK_SECRET`
5. [ ] Test complete checkout flow end-to-end
6. [ ] Verify ShipEngine API key is set in production environment

## Authentication Users
- Admin email: cander19@yahoo.com
- Additional admins can sign up at `/signup`

## Design Notes
- Mobile-first responsive design
- Uses Tailwind CSS utility classes
- Gray background (bg-slate-100) for full product images
- Blue accent color (#2563eb) for buttons and links
- Products table scrolls horizontally on mobile
- Typography: Rubik (headings), Nunito Sans (body) via Google Fonts
- Minimum 44x44px touch targets for accessibility
- Skeleton loading cards during data fetch
- Lazy loading images with loading="lazy" attribute
- Condition badges: emerald for New, amber for Pre-Owned
- Image hover zoom effect (scale-105 on hover)
- Fullscreen image lightbox on click (product detail page, admin image uploads, AI generator)

## Git Repository
- **GitHub**: https://github.com/MotownC/TheRackHack
- **Branch**: master
- **Firebase project**: the-rack-hack

## Contact
Development server accessible on local network for collaborative editing

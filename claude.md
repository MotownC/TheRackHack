# The Rack Hack - E-commerce Clothing Store

## Project Overview
The Rack Hack is a React-based e-commerce website for selling pre-owned and new clothing. The site features a public-facing store and an admin dashboard for managing inventory.

## Tech Stack
- **Frontend**: React 19, React Router, Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication, Hosting)
- **Icons**: Lucide React
- **Image Upload**: Cloudinary
- **Payment**: Stripe integration (in progress)

## Project Structure
```
src/
├── components/           # Reusable UI components
│   ├── ProductEditor.js # Modal for adding/editing products
│   ├── CloudinaryUpload.js # Image upload component
│   ├── ContactModal.js  # Contact form modal
│   └── ProtectedRoute.js # Auth-protected routes
├── contexts/
│   └── AuthContext.js   # Firebase authentication context
├── pages/              # Page components
│   ├── AboutPage.js    # About page
│   ├── ItemDetail.js   # Individual product page
│   └── ShopPage.js     # Main shop listing
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
- Checkout process (Stripe integration in progress)

### Admin Features (Authentication Required)
- Login/Signup system using Firebase Authentication
- Add new products with:
  - Name, description, size, price, stock
  - Category (Tops, Bottoms, Dresses, Outerwear)
  - Gender (Men's, Women's, Kids)
  - Condition (New, Pre-Owned)
  - Up to 3 images (Cloudinary upload or URL)
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
   - Fields: customer (object), items, total, date, status
   - Access: Public create, authenticated read/update/delete

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
npm start
```
Runs on http://localhost:3000 or network IP (http://192.168.1.50:3000)

### Environment Variables
Firebase config is in `src/firebase.js` (API keys are public-safe for client apps)

### Admin Access
1. Navigate to http://localhost:3000/signup to create admin account
2. Login at http://localhost:3000/login
3. Access admin dashboard at http://localhost:3000/admin

## Deployment

### Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

### Custom Domain
- Domain: therackhack.com (GoDaddy)
- Connect via Firebase Console > Hosting > Add custom domain

## Important Files

### Configuration
- `firebase.json` - Firebase hosting and Firestore config
- `firestore.rules` - Database security rules
- `package.json` - Dependencies and scripts

### Key Components
- `ClothingStore.js` - Main component with shop, cart, and admin views
- `ProductEditor.js` - Product add/edit modal with image upload
- `AuthContext.js` - Firebase authentication state management
- `productService.js` - All Firestore CRUD operations

## Recent Updates
1. Added product description field (optional textarea in admin)
2. Changed image display from crop to contain (shows full images)
3. Made admin table mobile-responsive with text buttons
4. Added all favicon icons to index.html
5. Deployed Firestore security rules to prevent unauthorized access

## Known Issues / TODO
- Orders currently save to localStorage (could migrate to Firestore)
- Stripe checkout integration incomplete
- About page content also backed up to localStorage

## Authentication Users
- Admin email: cander19@yahoo.com
- Additional admins can sign up at `/signup`

## Design Notes
- Mobile-first responsive design
- Uses Tailwind CSS utility classes
- Gray background (bg-slate-100) for full product images
- Blue accent color (#2563eb) for buttons and links
- Products table scrolls horizontally on mobile

## Git Repository
Current branch: master
Firebase project: the-rack-hack

## Contact
Development server accessible on local network for collaborative editing

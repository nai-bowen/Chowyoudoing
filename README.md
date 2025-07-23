# Chow You Doing? – Restaurant Review Web App

A full-stack web application where patrons can review meals, upload images/videos, and get responses from restaurants. Built using the T3 Stack: **Next.js (App Router)**, **TypeScript**, **TailwindCSS**, **tRPC**, **Prisma**, and **PostgreSQL (via Neon)**.

---

## 🚀 Getting Started

### ✅ Prerequisites

Make sure you have the following installed:

- Node.js 
- npm
- Git

---

### 🧩 Clone the Repository

```bash
git clone https://campus.cs.le.ac.uk/gitlab/nib3/final-year-project.git
cd master (optional can run from main)
```

### 📦 Install Dependencies
``` bash
npm install 
```

⚠️ Important: The application will not run without these environment variables. Be sure to provide valid values.

## 🗄️ Database Setup (No Configuration Needed)

This project uses a **cloud-hosted PostgreSQL database via [Neon](https://neon.tech/)**.

You **do not need to set up your own database**.

A `.env` file containing a valid `DATABASE_URL` is provided. It points to a live Neon database that’s already configured with the correct schema.

As long as the `.env` file is present and the `DATABASE_URL` is unchanged, the app will connect automatically.

> ⚠️ **Do not run any Prisma migrations** unless instructed, as this may alter the shared database schema.

---

## 🧪 Run the App Locally
```
npm run dev
```
## 🌍 Try the App Live

The application works best in a deployed environment with full functionality enabled.

You can try it out directly at:

👉 **[chowyoudoing.co.uk](https://chowyoudoing.co.uk)**

No setup required — just visit the site and explore the features as a patron or restaurant.

## 🔒 Extra Details

- **Admin Pages**  
  Admin features can be accessed using the password found in your `.env` file under:

  ```env
  ADMIN_PASSWORD=your_admin_password_here
  ```
Paste this password when prompted on admin routes to gain access.

Scraper Tool
The Uber Eats scraper is designed to run only on localhost for security reasons.
To test or use the scraper, make sure the app is running locally on:
http://localhost:3000

## 🌲 Project Tree

```
fyp_cyd
├─ .eslintrc.cjs
├─ erd.html
├─ next.config.js
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ prettier.config.js
├─ prisma
│  └─ schema.prisma
├─ public
│  ├─ assets
│  │  ├─ &kith.jpg
│  │  ├─ background_3blur.png
│  │  ├─ background_cta.svg
│  │  ├─ background_ssr.svg
│  │  ├─ chickanos.jpg
│  │  ├─ cyd_emblem.png
│  │  ├─ cyd_fullLogo.png
│  │  ├─ default-profile.png
│  │  ├─ eat.png
│  │  ├─ fast-food.png
│  │  ├─ good-review.png
│  │  ├─ home_layer1.svg
│  │  ├─ home_layer2.svg
│  │  ├─ meal.png
│  │  ├─ popeyes.jpg
│  │  └─ rating.png
│  └─ favicon.ico
├─ README.md
├─ src
│  ├─ app
│  │  ├─ admin
│  │  │  ├─ advert-dashboard
│  │  │  │  └─ page.tsx
│  │  │  ├─ category-mapping
│  │  │  │  └─ page.tsx
│  │  │  ├─ certification-requests
│  │  │  │  └─ page.tsx
│  │  │  ├─ premium-restaurants
│  │  │  │  └─ page.tsx
│  │  │  ├─ restaurant-connection-requests
│  │  │  │  └─ page.tsx
│  │  │  ├─ restaurant-requests
│  │  │  │  └─ page.tsx
│  │  │  ├─ review-flags
│  │  │  │  └─ page.tsx
│  │  │  ├─ scraper-input
│  │  │  │  └─ page.tsx
│  │  │  └─ trending
│  │  │     └─ page.tsx
│  │  ├─ api
│  │  │  ├─ admin
│  │  │  │  ├─ category-mapping
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ category-test
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ certification-requests
│  │  │  │  │  ├─ route.ts
│  │  │  │  │  └─ [id]
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ premium-restaurants
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ restaurant-connection-requests
│  │  │  │  │  ├─ route.ts
│  │  │  │  │  └─ [id]
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ restaurant-requests
│  │  │  │  │  ├─ route.ts
│  │  │  │  │  └─ [id]
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ review-flags
│  │  │  │  │  ├─ route.ts
│  │  │  │  │  └─ [id]
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ test-mapping
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ update-trending
│  │  │  │     └─ route.ts
│  │  │  ├─ auth
│  │  │  │  ├─ login
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ register
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ restaurant-login
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ restaurant-register
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ [...nextauth]
│  │  │  │     └─ route.ts
│  │  │  ├─ certification-requests
│  │  │  │  └─ route.ts
│  │  │  ├─ cron
│  │  │  │  └─ update-trending
│  │  │  │     ├─ calculate.ts
│  │  │  │     └─ route.ts
│  │  │  ├─ patron
│  │  │  │  └─ receipt-verification
│  │  │  │     └─ route.ts
│  │  │  ├─ profile
│  │  │  │  ├─ certification
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ favourites
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ follow
│  │  │  │  │  ├─ check
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ following
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ patron
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ route.ts
│  │  │  │  ├─ search
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ update-interests
│  │  │  │     └─ route.ts
│  │  │  ├─ restaurants
│  │  │  │  ├─ discover
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ featured
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ [restaurantId]
│  │  │  │     ├─ edit
│  │  │  │     │  └─ route.ts
│  │  │  │     ├─ menu-items
│  │  │  │     │  └─ route.ts
│  │  │  │     ├─ receipt-verifications
│  │  │  │     │  ├─ route.ts
│  │  │  │     │  └─ stats
│  │  │  │     │     └─ route.ts
│  │  │  │     ├─ route.ts
│  │  │  │     └─ update
│  │  │  │        └─ route.ts
│  │  │  ├─ restaurateur
│  │  │  │  ├─ connection-requests
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ interests
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ menu-image-check
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ menu-items
│  │  │  │  │  ├─ route.ts
│  │  │  │  │  └─ [id]
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ menu-sections
│  │  │  │  │  ├─ route.ts
│  │  │  │  │  └─ [id]
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ premium
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ profile
│  │  │  │  │  ├─ route.ts
│  │  │  │  │  └─ update
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ receipt-verifications
│  │  │  │  │  ├─ route.ts
│  │  │  │  │  └─ [id]
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ redeem-premium
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ restaurants
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ reviews
│  │  │  │  │  ├─ respond
│  │  │  │  │  │  └─ route.ts
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ validate-referral
│  │  │  │     └─ route.ts
│  │  │  ├─ review
│  │  │  │  ├─ flag
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ route.ts
│  │  │  │  └─ [id]
│  │  │  │     ├─ edit
│  │  │  │     │  └─ route.ts
│  │  │  │     └─ route.ts
│  │  │  ├─ scraper
│  │  │  │  └─ route.ts
│  │  │  ├─ search
│  │  │  │  └─ route.ts
│  │  │  ├─ send-email
│  │  │  │  └─ route.ts
│  │  │  ├─ stripe
│  │  │  │  ├─ checkout
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ verify-session
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ webhook
│  │  │  │     └─ route.ts
│  │  │  ├─ trending
│  │  │  │  └─ route.ts
│  │  │  ├─ trpc
│  │  │  │  └─ [trpc]
│  │  │  │     └─ route.ts
│  │  │  └─ upload
│  │  │     └─ route.ts
│  │  ├─ discover
│  │  │  ├─ layout.tsx
│  │  │  └─ page.tsx
│  │  ├─ layout.tsx
│  │  ├─ login
│  │  │  ├─ page.tsx
│  │  │  └─ restaurateur
│  │  │     └─ page.tsx
│  │  ├─ not-found.tsx
│  │  ├─ page.tsx
│  │  ├─ patron-dashboard
│  │  │  ├─ layout.tsx
│  │  │  └─ page.tsx
│  │  ├─ patron-search
│  │  │  ├─ layout.tsx
│  │  │  └─ page.tsx
│  │  ├─ premium-cancel
│  │  │  └─ page.tsx
│  │  ├─ premium-success
│  │  │  └─ page.tsx
│  │  ├─ profile
│  │  │  ├─ layout.tsx
│  │  │  └─ page.tsx
│  │  ├─ register
│  │  │  ├─ page.tsx
│  │  │  └─ restaurateur
│  │  │     └─ page.tsx
│  │  ├─ restaurant-dashboard
│  │  │  ├─ analytics
│  │  │  │  └─ page.tsx
│  │  │  ├─ layout.tsx
│  │  │  ├─ menu
│  │  │  │  └─ page.tsx
│  │  │  ├─ page.tsx
│  │  │  ├─ profile
│  │  │  │  └─ page.tsx
│  │  │  ├─ receipt-verifications
│  │  │  │  └─ page.tsx
│  │  │  ├─ referrals
│  │  │  │  └─ page.tsx
│  │  │  ├─ reviews
│  │  │  │  └─ page.tsx
│  │  │  └─ [restaurantId]
│  │  │     ├─ edit
│  │  │     │  └─ page.tsx
│  │  │     ├─ menu
│  │  │     │  └─ page.tsx
│  │  │     └─ receipt-verifications
│  │  │        └─ page.tsx
│  │  ├─ restaurants
│  │  │  └─ [restaurantId]
│  │  │     └─ page.tsx
│  │  ├─ review
│  │  │  └─ edit
│  │  │     └─ [id]
│  │  │        └─ page.tsx
│  │  └─ _components
│  │     ├─ AddEditMenuItemModal.tsx
│  │     ├─ AddEditMenuSectionModal.tsx
│  │     ├─ AnalyticsLoader.tsx
│  │     ├─ AnimatedBackground.tsx
│  │     ├─ CeritficationRequestForm.tsx
│  │     ├─ CertificationButton.tsx
│  │     ├─ CertificationModal.tsx
│  │     ├─ CertifiedFoodieBadge.tsx
│  │     ├─ EditReviewModal.tsx
│  │     ├─ FeaturedRestaurants.tsx
│  │     ├─ FlagReviewModal.tsx
│  │     ├─ FloatingFoodEmojis.tsx
│  │     ├─ FollowButton.tsx
│  │     ├─ FollowingList.tsx
│  │     ├─ Footer.tsx
│  │     ├─ Hero.tsx
│  │     ├─ Home-Navbar.tsx
│  │     ├─ Homepage.tsx
│  │     ├─ MenuManagement.tsx
│  │     ├─ Patron-Navbar.tsx
│  │     ├─ PatronProfileModal.tsx
│  │     ├─ post.tsx
│  │     ├─ PremiumButton.tsx
│  │     ├─ PremiumSubscriptionModal.tsx
│  │     ├─ ProfileImage.tsx
│  │     ├─ ReceiptVerificationManagement.tsx
│  │     ├─ ReceiptVerificationModal.tsx
│  │     ├─ RedeemPremiumButton.tsx
│  │     ├─ ReferralCodeInput.tsx
│  │     ├─ ReferralDashboard.tsx
│  │     ├─ RequestMenuModal.tsx
│  │     ├─ RestaurantAnalytics.tsx
│  │     ├─ RestaurantCard.tsx
│  │     ├─ RestaurantConnectionModal.tsx
│  │     ├─ RestaurantProfile.tsx
│  │     ├─ RestaurateurNav.tsx
│  │     ├─ ReviewCard.tsx
│  │     ├─ ReviewManagement.tsx
│  │     ├─ ReviewModal.tsx
│  │     ├─ ReviewResponseModal.tsx
│  │     ├─ ReviewSection.tsx
│  │     ├─ SearchResults.tsx
│  │     ├─ SessionProvider.tsx
│  │     ├─ SortDropdown.tsx
│  │     ├─ StatCard.tsx
│  │     ├─ SubmitReceiptModal.tsx
│  │     ├─ TrendingCategories.tsx
│  │     ├─ ui
│  │     │  ├─ button.tsx
│  │     │  └─ input.tsx
│  │     ├─ VerificationBadge.tsx
│  │     ├─ withPremiumCheck.tsx
│  │     └─ WriteReviewModal.tsx
│  ├─ env.js
│  ├─ lib
│  │  ├─ auth.ts
│  │  ├─ hooks
│  │  │  └─ usePremiumStatus.ts
│  │  ├─ jwt.ts
│  │  ├─ locationService.ts
│  │  ├─ referral.ts
│  │  ├─ useSortHook.ts
│  │  └─ utils.ts
│  ├─ server
│  │  ├─ api
│  │  │  ├─ menu
│  │  │  │  └─ top.ts
│  │  │  ├─ restaurants
│  │  │  │  └─ location.ts
│  │  │  ├─ reviews
│  │  │  │  └─ route.ts
│  │  │  ├─ root.ts
│  │  │  ├─ routers
│  │  │  │  └─ post.ts
│  │  │  └─ trpc.ts
│  │  ├─ auth
│  │  │  ├─ config.ts
│  │  │  ├─ custom-prisma-adapter.ts
│  │  │  └─ index.ts
│  │  ├─ db.ts
│  │  └─ services
│  │     ├─ scraper
│  │     │  ├─ menuScraper.ts
│  │     │  ├─ restaurantScraper.ts
│  │     │  └─ uberEatsScraper.ts
│  │     └─ scraperService.ts
│  ├─ styles
│  │  ├─ dashboard.css
│  │  ├─ globals.css
│  │  ├─ index.css
│  │  ├─ location.css
│  │  ├─ navbar.css
│  │  └─ tailwind.css
│  ├─ trpc
│  │  ├─ query-client.ts
│  │  ├─ react.tsx
│  │  └─ server.ts
│  ├─ types
│  │  └─ next-auth.d.ts
│  ├─ utils
│  │  ├─ categoryMappingService.client.ts
│  │  ├─ categoryMappingService.ts
│  │  ├─ embeddingUtils.client.ts
│  │  └─ embeddingUtils.ts
│  └─ __tests__
│     ├─ api
│     │  ├─ restaurant.test.ts
│     │  └─ review.test.ts
│     ├─ components
│     │  ├─ Navbar.test.tsx
│     │  ├─ RequestMenuModal.test.tsx
│     │  ├─ RestaurantCard.test.tsx
│     │  ├─ ReviewManagement.test.tsx
│     │  ├─ ReviewModal.test.tsx
│     │  └─ TrendingCategories.test.tsx
│     └─ pages
│        ├─ LoginPage.test.tsx
│        └─ RegisterPage.test.tsx
├─ start-database.sh
├─ tailwind.config.ts
├─ tsconfig.json
├─ vercel.json
├─ vitest.config.ts
└─ vitest.setup.ts

```

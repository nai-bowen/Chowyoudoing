# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [Next.js](https://nextjs.org)
- [NextAuth.js](https://next-auth.js.org)
- [Prisma](https://prisma.io)
- [Drizzle](https://orm.drizzle.team)
- [Tailwind CSS](https://tailwindcss.com)
- [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.

```
```
```
fyp_cyd
├─ .eslintrc.cjs
├─ next.config.js
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ prettier.config.js
├─ prisma
│  ├─ migrations
│  │  ├─ 20250116211614_rename_user_to_patron
│  │  │  └─ migration.sql
│  │  ├─ 20250203180657_add_restaurant_menu_models
│  │  │  └─ migration.sql
│  │  ├─ 20250205201227_add_interests_array
│  │  │  └─ migration.sql
│  │  ├─ 20250207124526_add_interest_to_menu
│  │  │  └─ migration.sql
│  │  ├─ 20250207125429_add_url_to_restaurant
│  │  │  └─ migration.sql
│  │  ├─ 20250207131132_add_reviews_and_upvotes
│  │  │  └─ migration.sql
│  │  ├─ 20250225175045_add_category_to_restaurant
│  │  │  └─ migration.sql
│  │  ├─ 20250225182424_update_restaurant_categories
│  │  │  └─ migration.sql
│  │  ├─ 20250226134538_add_review_fields
│  │  │  └─ migration.sql
│  │  ├─ 20250227161946_add_menu_item_id
│  │  │  └─ migration.sql
│  │  ├─ 20250303131850_add_longlat_formaps
│  │  │  └─ migration.sql
│  │  ├─ 20250303163442_add_votes
│  │  │  └─ migration.sql
│  │  ├─ 20250316151937_add_profile_features
│  │  │  └─ migration.sql
│  │  ├─ 20250319200314_add_certified_foodie
│  │  │  └─ migration.sql
│  │  ├─ 20250321145333_add_restaurateur_model
│  │  │  └─ migration.sql
│  │  ├─ 20250327172936_add_restaurateur_model
│  │  │  └─ migration.sql
│  │  ├─ 20250329181926_add_restaurant_interests
│  │  │  └─ migration.sql
│  │  └─ migration_lock.toml
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
│  │  │  ├─ category-mapping
│  │  │  │  └─ page.tsx
│  │  │  ├─ category-test
│  │  │  │  └─ page.tsx
│  │  │  └─ certification-requests
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
│  │  │  │  └─ test-mapping
│  │  │  │     └─ route.ts
│  │  │  ├─ auth
│  │  │  │  ├─ login
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ register
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ restaurant-register
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ [...nextauth]
│  │  │  │     └─ route.ts
│  │  │  ├─ certification-requests
│  │  │  │  └─ route.ts
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
│  │  │  │  └─ route.ts
│  │  │  ├─ restaurants
│  │  │  │  ├─ discover
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ [restaurantId]
│  │  │  │     ├─ menu-items
│  │  │  │     │  └─ route.ts
│  │  │  │     └─ route.ts
│  │  │  ├─ review
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
│  │  │  └─ page.tsx
│  │  ├─ page.tsx
│  │  ├─ patron-dashboard
│  │  │  ├─ layout.tsx
│  │  │  └─ page.tsx
│  │  ├─ patron-search
│  │  │  ├─ layout.tsx
│  │  │  └─ page.tsx
│  │  ├─ profile
│  │  │  ├─ layout.tsx
│  │  │  └─ page.tsx
│  │  ├─ register
│  │  │  ├─ page.tsx
│  │  │  └─ restaurateur
│  │  │     └─ page.tsx
│  │  ├─ restaurants
│  │  │  └─ [restaurantId]
│  │  │     └─ page.tsx
│  │  ├─ review
│  │  │  └─ edit
│  │  │     └─ [id]
│  │  │        └─ page.tsx
│  │  ├─ scraper-input
│  │  │  └─ page.tsx
│  │  └─ _components
│  │     ├─ AnimatedBackground.tsx
│  │     ├─ CeritficationRequestForm.tsx
│  │     ├─ CertificationButton.tsx
│  │     ├─ CertificationModal.tsx
│  │     ├─ CertifiedFoodieBadge.tsx
│  │     ├─ EditReviewModal.tsx
│  │     ├─ FloatingFoodEmojis.tsx
│  │     ├─ FollowButton.tsx
│  │     ├─ FollowingList.tsx
│  │     ├─ Footer.tsx
│  │     ├─ Hero.tsx
│  │     ├─ Home-Navbar.tsx
│  │     ├─ Homepage.tsx
│  │     ├─ Patron-Navbar.tsx
│  │     ├─ PatronProfileModal.tsx
│  │     ├─ post.tsx
│  │     ├─ RequestMenuModal.tsx
│  │     ├─ RestaurantCard.tsx
│  │     ├─ ReviewCard.tsx
│  │     ├─ ReviewModal.tsx
│  │     ├─ ReviewSection.tsx
│  │     ├─ SearchResults.tsx
│  │     ├─ SessionProvider.tsx
│  │     ├─ SortDropdown.tsx
│  │     ├─ ui
│  │     │  ├─ button.tsx
│  │     │  └─ input.tsx
│  │     └─ WriteReviewModal.tsx
│  ├─ env.js
│  ├─ lib
│  │  ├─ auth.ts
│  │  ├─ jwt.ts
│  │  ├─ locationService.ts
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
│  └─ utils
│     ├─ categoryMappingService.client.ts
│     ├─ categoryMappingService.ts
│     ├─ embeddingUtils.client.ts
│     └─ embeddingUtils.ts
├─ start-database.sh
├─ tailwind.config.ts
└─ tsconfig.json

```
```
fyp_cyd
├─ .eslintrc.cjs
├─ next.config.js
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ prettier.config.js
├─ prisma
│  ├─ migrations
│  │  ├─ 20250116211614_rename_user_to_patron
│  │  │  └─ migration.sql
│  │  ├─ 20250203180657_add_restaurant_menu_models
│  │  │  └─ migration.sql
│  │  ├─ 20250205201227_add_interests_array
│  │  │  └─ migration.sql
│  │  ├─ 20250207124526_add_interest_to_menu
│  │  │  └─ migration.sql
│  │  ├─ 20250207125429_add_url_to_restaurant
│  │  │  └─ migration.sql
│  │  ├─ 20250207131132_add_reviews_and_upvotes
│  │  │  └─ migration.sql
│  │  ├─ 20250225175045_add_category_to_restaurant
│  │  │  └─ migration.sql
│  │  ├─ 20250225182424_update_restaurant_categories
│  │  │  └─ migration.sql
│  │  ├─ 20250226134538_add_review_fields
│  │  │  └─ migration.sql
│  │  ├─ 20250227161946_add_menu_item_id
│  │  │  └─ migration.sql
│  │  ├─ 20250303131850_add_longlat_formaps
│  │  │  └─ migration.sql
│  │  ├─ 20250303163442_add_votes
│  │  │  └─ migration.sql
│  │  ├─ 20250316151937_add_profile_features
│  │  │  └─ migration.sql
│  │  ├─ 20250319200314_add_certified_foodie
│  │  │  └─ migration.sql
│  │  ├─ 20250321145333_add_restaurateur_model
│  │  │  └─ migration.sql
│  │  ├─ 20250327172936_add_restaurateur_model
│  │  │  └─ migration.sql
│  │  ├─ 20250329181926_add_restaurant_interests
│  │  │  └─ migration.sql
│  │  ├─ 20250404102839_add_anonymous_reviews
│  │  │  └─ migration.sql
│  │  ├─ 20250406181721_add_trending_categories
│  │  │  └─ migration.sql
│  │  ├─ 20250408213006_add_wider_areas_to_restaurants
│  │  │  └─ migration.sql
│  │  ├─ 20250408232051_add_restaurant_connections
│  │  │  └─ migration.sql
│  │  └─ migration_lock.toml
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
│  │  │  ├─ category-mapping
│  │  │  │  └─ page.tsx
│  │  │  ├─ category-test
│  │  │  │  └─ page.tsx
│  │  │  ├─ certification-requests
│  │  │  │  └─ page.tsx
│  │  │  ├─ restaurant-connection-requests
│  │  │  │  └─ page.tsx
│  │  │  ├─ restaurant-requests
│  │  │  │  └─ page.tsx
│  │  │  └─ scraper-input
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
│  │  │  │  ├─ restaurant-connection-requests
│  │  │  │  │  ├─ route.ts
│  │  │  │  │  └─ [id]
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ restaurant-requests
│  │  │  │  │  ├─ route.ts
│  │  │  │  │  └─ [id]
│  │  │  │  │     └─ route.ts
│  │  │  │  └─ test-mapping
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
│  │  │  │  └─ search
│  │  │  │     └─ route.ts
│  │  │  ├─ restaurants
│  │  │  │  ├─ discover
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ [restaurantId]
│  │  │  │     ├─ menu-items
│  │  │  │     │  └─ route.ts
│  │  │  │     └─ route.ts
│  │  │  ├─ restaurateur
│  │  │  │  ├─ connection-requests
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ profile
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ restaurants
│  │  │  │     └─ route.ts
│  │  │  ├─ review
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
│  │  ├─ page.tsx
│  │  ├─ patron-dashboard
│  │  │  ├─ layout.tsx
│  │  │  └─ page.tsx
│  │  ├─ patron-search
│  │  │  ├─ layout.tsx
│  │  │  └─ page.tsx
│  │  ├─ profile
│  │  │  ├─ layout.tsx
│  │  │  └─ page.tsx
│  │  ├─ register
│  │  │  ├─ page.tsx
│  │  │  └─ restaurateur
│  │  │     └─ page.tsx
│  │  ├─ restaurant-dashboard
│  │  │  └─ page.tsx
│  │  ├─ restaurants
│  │  │  └─ [restaurantId]
│  │  │     └─ page.tsx
│  │  ├─ review
│  │  │  └─ edit
│  │  │     └─ [id]
│  │  │        └─ page.tsx
│  │  └─ _components
│  │     ├─ AnimatedBackground.tsx
│  │     ├─ CeritficationRequestForm.tsx
│  │     ├─ CertificationButton.tsx
│  │     ├─ CertificationModal.tsx
│  │     ├─ CertifiedFoodieBadge.tsx
│  │     ├─ EditReviewModal.tsx
│  │     ├─ FloatingFoodEmojis.tsx
│  │     ├─ FollowButton.tsx
│  │     ├─ FollowingList.tsx
│  │     ├─ Footer.tsx
│  │     ├─ Hero.tsx
│  │     ├─ Home-Navbar.tsx
│  │     ├─ Homepage.tsx
│  │     ├─ Patron-Navbar.tsx
│  │     ├─ PatronProfileModal.tsx
│  │     ├─ post.tsx
│  │     ├─ ProfileImage.tsx
│  │     ├─ RequestMenuModal.tsx
│  │     ├─ RestaurantCard.tsx
│  │     ├─ RestaurantConnectionModal.tsx
│  │     ├─ ReviewCard.tsx
│  │     ├─ ReviewModal.tsx
│  │     ├─ ReviewSection.tsx
│  │     ├─ SearchResults.tsx
│  │     ├─ SessionProvider.tsx
│  │     ├─ SortDropdown.tsx
│  │     ├─ StatCard.tsx
│  │     ├─ TrendingCategories.tsx
│  │     ├─ ui
│  │     │  ├─ button.tsx
│  │     │  └─ input.tsx
│  │     └─ WriteReviewModal.tsx
│  ├─ env.js
│  ├─ lib
│  │  ├─ auth.ts
│  │  ├─ jwt.ts
│  │  ├─ locationService.ts
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
│  └─ utils
│     ├─ categoryMappingService.client.ts
│     ├─ categoryMappingService.ts
│     ├─ embeddingUtils.client.ts
│     └─ embeddingUtils.ts
├─ start-database.sh
├─ tailwind.config.ts
├─ tsconfig.json
└─ vercel.json

```
```
fyp_cyd
├─ .eslintrc.cjs
├─ next.config.js
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ prettier.config.js
├─ prisma
│  ├─ migrations
│  │  ├─ 20250116211614_rename_user_to_patron
│  │  │  └─ migration.sql
│  │  ├─ 20250203180657_add_restaurant_menu_models
│  │  │  └─ migration.sql
│  │  ├─ 20250205201227_add_interests_array
│  │  │  └─ migration.sql
│  │  ├─ 20250207124526_add_interest_to_menu
│  │  │  └─ migration.sql
│  │  ├─ 20250207125429_add_url_to_restaurant
│  │  │  └─ migration.sql
│  │  ├─ 20250207131132_add_reviews_and_upvotes
│  │  │  └─ migration.sql
│  │  ├─ 20250225175045_add_category_to_restaurant
│  │  │  └─ migration.sql
│  │  ├─ 20250225182424_update_restaurant_categories
│  │  │  └─ migration.sql
│  │  ├─ 20250226134538_add_review_fields
│  │  │  └─ migration.sql
│  │  ├─ 20250227161946_add_menu_item_id
│  │  │  └─ migration.sql
│  │  ├─ 20250303131850_add_longlat_formaps
│  │  │  └─ migration.sql
│  │  ├─ 20250303163442_add_votes
│  │  │  └─ migration.sql
│  │  ├─ 20250316151937_add_profile_features
│  │  │  └─ migration.sql
│  │  ├─ 20250319200314_add_certified_foodie
│  │  │  └─ migration.sql
│  │  ├─ 20250321145333_add_restaurateur_model
│  │  │  └─ migration.sql
│  │  ├─ 20250327172936_add_restaurateur_model
│  │  │  └─ migration.sql
│  │  ├─ 20250329181926_add_restaurant_interests
│  │  │  └─ migration.sql
│  │  ├─ 20250404102839_add_anonymous_reviews
│  │  │  └─ migration.sql
│  │  ├─ 20250406181721_add_trending_categories
│  │  │  └─ migration.sql
│  │  ├─ 20250408213006_add_wider_areas_to_restaurants
│  │  │  └─ migration.sql
│  │  ├─ 20250408232051_add_restaurant_connections
│  │  │  └─ migration.sql
│  │  └─ migration_lock.toml
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
│  │  │  ├─ category-mapping
│  │  │  │  └─ page.tsx
│  │  │  ├─ certification-requests
│  │  │  │  └─ page.tsx
│  │  │  ├─ restaurant-connection-requests
│  │  │  │  └─ page.tsx
│  │  │  ├─ restaurant-requests
│  │  │  │  └─ page.tsx
│  │  │  ├─ review-flags
│  │  │  │  └─ page.tsx
│  │  │  └─ scraper-input
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
│  │  │  │  └─ test-mapping
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
│  │  │  │  └─ search
│  │  │  │     └─ route.ts
│  │  │  ├─ restaurants
│  │  │  │  ├─ discover
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
│  │  │  │  ├─ menu-items
│  │  │  │  │  ├─ route.ts
│  │  │  │  │  └─ [id]
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ menu-sections
│  │  │  │  │  ├─ route.ts
│  │  │  │  │  └─ [id]
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ profile
│  │  │  │  │  ├─ route.ts
│  │  │  │  │  └─ update
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ receipt-verifications
│  │  │  │  │  ├─ route.ts
│  │  │  │  │  └─ [id]
│  │  │  │  │     └─ route.ts
│  │  │  │  ├─ restaurants
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ reviews
│  │  │  │     ├─ respond
│  │  │  │     │  └─ route.ts
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
│  │  ├─ page.tsx
│  │  ├─ patron-dashboard
│  │  │  ├─ layout.tsx
│  │  │  └─ page.tsx
│  │  ├─ patron-search
│  │  │  ├─ layout.tsx
│  │  │  └─ page.tsx
│  │  ├─ profile
│  │  │  ├─ layout.tsx
│  │  │  ├─ page.tsx
│  │  │  └─ restaurateur
│  │  │     └─ page.tsx
│  │  ├─ register
│  │  │  ├─ page.tsx
│  │  │  └─ restaurateur
│  │  │     └─ page.tsx
│  │  ├─ restaurant-dashboard
│  │  │  ├─ page.tsx
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
│  │     ├─ AnimatedBackground.tsx
│  │     ├─ CeritficationRequestForm.tsx
│  │     ├─ CertificationButton.tsx
│  │     ├─ CertificationModal.tsx
│  │     ├─ CertifiedFoodieBadge.tsx
│  │     ├─ EditReviewModal.tsx
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
│  │     ├─ ProfileImage.tsx
│  │     ├─ ReceiptVerificationManagement.tsx
│  │     ├─ ReceiptVerificationModal.tsx
│  │     ├─ RequestMenuModal.tsx
│  │     ├─ RestaurantCard.tsx
│  │     ├─ RestaurantConnectionModal.tsx
│  │     ├─ RestaurantProfile.tsx
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
│  │     └─ WriteReviewModal.tsx
│  ├─ env.js
│  ├─ lib
│  │  ├─ auth.ts
│  │  ├─ jwt.ts
│  │  ├─ locationService.ts
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
│  └─ utils
│     ├─ categoryMappingService.client.ts
│     ├─ categoryMappingService.ts
│     ├─ embeddingUtils.client.ts
│     └─ embeddingUtils.ts
├─ start-database.sh
├─ tailwind.config.ts
├─ tsconfig.json
└─ vercel.json

```
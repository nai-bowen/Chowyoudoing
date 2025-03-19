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
│  │  └─ migration_lock.toml
│  └─ schema.prisma
├─ public
│  ├─ assets
│  │  ├─ background_3blur.png
│  │  ├─ cyd_emblem.png
│  │  ├─ cyd_fullLogo.png
│  │  ├─ eat.png
│  │  ├─ home_layer1.svg
│  │  └─ home_layer2.svg
│  └─ favicon.ico
├─ README.md
├─ src
│  ├─ app
│  │  ├─ api
│  │  │  ├─ auth
│  │  │  │  ├─ login
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ register
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ [...nextauth]
│  │  │  │     └─ route.ts
│  │  │  ├─ restaurants
│  │  │  │  └─ [restaurantId]
│  │  │  │     ├─ menu-items
│  │  │  │     │  └─ route.ts
│  │  │  │     └─ route.ts
│  │  │  ├─ review
│  │  │  │  └─ route.ts
│  │  │  ├─ scraper
│  │  │  │  └─ route.ts
│  │  │  ├─ search
│  │  │  │  └─ route.ts
│  │  │  ├─ trpc
│  │  │  │  └─ [trpc]
│  │  │  │     └─ route.ts
│  │  │  └─ upload
│  │  │     └─ route.ts
│  │  ├─ layout.tsx
│  │  ├─ login
│  │  │  └─ page.tsx
│  │  ├─ page.tsx
│  │  ├─ patron-dashboard
│  │  │  └─ page.tsx
│  │  ├─ register
│  │  │  └─ page.tsx
│  │  ├─ restaurants
│  │  │  └─ [restaurantId]
│  │  │     └─ page.tsx
│  │  ├─ review
│  │  │  └─ page.tsx
│  │  ├─ scraper-input
│  │  │  └─ page.tsx
│  │  └─ _components
│  │     ├─ navbar.sass
│  │     ├─ navbar.tsx
│  │     ├─ post.tsx
│  │     └─ SessionProvider.tsx
│  ├─ env.js
│  ├─ lib
│  │  ├─ auth.ts
│  │  └─ jwt.ts
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
│  │  └─ navbar.css
│  ├─ trpc
│  │  ├─ query-client.ts
│  │  ├─ react.tsx
│  │  └─ server.ts
│  └─ types
│     └─ next-auth.d.ts
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
│  │  └─ migration_lock.toml
│  └─ schema.prisma
├─ public
│  ├─ assets
│  │  ├─ background_3blur.png
│  │  ├─ cyd_emblem.png
│  │  ├─ cyd_fullLogo.png
│  │  ├─ eat.png
│  │  ├─ home_layer1.svg
│  │  └─ home_layer2.svg
│  └─ favicon.ico
├─ README.md
├─ src
│  ├─ app
│  │  ├─ api
│  │  │  ├─ auth
│  │  │  │  ├─ login
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ register
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ [...nextauth]
│  │  │  │     └─ route.ts
│  │  │  ├─ restaurants
│  │  │  │  └─ [restaurantId]
│  │  │  │     ├─ menu-items
│  │  │  │     │  └─ route.ts
│  │  │  │     └─ route.ts
│  │  │  ├─ review
│  │  │  │  └─ route.ts
│  │  │  ├─ scraper
│  │  │  │  └─ route.ts
│  │  │  ├─ search
│  │  │  │  └─ route.ts
│  │  │  ├─ trpc
│  │  │  │  └─ [trpc]
│  │  │  │     └─ route.ts
│  │  │  └─ upload
│  │  │     └─ route.ts
│  │  ├─ layout.tsx
│  │  ├─ login
│  │  │  └─ page.tsx
│  │  ├─ page.tsx
│  │  ├─ patron-dashboard
│  │  │  └─ page.tsx
│  │  ├─ patron-search
│  │  │  └─ page.tsx
│  │  ├─ register
│  │  │  └─ page.tsx
│  │  ├─ restaurants
│  │  │  └─ [restaurantId]
│  │  │     └─ page.tsx
│  │  ├─ review
│  │  │  └─ page.tsx
│  │  ├─ scraper-input
│  │  │  └─ page.tsx
│  │  └─ _components
│  │     ├─ navbar.sass
│  │     ├─ navbar.tsx
│  │     ├─ post.tsx
│  │     ├─ ReviewModal.tsx
│  │     └─ SessionProvider.tsx
│  ├─ env.js
│  ├─ lib
│  │  ├─ auth.ts
│  │  └─ jwt.ts
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
│  │  └─ navbar.css
│  ├─ trpc
│  │  ├─ query-client.ts
│  │  ├─ react.tsx
│  │  └─ server.ts
│  └─ types
│     └─ next-auth.d.ts
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
│  │  └─ migration_lock.toml
│  └─ schema.prisma
├─ public
│  ├─ assets
│  │  ├─ background_3blur.png
│  │  ├─ cyd_emblem.png
│  │  ├─ cyd_fullLogo.png
│  │  ├─ eat.png
│  │  ├─ home_layer1.svg
│  │  └─ home_layer2.svg
│  └─ favicon.ico
├─ README.md
├─ src
│  ├─ app
│  │  ├─ api
│  │  │  ├─ auth
│  │  │  │  ├─ login
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ register
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ [...nextauth]
│  │  │  │     └─ route.ts
│  │  │  ├─ restaurants
│  │  │  │  └─ [restaurantId]
│  │  │  │     ├─ menu-items
│  │  │  │     │  └─ route.ts
│  │  │  │     └─ route.ts
│  │  │  ├─ review
│  │  │  │  └─ route.ts
│  │  │  ├─ scraper
│  │  │  │  └─ route.ts
│  │  │  ├─ search
│  │  │  │  └─ route.ts
│  │  │  ├─ trpc
│  │  │  │  └─ [trpc]
│  │  │  │     └─ route.ts
│  │  │  └─ upload
│  │  │     └─ route.ts
│  │  ├─ layout.tsx
│  │  ├─ login
│  │  │  └─ page.tsx
│  │  ├─ page.tsx
│  │  ├─ patron-dashboard
│  │  │  └─ page.tsx
│  │  ├─ patron-search
│  │  │  └─ page.tsx
│  │  ├─ register
│  │  │  └─ page.tsx
│  │  ├─ restaurants
│  │  │  └─ [restaurantId]
│  │  │     └─ page.tsx
│  │  ├─ review
│  │  │  └─ page.tsx
│  │  ├─ scraper-input
│  │  │  └─ page.tsx
│  │  └─ _components
│  │     ├─ GoogleMap.tsx
│  │     ├─ navbar.sass
│  │     ├─ navbar.tsx
│  │     ├─ post.tsx
│  │     ├─ ReviewModal.tsx
│  │     └─ SessionProvider.tsx
│  ├─ env.js
│  ├─ lib
│  │  ├─ auth.ts
│  │  ├─ googleMapsLoader.tsx
│  │  ├─ jwt.ts
│  │  └─ locationService.ts
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
│  │  ├─ location.css
│  │  └─ navbar.css
│  ├─ trpc
│  │  ├─ query-client.ts
│  │  ├─ react.tsx
│  │  └─ server.ts
│  └─ types
│     └─ next-auth.d.ts
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
│  │  ├─ api
│  │  │  ├─ auth
│  │  │  │  ├─ login
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ register
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ [...nextauth]
│  │  │  │     └─ route.ts
│  │  │  ├─ restaurants
│  │  │  │  └─ [restaurantId]
│  │  │  │     ├─ menu-items
│  │  │  │     │  └─ route.ts
│  │  │  │     └─ route.ts
│  │  │  ├─ review
│  │  │  │  └─ route.ts
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
│  │  ├─ layout.tsx
│  │  ├─ login
│  │  │  └─ page.tsx
│  │  ├─ page.tsx
│  │  ├─ patron-dashboard
│  │  │  └─ page.tsx
│  │  ├─ patron-search
│  │  │  └─ page.tsx
│  │  ├─ register
│  │  │  └─ page.tsx
│  │  ├─ restaurants
│  │  │  └─ [restaurantId]
│  │  │     └─ page.tsx
│  │  ├─ review
│  │  │  └─ page.tsx
│  │  ├─ scraper-input
│  │  │  └─ page.tsx
│  │  └─ _components
│  │     ├─ GoogleMap.tsx
│  │     ├─ navbar.sass
│  │     ├─ navbar.tsx
│  │     ├─ post.tsx
│  │     ├─ RequestMenuModal.tsx
│  │     ├─ ResponsiveNavbar.tsx
│  │     ├─ ReviewModal.tsx
│  │     └─ SessionProvider.tsx
│  ├─ env.js
│  ├─ lib
│  │  ├─ auth.ts
│  │  ├─ googleMapsLoader.tsx
│  │  ├─ jwt.ts
│  │  └─ locationService.ts
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
│  │  ├─ location.css
│  │  └─ navbar.css
│  ├─ trpc
│  │  ├─ query-client.ts
│  │  ├─ react.tsx
│  │  └─ server.ts
│  └─ types
│     └─ next-auth.d.ts
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
│  │  ├─ api
│  │  │  ├─ auth
│  │  │  │  ├─ login
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ register
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ [...nextauth]
│  │  │  │     └─ route.ts
│  │  │  ├─ profile
│  │  │  │  ├─ favourites
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ follow
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ patron
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  ├─ restaurants
│  │  │  │  └─ [restaurantId]
│  │  │  │     ├─ menu-items
│  │  │  │     │  └─ route.ts
│  │  │  │     └─ route.ts
│  │  │  ├─ review
│  │  │  │  ├─ edit
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ route.ts
│  │  │  │  └─ [id]
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
│  │  ├─ layout.tsx
│  │  ├─ login
│  │  │  └─ page.tsx
│  │  ├─ page.tsx
│  │  ├─ patron-dashboard
│  │  │  └─ page.tsx
│  │  ├─ patron-search
│  │  │  └─ page.tsx
│  │  ├─ profile
│  │  │  ├─ edit
│  │  │  │  └─ page.tsx
│  │  │  ├─ follow
│  │  │  ├─ page.tsx
│  │  │  └─ [username]
│  │  │     └─ page.tsx
│  │  ├─ register
│  │  │  └─ page.tsx
│  │  ├─ restaurants
│  │  │  └─ [restaurantId]
│  │  │     └─ page.tsx
│  │  ├─ review
│  │  │  ├─ edit
│  │  │  │  └─ [id]
│  │  │  │     └─ page.tsx
│  │  │  └─ page.tsx
│  │  ├─ scraper-input
│  │  │  └─ page.tsx
│  │  └─ _components
│  │     ├─ FavouritesList.tsx
│  │     ├─ FollowButton.tsx
│  │     ├─ GoogleMap.tsx
│  │     ├─ navbar.sass
│  │     ├─ navbar.tsx
│  │     ├─ post.tsx
│  │     ├─ ProfileEditForm.tsx
│  │     ├─ ProfileHeader.tsx
│  │     ├─ RequestMenuModal.tsx
│  │     ├─ ResponsiveNavbar.tsx
│  │     ├─ ReviewModal.tsx
│  │     ├─ SessionProvider.tsx
│  │     └─ SortDropdown.tsx
│  ├─ env.js
│  ├─ lib
│  │  ├─ auth.ts
│  │  ├─ googleMapsLoader.tsx
│  │  ├─ jwt.ts
│  │  ├─ locationService.ts
│  │  └─ useSortHook.ts
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
│  │  ├─ location.css
│  │  └─ navbar.css
│  ├─ trpc
│  │  ├─ query-client.ts
│  │  ├─ react.tsx
│  │  └─ server.ts
│  └─ types
│     └─ next-auth.d.ts
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
│  │  ├─ api
│  │  │  ├─ auth
│  │  │  │  ├─ login
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ register
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ [...nextauth]
│  │  │  │     └─ route.ts
│  │  │  ├─ profile
│  │  │  │  ├─ favourites
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ follow
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ patron
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  ├─ restaurants
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
│  │  ├─ layout.tsx
│  │  ├─ login
│  │  │  └─ page.tsx
│  │  ├─ page.tsx
│  │  ├─ patron-dashboard
│  │  │  └─ page.tsx
│  │  ├─ patron-search
│  │  │  └─ page.tsx
│  │  ├─ profile
│  │  │  ├─ edit
│  │  │  │  └─ page.tsx
│  │  │  ├─ follow
│  │  │  ├─ page.tsx
│  │  │  └─ [username]
│  │  │     └─ page.tsx
│  │  ├─ register
│  │  │  └─ page.tsx
│  │  ├─ restaurants
│  │  │  └─ [restaurantId]
│  │  │     └─ page.tsx
│  │  ├─ review
│  │  │  ├─ edit
│  │  │  │  └─ [id]
│  │  │  │     └─ page.tsx
│  │  │  └─ page.tsx
│  │  ├─ scraper-input
│  │  │  └─ page.tsx
│  │  └─ _components
│  │     ├─ FavouritesList.tsx
│  │     ├─ FollowButton.tsx
│  │     ├─ GoogleMap.tsx
│  │     ├─ navbar.sass
│  │     ├─ navbar.tsx
│  │     ├─ post.tsx
│  │     ├─ ProfileEditForm.tsx
│  │     ├─ ProfileHeader.tsx
│  │     ├─ RequestMenuModal.tsx
│  │     ├─ ResponsiveNavbar.tsx
│  │     ├─ ReviewModal.tsx
│  │     ├─ SessionProvider.tsx
│  │     └─ SortDropdown.tsx
│  ├─ env.js
│  ├─ lib
│  │  ├─ auth.ts
│  │  ├─ googleMapsLoader.tsx
│  │  ├─ jwt.ts
│  │  ├─ locationService.ts
│  │  └─ useSortHook.ts
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
│  │  ├─ location.css
│  │  └─ navbar.css
│  ├─ trpc
│  │  ├─ query-client.ts
│  │  ├─ react.tsx
│  │  └─ server.ts
│  └─ types
│     └─ next-auth.d.ts
├─ start-database.sh
├─ tailwind.config.ts
└─ tsconfig.json

```
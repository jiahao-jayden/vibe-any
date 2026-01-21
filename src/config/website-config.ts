import type { WebsiteConfig } from "@/shared/types/config"
import { PaymentTypes, PlanIntervals, PlanTypes } from "@/shared/types/payment"
import { siteConfig } from "./site-config"

/**
 * Website Configuration
 *
 * Global website configuration file containing all core feature configurations.
 * This configuration defines the website's basic information, features, and third-party service integrations.
 *
 * @description Centralized configuration management to avoid hardcoding and improve maintainability
 *
 * Configuration modules include:
 *
 * 1. metadata - Website metadata, SEO information, theme configuration, and brand assets
 *    - Website title and description
 *    - Theme modes (light/dark/system themes)
 *    - Website icons, logos, and OG images
 *    - Social media links (GitHub, Twitter, Discord, etc.)
 *
 * 2. i18n - Internationalization configuration
 *    - Default language settings
 *    - List of supported languages with display names and flags
 *    - Multi-language content management
 *
 * 3. blog - Blog functionality configuration
 *    - Blog list pagination size
 *    - Related posts recommendation count
 *
 * 4. mail - Email service configuration
 *    - Email service provider (Resend)
 *    - Contact email address
 *    - Used for sending notifications, verification emails, etc.
 *
 * 5. newsletter - Newsletter configuration
 *    - Newsletter service provider
 *    - Auto-subscribe setting after user registration
 *    - Email marketing and user communication
 *
 * 6. storage - File storage configuration
 *    - Storage service provider (AWS S3, Cloudflare R2, etc.)
 *    - File upload and storage management
 *
 * 7. payment - Payment service configuration
 *    - Payment provider (Stripe)
 *    - Payment flow and webhook handling
 *    - Subscription management and transaction processing
 *
 * 8. price - Pricing plans configuration
 *    - Free plan definition
 *    - Pro subscription plans (monthly/yearly)
 *    - Lifetime purchase plans
 *    - Price IDs, amounts, currencies, and billing intervals
 *
 */
export const websiteConfig: WebsiteConfig = {
  metadata: siteConfig,
  i18n: {
    defaultLocale: "en",
    locales: {
      en: {
        flag: "🇺🇸",
        name: "English",
      },
      zh: {
        flag: "🇨🇳",
        name: "中文",
      },
    },
  },
  blog: {
    initialLoadSize: 12,
    relatedPostsSize: 3,
  },
  mail: {
    provider: "resend",
    contact: "support@vibeany.dev",
  },
  newsletter: {
    provider: "resend",
    autoSubscribeAfterSignUp: true,
  },
  storage: {
    provider: "s3",
  },
  payment: {
    enabled: true,
    provider: "stripe",
    credit: {
      enabled: false,
      allowFreeUserPurchaseCredits: false,
      signupBonusCredits: {
        enabled: false,
        amount: 0,
        expireDays: 0,
      },
      packages: [
        {
          id: "credit_100",
          credit: {
            amount: 100,
            expireDays: 31,
          },
          price: {
            priceId: process.env.NEXT_PUBLIC_STRIPE_100_CREDITS_PRICE_ID!,
            amount: 990,
            currency: "USD",
          },
        },
        {
          id: "credit_200",
          credit: {
            amount: 200,
            expireDays: 30,
          },
          price: {
            priceId: process.env.NEXT_PUBLIC_STRIPE_200_CREDITS_PRICE_ID!,
            amount: 1990,
            currency: "USD",
          },
        },
      ],
    },
  },
  planWithPrice: [
    {
      id: "free",
      planType: PlanTypes.FREE,
      prices: [],
    },
    {
      id: "pro",
      planType: PlanTypes.SUBSCRIPTION,
      // TODO 这里需要特殊处理的是，对于年付月付需要有定时任务去更新积分
      credit: {
        amount: 100,
        expireDays: 31,
      },
      prices: [
        {
          type: PaymentTypes.SUBSCRIPTION,
          priceId: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID!,
          amount: 990,
          currency: "USD",
          interval: PlanIntervals.MONTH,
        },
        {
          type: PaymentTypes.SUBSCRIPTION,
          priceId: import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID!,
          amount: 9900,
          currency: "USD",
          interval: PlanIntervals.YEAR,
        },
      ],
      recommended: true,
    },
    {
      id: "lifetime",
      planType: PlanTypes.LIFETIME,
      prices: [
        {
          type: PaymentTypes.ONE_TIME,
          priceId: import.meta.env.VITE_STRIPE_LIFETIME_PRICE_ID!,
          amount: 19900,
          currency: "USD",
        },
      ],
    },
  ],
}

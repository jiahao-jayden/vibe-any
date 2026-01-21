import type {
  CreditPackageWithPrice,
  PaymentAdapterType,
  PlanWithPrice,
} from "@/shared/types/payment"

// Website config types
export type ThemeId = "default" | string
export type ColorMode = "light" | "dark" | "system" | string

export type WebsiteConfig = {
  metadata: {
    title?: string
    author?: string
    description?: string
    theme: {
      defaultTheme: ThemeId
      enableSwitch: boolean
    }
    mode: {
      defaultMode: ColorMode
      enableSwitch: boolean
    }
    images: {
      ogImage?: string
      logo?: string
      isInvert?: boolean
    }
    social: {
      github?: string
      twitter?: string
      discord?: string
      youtube?: string
      [k: string]: string | undefined
    }
  }
  i18n: {
    defaultLocale: string
    locales: Record<string, { flag: string; name: string }>
  }
  blog?: {
    initialLoadSize: number
    relatedPostsSize: number
  }
  mail?: {
    provider: "resend" | string
    contact: string
  }
  newsletter?: {
    provider: "resend" | string
    autoSubscribeAfterSignUp: boolean
  }
  storage?: {
    provider: "s3" | string
  }
  payment?: {
    enabled: boolean
    provider: PaymentAdapterType
    credit?: {
      enabled: boolean
      allowFreeUserPurchaseCredits: boolean
      signupBonusCredits: {
        enabled: boolean
        amount: number
        expireDays?: number
      }
      packages?: CreditPackageWithPrice[]
    }
  }
  planWithPrice?: PlanWithPrice[]
}

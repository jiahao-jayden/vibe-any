import { getPriceById } from "@/config/payment-config"
import type { CryptoCheckoutData, CryptoCurrencyId } from "@/shared/types/crypto"
import { getEnabledCryptoCurrencies } from "./currencies"

type CheckoutSummary = Pick<CryptoCheckoutData, "orderId" | "planId" | "priceId" | "cryptoCurrency">

export function buildCheckoutRestartPayload(params: {
  checkout: Pick<CheckoutSummary, "orderId" | "planId" | "priceId">
  cryptoCurrency: CryptoCurrencyId
  origin: string
}) {
  return {
    planId: params.checkout.planId,
    priceId: params.checkout.priceId,
    provider: "crypto" as const,
    currentOrderId: params.checkout.orderId,
    successUrl: `${params.origin}/dashboard/billing`,
    cancelUrl: `${params.origin}/dashboard/billing`,
    metadata: {
      cryptoCurrency: params.cryptoCurrency,
    },
  }
}

export function getCheckoutCurrencyOptions(checkout: CheckoutSummary) {
  const price = getPriceById(checkout.planId, checkout.priceId)
  const pricedCurrencyIds = Object.keys(price?.cryptoPrices ?? {}) as CryptoCurrencyId[]
  const availableCurrencyIds =
    pricedCurrencyIds.length > 0 ? pricedCurrencyIds : [checkout.cryptoCurrency]

  return getEnabledCryptoCurrencies(availableCurrencyIds).map((currency) => ({
    id: currency.id,
    label: currency.label,
  }))
}

export function getCheckoutLoadErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return fallbackMessage
}

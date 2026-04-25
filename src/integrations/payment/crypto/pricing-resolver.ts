import Decimal from "decimal.js"
import { getPlanById, getPriceById } from "@/config/payment-config"
import type { CryptoCurrencyId, ResolvedCryptoPrice } from "@/shared/types/crypto"
import { getCryptoCurrencyConfig } from "./currencies"
import { CryptoPaymentError } from "./errors"

export class CryptoPricingResolver {
  resolve(params: {
    planId: string
    priceId: string
    cryptoCurrency: CryptoCurrencyId
  }): ResolvedCryptoPrice {
    const { planId, priceId, cryptoCurrency } = params

    const plan = getPlanById(planId)
    if (!plan) {
      throw new CryptoPaymentError({
        code: "crypto_price_not_configured",
        statusCode: 400,
        userMessage: "This crypto price is not available for the selected plan.",
        message: `Crypto pricing plan not found: ${planId}`,
        context: { planId, priceId, cryptoCurrency },
      })
    }

    const price = getPriceById(planId, priceId)
    if (!price) {
      throw new CryptoPaymentError({
        code: "crypto_price_not_configured",
        statusCode: 400,
        userMessage: "This crypto price is not available for the selected plan.",
        message: `Crypto pricing price not found: ${planId}/${priceId}`,
        context: { planId, priceId, cryptoCurrency },
      })
    }

    const currencyConfig = getCryptoCurrencyConfig(cryptoCurrency)
    if (!currencyConfig || !currencyConfig.enabled) {
      throw new CryptoPaymentError({
        code: "invalid_crypto_currency",
        statusCode: 400,
        userMessage: "The selected crypto currency is invalid.",
        message: `Crypto currency is not available: ${cryptoCurrency}`,
        context: { planId, priceId, cryptoCurrency },
      })
    }

    const cryptoAmount = price.cryptoPrices?.[cryptoCurrency]
    if (!cryptoAmount) {
      throw new CryptoPaymentError({
        code: "crypto_price_not_configured",
        statusCode: 400,
        userMessage: "This crypto price is not available for the selected plan.",
        message: `Crypto price is not configured: ${planId}/${priceId}/${cryptoCurrency}`,
        context: { planId, priceId, cryptoCurrency },
      })
    }

    return {
      cryptoCurrency,
      cryptoAmount: new Decimal(cryptoAmount).toString(),
      fiatAmount: new Decimal(price.amount).div(100).toFixed(2),
      fiatCurrency: price.currency,
      planId,
      priceId,
      interval: price.interval,
    }
  }
}

export const cryptoPricingResolver = new CryptoPricingResolver()

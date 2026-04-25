import type { CryptoCurrencyId } from "@/shared/types/crypto"
import type { PaymentProvider, PlanPrice } from "@/shared/types/payment"

export interface PaymentMethodDisplayLabels {
  fiatLabel: string
  cardLabel: string
  paypalLabel: string
  wechatLabel: string
  alipayLabel: string
}

export function formatCryptoCurrencyUnit(currencyId: CryptoCurrencyId) {
  switch (currencyId) {
    case "usdc_sol":
      return "USDC"
    case "usdt_erc20":
    case "usdt_trc20":
      return "USDT"
    default:
      return currencyId.split("_")[0].toUpperCase()
  }
}

export function getPriceDisplay(
  price: Pick<PlanPrice, "amount" | "cryptoPrices">,
  provider: string,
  cryptoCurrency?: CryptoCurrencyId
) {
  if (provider === "crypto" && cryptoCurrency) {
    const cryptoAmount = price.cryptoPrices?.[cryptoCurrency]
    if (cryptoAmount) {
      return {
        amountText: cryptoAmount,
        unitText: formatCryptoCurrencyUnit(cryptoCurrency),
        isCrypto: true,
      }
    }
  }

  return {
    amountText: `${price.amount / 100}`,
    unitText: "$",
    isCrypto: false,
  }
}

export function getPaymentMethodDisplayLabel(
  provider: PaymentProvider | string,
  labels: PaymentMethodDisplayLabels
) {
  switch (provider) {
    case "stripe":
    case "creem":
      return labels.cardLabel
    case "paypal":
      return labels.paypalLabel
    case "wechat":
      return labels.wechatLabel
    case "alipay":
      return labels.alipayLabel
    default:
      return labels.fiatLabel
  }
}

export function shouldShowPaymentMethod(hasCryptoOption: boolean) {
  return hasCryptoOption
}

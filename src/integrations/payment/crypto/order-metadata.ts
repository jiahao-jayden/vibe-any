import type { order } from "@/db/order.schema"
import type {
  CheckoutDisplayStatus,
  CryptoCheckoutData,
  CryptoDetailedStatus,
  CryptoOrderMetadata,
  PayRamCryptoOrderMetadata,
  SolanaCryptoOrderMetadata,
} from "@/shared/types/crypto"
import { getCryptoCurrencyConfig } from "./currencies"

type OrderRecord = typeof order.$inferSelect

function isBaseCryptoOrderMetadata(record: Record<string, unknown>) {
  return (
    record.paymentMethod === "crypto" &&
    typeof record.cryptoCurrency === "string" &&
    typeof record.detailedStatus === "string" &&
    typeof record.checkoutExpiresAt === "string" &&
    typeof record.cryptoAmount === "string" &&
    typeof record.fiatAmount === "string" &&
    typeof record.fiatCurrency === "string" &&
    typeof record.walletAddress === "string" &&
    typeof record.network === "string" &&
    typeof record.planId === "string" &&
    typeof record.priceId === "string"
  )
}

function isSolanaCryptoOrderMetadata(
  record: Record<string, unknown>
): record is Record<string, unknown> & SolanaCryptoOrderMetadata {
  return (
    isBaseCryptoOrderMetadata(record) &&
    record.cryptoProvider === "solanapay" &&
    typeof record.referenceKey === "string" &&
    typeof record.solanaPayUrl === "string" &&
    typeof record.memo === "string"
  )
}

function isPayRamCryptoOrderMetadata(
  record: Record<string, unknown>
): record is Record<string, unknown> & PayRamCryptoOrderMetadata {
  return (
    isBaseCryptoOrderMetadata(record) &&
    record.cryptoProvider === "payram" &&
    typeof record.providerPaymentId === "string"
  )
}

export function isCryptoOrderMetadata(metadata: unknown): metadata is CryptoOrderMetadata {
  if (typeof metadata !== "object" || metadata === null) {
    return false
  }

  const record = metadata as Record<string, unknown>
  return isSolanaCryptoOrderMetadata(record) || isPayRamCryptoOrderMetadata(record)
}

export function getCryptoOrderMetadata(orderRecord: OrderRecord) {
  return isCryptoOrderMetadata(orderRecord.metadata) ? orderRecord.metadata : null
}

export function serializeCryptoOrderMetadata(
  metadata: CryptoOrderMetadata
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(metadata).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string"
    )
  )
}

export function mapDetailedStatusToDisplayStatus(
  detailedStatus: CryptoDetailedStatus
): CheckoutDisplayStatus {
  switch (detailedStatus) {
    case "paid":
      return "paid"
    case "confirming":
      return "confirming"
    case "review_required":
    case "underpaid":
    case "overpaid":
    case "late_payment":
    case "duplicate_payment":
      return "review_required"
    case "expired":
    case "canceled":
      return "expired"
    default:
      return "waiting_payment"
  }
}

export function getRemainingSeconds(expiresAt: string | Date) {
  const expiresAtDate = expiresAt instanceof Date ? expiresAt : new Date(expiresAt)
  return Math.max(0, Math.ceil((expiresAtDate.getTime() - Date.now()) / 1000))
}

function isOverduePendingCheckout(orderRecord: OrderRecord, metadata: CryptoOrderMetadata) {
  if (orderRecord.status !== "pending") {
    return false
  }

  if (metadata.detailedStatus !== "waiting_payment" && metadata.detailedStatus !== "confirming") {
    return false
  }

  return new Date(resolveExpiresAt(metadata)).getTime() <= Date.now()
}

function resolveDetailedStatus(orderRecord: OrderRecord, metadata: CryptoOrderMetadata) {
  if (orderRecord.status === "paid") {
    return "paid"
  }

  if (orderRecord.status === "expired") {
    return "expired"
  }

  if (orderRecord.status === "canceled") {
    return "canceled"
  }

  if (isOverduePendingCheckout(orderRecord, metadata)) {
    return "expired"
  }

  return metadata.detailedStatus
}

function resolveExpiresAt(metadata: CryptoOrderMetadata) {
  return metadata.providerExpiresAt ?? metadata.checkoutExpiresAt
}

export function buildCryptoCheckoutData(orderRecord: OrderRecord): CryptoCheckoutData {
  const metadata = getCryptoOrderMetadata(orderRecord)
  if (!metadata) {
    throw new Error(`Order is not a crypto checkout: ${orderRecord.id}`)
  }

  const detailedStatus = resolveDetailedStatus(orderRecord, metadata)
  const expiresAt = resolveExpiresAt(metadata)
  const baseCheckout = {
    orderId: orderRecord.id,
    provider: "crypto" as const,
    cryptoProvider: metadata.cryptoProvider,
    status: mapDetailedStatusToDisplayStatus(detailedStatus),
    detailedStatus,
    planId: metadata.planId,
    priceId: metadata.priceId,
    cryptoCurrency: metadata.cryptoCurrency,
    cryptoAmount: metadata.cryptoAmount,
    fiatEquivalent: {
      amount: metadata.fiatAmount,
      currency: metadata.fiatCurrency,
    },
    walletAddress: metadata.walletAddress,
    network:
      metadata.cryptoProvider === "payram" ? metadata.payramNetwork ?? metadata.network : metadata.network,
    expiresAt,
    remainingSeconds: getRemainingSeconds(expiresAt),
    explorerUrl: metadata.explorerUrl,
    reviewReason: metadata.reviewReason,
  }

  if (metadata.cryptoProvider === "solanapay") {
    return {
      ...baseCheckout,
      cryptoProvider: "solanapay",
      referenceKey: metadata.referenceKey,
      solanaPayUrl: metadata.solanaPayUrl,
      memo: metadata.memo,
      tokenMint: metadata.tokenMint,
      txSignature: metadata.txSignature,
      estimatedConfirmSeconds: getCryptoCurrencyConfig(metadata.cryptoCurrency).estimatedConfirmTime,
    }
  }

  return {
    ...baseCheckout,
    cryptoProvider: "payram",
    providerPaymentId: metadata.providerPaymentId,
    payramPaymentUrl: metadata.payramPaymentUrl,
    payramQrPayload: metadata.payramQrPayload,
    payramCurrencyCode: metadata.payramCurrencyCode,
    payramStandard: metadata.payramStandard,
    payramStatus: metadata.payramStatus,
  }
}

export function getCryptoCheckoutSessionId(checkout: CryptoCheckoutData) {
  return checkout.cryptoProvider === "solanapay" ? checkout.referenceKey : checkout.providerPaymentId
}

export function getCryptoCheckoutUrl(checkout: CryptoCheckoutData) {
  if (checkout.cryptoProvider === "solanapay") {
    return checkout.solanaPayUrl
  }

  return checkout.payramPaymentUrl ?? `/checkout/crypto/${checkout.orderId}`
}

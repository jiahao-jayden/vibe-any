import type {
  CryptoChain,
  CryptoCurrencyId,
  CryptoProviderId,
} from "@/shared/types/crypto"
import { getEnabledCryptoCurrencyIds, getSolanaPayNetwork } from "./config"

export interface CryptoCurrencyConfig {
  id: CryptoCurrencyId
  label: string
  chain: CryptoChain
  cryptoProvider: CryptoProviderId
  decimals: number
  amountTolerance: string
  tokenMint?: string
  enabled: boolean
  sortOrder: number
  checkoutTimeout: number
  estimatedConfirmTime?: number
  payramNetwork?: string
  payramCurrencyCode?: string
  payramStandard?: string
  providerCheckoutTimeout?: number
}

const DEFAULT_CHECKOUT_TIMEOUT_SECONDS = 15 * 60
const DEFAULT_CONFIRM_TIME_SECONDS = 30
const DEFAULT_PAYRAM_CONFIRM_SECONDS = 180
const enabledCurrencyIds = getEnabledCryptoCurrencyIds()
const enabledCurrencyOrder = new Map(
  enabledCurrencyIds.map((currencyId, index) => [currencyId, index] as const)
)

const USDC_MAINNET_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
const USDC_DEVNET_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"

export const CRYPTO_CURRENCIES: Record<CryptoCurrencyId, CryptoCurrencyConfig> = {
  usdc_sol: {
    id: "usdc_sol",
    label: "USDC (Solana)",
    chain: "solana",
    cryptoProvider: "solanapay",
    decimals: 6,
    amountTolerance: "0.01",
    tokenMint: getSolanaPayNetwork() === "mainnet-beta" ? USDC_MAINNET_MINT : USDC_DEVNET_MINT,
    enabled: enabledCurrencyIds.includes("usdc_sol"),
    sortOrder: 1,
    checkoutTimeout: DEFAULT_CHECKOUT_TIMEOUT_SECONDS,
    estimatedConfirmTime: DEFAULT_CONFIRM_TIME_SECONDS,
  },
  sol: {
    id: "sol",
    label: "SOL",
    chain: "solana",
    cryptoProvider: "solanapay",
    decimals: 9,
    amountTolerance: "0.001",
    enabled: enabledCurrencyIds.includes("sol"),
    sortOrder: 2,
    checkoutTimeout: DEFAULT_CHECKOUT_TIMEOUT_SECONDS,
    estimatedConfirmTime: DEFAULT_CONFIRM_TIME_SECONDS,
  },
  btc: {
    id: "btc",
    label: "BTC",
    chain: "bitcoin",
    cryptoProvider: "payram",
    decimals: 8,
    amountTolerance: "0.00001",
    enabled: enabledCurrencyIds.includes("btc"),
    sortOrder: 3,
    checkoutTimeout: DEFAULT_CHECKOUT_TIMEOUT_SECONDS,
    estimatedConfirmTime: DEFAULT_PAYRAM_CONFIRM_SECONDS,
    payramNetwork: "Bitcoin",
    payramCurrencyCode: "BTC",
    payramStandard: "BTC",
  },
  eth: {
    id: "eth",
    label: "ETH",
    chain: "ethereum",
    cryptoProvider: "payram",
    decimals: 18,
    amountTolerance: "0.0001",
    enabled: enabledCurrencyIds.includes("eth"),
    sortOrder: 4,
    checkoutTimeout: DEFAULT_CHECKOUT_TIMEOUT_SECONDS,
    estimatedConfirmTime: DEFAULT_PAYRAM_CONFIRM_SECONDS,
    payramNetwork: "Ethereum",
    payramCurrencyCode: "ETH",
    payramStandard: "ETH",
  },
  trx: {
    id: "trx",
    label: "TRX",
    chain: "tron",
    cryptoProvider: "payram",
    decimals: 6,
    amountTolerance: "0.01",
    enabled: enabledCurrencyIds.includes("trx"),
    sortOrder: 5,
    checkoutTimeout: DEFAULT_CHECKOUT_TIMEOUT_SECONDS,
    estimatedConfirmTime: DEFAULT_PAYRAM_CONFIRM_SECONDS,
    payramNetwork: "Tron",
    payramCurrencyCode: "TRX",
    payramStandard: "TRX",
  },
  usdt_erc20: {
    id: "usdt_erc20",
    label: "USDT (ERC20)",
    chain: "ethereum",
    cryptoProvider: "payram",
    decimals: 6,
    amountTolerance: "0.01",
    enabled: enabledCurrencyIds.includes("usdt_erc20"),
    sortOrder: 6,
    checkoutTimeout: DEFAULT_CHECKOUT_TIMEOUT_SECONDS,
    estimatedConfirmTime: DEFAULT_PAYRAM_CONFIRM_SECONDS,
    payramNetwork: "Ethereum",
    payramCurrencyCode: "USDT",
    payramStandard: "ERC20",
  },
  usdt_trc20: {
    id: "usdt_trc20",
    label: "USDT (TRC20)",
    chain: "tron",
    cryptoProvider: "payram",
    decimals: 6,
    amountTolerance: "0.01",
    enabled: enabledCurrencyIds.includes("usdt_trc20"),
    sortOrder: 7,
    checkoutTimeout: DEFAULT_CHECKOUT_TIMEOUT_SECONDS,
    estimatedConfirmTime: DEFAULT_PAYRAM_CONFIRM_SECONDS,
    payramNetwork: "Tron",
    payramCurrencyCode: "USDT",
    payramStandard: "TRC20",
  },
}

export function getCryptoCurrencyConfig(currencyId: CryptoCurrencyId) {
  return CRYPTO_CURRENCIES[currencyId]
}

export function getEnabledCryptoCurrencies(availableCurrencyIds?: CryptoCurrencyId[]) {
  return Object.values(CRYPTO_CURRENCIES)
    .filter(
      (currency) =>
        currency.enabled && (!availableCurrencyIds || availableCurrencyIds.includes(currency.id))
    )
    .sort((left, right) => {
      const leftOrder = enabledCurrencyOrder.get(left.id) ?? left.sortOrder
      const rightOrder = enabledCurrencyOrder.get(right.id) ?? right.sortOrder

      return leftOrder - rightOrder
    })
}

export function getDefaultCryptoCurrencyId(availableCurrencyIds?: CryptoCurrencyId[]) {
  return getEnabledCryptoCurrencies(availableCurrencyIds)[0]?.id
}

export function isEnabledCryptoCurrency(currencyId?: string): currencyId is CryptoCurrencyId {
  if (!currencyId) {
    return false
  }

  return getEnabledCryptoCurrencies().some((currency) => currency.id === currencyId)
}

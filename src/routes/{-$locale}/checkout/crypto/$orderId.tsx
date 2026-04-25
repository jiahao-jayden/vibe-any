import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ArrowLeftIcon, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useIntlayer } from "react-intlayer"
import { toast } from "sonner"
import {
  buildCheckoutRestartPayload,
  getCheckoutCurrencyOptions,
  getCheckoutLoadErrorMessage,
} from "@/integrations/payment/crypto/checkout-route-helpers"
import { CryptoCheckoutCard } from "@/shared/components/crypto/crypto-checkout-card"
import { LocalizedLink } from "@/shared/components/locale/localized-link"
import { Button } from "@/shared/components/ui/button"
import { useLocalizedNavigate } from "@/shared/hooks/use-localized-navigate"
import { http } from "@/shared/lib/tools/http-client"
import type { CryptoCheckoutData, CryptoCurrencyId } from "@/shared/types/crypto"

export const Route = createFileRoute("/{-$locale}/checkout/crypto/$orderId" as never)({
  component: RouteComponent,
})

const POLL_INTERVAL_MS = 5000

function shouldShowNetworkCongestionHint(
  checkout: CryptoCheckoutData | undefined,
  statusObservedAt: number | null
) {
  if (!checkout || statusObservedAt === null) {
    return false
  }

  if (checkout.cryptoProvider !== "solanapay") {
    return false
  }

  if (checkout.status !== "waiting_payment" && checkout.status !== "confirming") {
    return false
  }

  const observedSeconds = Math.floor((Date.now() - statusObservedAt) / 1000)
  const thresholdSeconds = Math.max(60, (checkout.estimatedConfirmSeconds ?? 30) * 4)

  return observedSeconds >= thresholdSeconds
}

function RouteComponent() {
  const { orderId } = Route.useParams() as { orderId: string }
  const navigate = useLocalizedNavigate()
  const queryClient = useQueryClient()
  const content = useIntlayer("crypto-checkout")

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ["crypto-checkout", orderId],
    queryFn: () => http<CryptoCheckoutData>(`/api/payment/crypto/${orderId}`, { silent: true }),
    retry: false,
  })

  const [isRedirecting, setIsRedirecting] = useState(false)
  const [statusObservedAt, setStatusObservedAt] = useState<number | null>(null)

  useEffect(() => {
    if (data?.status === "paid") {
      setIsRedirecting(true)
      ;(navigate as (to: string) => void)("/dashboard/billing?success=true")
    }
  }, [data?.status, navigate])

  useEffect(() => {
    if (data?.status === "waiting_payment" || data?.status === "confirming") {
      setStatusObservedAt((current) => current ?? Date.now())
      return
    }

    setStatusObservedAt(null)
  }, [data?.status, orderId])

  useEffect(() => {
    if (data?.status !== "waiting_payment" && data?.status !== "confirming") {
      return
    }

    const timer = window.setInterval(() => {
      void refetch()
    }, POLL_INTERVAL_MS)

    return () => {
      window.clearInterval(timer)
      void queryClient.cancelQueries({ queryKey: ["crypto-checkout", orderId] })
    }
  }, [data?.status, orderId, queryClient, refetch])

  const showNetworkCongestionHint = shouldShowNetworkCongestionHint(data, statusObservedAt)
  const currencyOptions = data ? getCheckoutCurrencyOptions(data) : []
  const checkoutLoadErrorMessage = getCheckoutLoadErrorMessage(error, content.genericError.value)

  const { mutate: restartCheckout, isPending: isRestarting } = useMutation({
    mutationFn: async (cryptoCurrency: CryptoCurrencyId) => {
      if (!data) {
        throw new Error("Checkout data is not ready")
      }

      return http<{ orderId: string; provider: string }>("/api/payment/checkout", {
        method: "POST",
        body: buildCheckoutRestartPayload({
          checkout: data,
          cryptoCurrency,
          origin: window.location.origin,
        }),
      })
    },
    onSuccess: (result) => {
      if (result?.orderId) {
        ;(navigate as (to: string) => void)(`/checkout/crypto/${result.orderId}`)
      }
    },
    onError: (mutationError) => {
      toast.error(getCheckoutLoadErrorMessage(mutationError, content.genericError.value))
    },
  })

  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col gap-6 px-6 py-10">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          asChild
        >
          <LocalizedLink to={"/" as never}>
            <ArrowLeftIcon className="size-4" />
            {content.backToPricing.value}
          </LocalizedLink>
        </Button>

        {(isLoading || isRedirecting) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {isRedirecting ? content.statusPaid.value : content.loadingCheckout.value}
          </div>
        )}
      </div>

      {data ? (
        <CryptoCheckoutCard
          checkout={data}
          currencyOptions={currencyOptions}
          isSwitchingCurrency={isRestarting}
          showNetworkCongestionHint={showNetworkCongestionHint}
          onCurrencyChange={restartCheckout}
          onRetry={() => restartCheckout(data.cryptoCurrency)}
        />
      ) : (
        <div className="flex min-h-80 items-center justify-center rounded-2xl border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isLoading ? <Loader2 className="size-4 animate-spin" /> : null}
            {isLoading ? content.loadingCheckout.value : checkoutLoadErrorMessage}
          </div>
        </div>
      )}
    </div>
  )
}

import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import {
  CheckCircle2Icon,
  ClockIcon,
  PackageIcon,
  ReceiptIcon,
  RefreshCwIcon,
  XCircleIcon,
} from "lucide-react"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { useMemo } from "react"
import { useIntlayer } from "react-intlayer"
import { PageHeader } from "@/shared/components/admin"
import {
  DataTable,
  DataTableColumnHeader,
  DataTableSkeleton,
  DataTableToolbar,
} from "@/shared/components/common/data-table"
import { Badge } from "@/shared/components/ui/badge"
import { useDataTable } from "@/shared/hooks/use-data-table"
import { http } from "@/shared/lib/tools/http-client"
import { cn } from "@/shared/lib/utils"
import type { AdminOrderListItem, PaginatedResponse } from "@/shared/types/admin"

export const Route = createFileRoute("/{-$locale}/_main/admin/orders")({
  component: OrdersPage,
})

function StatCard({
  icon: Icon,
  label,
  value,
  iconClassName,
}: {
  icon: React.ElementType
  label: string
  value: number | string
  iconClassName?: string
}) {
  return (
    <div className="rounded-xl bg-card border p-3 sm:p-4 w-28 shrink-0 sm:w-auto sm:shrink">
      <div className="flex items-start gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
          <p className="text-lg sm:text-2xl font-semibold tabular-nums">{value}</p>
        </div>
        <div className={cn("shrink-0", iconClassName)}>
          <Icon className="size-4 sm:size-5" />
        </div>
      </div>
    </div>
  )
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100)
}

function formatDate(date: Date | string | null, locale: string) {
  if (!date) return "-"
  const d = new Date(date)
  return d.toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getStatusBadge(status: AdminOrderListItem["status"]) {
  const config: Record<
    AdminOrderListItem["status"],
    { variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ElementType }
  > = {
    pending: { variant: "secondary", icon: ClockIcon },
    paid: { variant: "default", icon: CheckCircle2Icon },
    canceled: { variant: "outline", icon: XCircleIcon },
    expired: { variant: "outline", icon: ClockIcon },
    refunded: { variant: "destructive", icon: RefreshCwIcon },
  }

  const { variant, icon: Icon } = config[status]
  return (
    <Badge
      variant={variant}
      className="gap-1"
    >
      <Icon className="size-3" />
      {status}
    </Badge>
  )
}

function OrdersPage() {
  const content = useIntlayer("admin")
  const locale = typeof window !== "undefined" ? document.documentElement.lang : "en"

  const [page] = useQueryState("page", parseAsInteger.withDefault(1))
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(10))
  const [search] = useQueryState("search", parseAsString)
  const [status] = useQueryState("status", parseAsString)
  const [orderType] = useQueryState("orderType", parseAsString)

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", page, perPage, search, status, orderType],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(perPage),
      })
      if (search) params.set("search", search)
      if (status && status !== "all") params.set("status", status)
      if (orderType && orderType !== "all") params.set("orderType", orderType)
      return http<PaginatedResponse<AdminOrderListItem>>(`/api/admin/orders?${params}`)
    },
  })

  const orders = data?.items ?? []
  const totalRows = data?.pagination.total ?? 0
  const pageCount = data?.pagination.totalPages ?? -1

  const stats = useMemo(() => {
    return {
      total: totalRows,
      paid: orders.filter((o) => o.status === "paid").length,
      pending: orders.filter((o) => o.status === "pending").length,
      refunded: orders.filter((o) => o.status === "refunded").length,
    }
  }, [orders, totalRows])

  const columns: ColumnDef<AdminOrderListItem>[] = useMemo(
    () => [
      {
        id: "id",
        accessorKey: "id",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={content.orders.table.orderId.value}
          />
        ),
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.id}</span>
        ),
        meta: {
          label: content.orders.table.orderId.value,
          placeholder: "Search order ID...",
          variant: "text" as const,
        },
        enableColumnFilter: true,
        enableHiding: true,
      },
      {
        id: "user",
        header: () => content.orders.table.user,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium truncate">{row.original.userName || "-"}</p>
            <p className="text-xs text-muted-foreground truncate">{row.original.userEmail}</p>
          </div>
        ),
        enableSorting: false,
        enableHiding: true,
      },
      {
        id: "productName",
        accessorKey: "productName",
        header: () => content.orders.table.product,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="shrink-0"
            >
              {row.original.orderType === "subscription" ? "Subscription" : "Credit"}
            </Badge>
            <span className="truncate">{row.original.productName || "-"}</span>
          </div>
        ),
        enableSorting: false,
        enableHiding: true,
      },
      {
        id: "amount",
        accessorKey: "amount",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={content.orders.table.amount.value}
          />
        ),
        cell: ({ row }) => (
          <span className="font-medium tabular-nums">
            {formatCurrency(row.original.amount, row.original.currency)}
          </span>
        ),
        enableHiding: true,
      },
      {
        id: "status",
        accessorKey: "status",
        header: () => content.orders.table.status,
        cell: ({ row }) => getStatusBadge(row.original.status),
        meta: {
          label: content.orders.table.status.value,
          variant: "select" as const,
          options: [
            { label: content.orders.filters.pending.value, value: "pending" },
            { label: content.orders.filters.paid.value, value: "paid" },
            { label: content.orders.filters.canceled.value, value: "canceled" },
            { label: content.orders.filters.expired.value, value: "expired" },
            { label: content.orders.filters.refunded.value, value: "refunded" },
          ],
        },
        enableColumnFilter: true,
        enableSorting: false,
        enableHiding: true,
      },
      {
        id: "orderType",
        accessorKey: "orderType",
        header: () => content.orders.filters.allTypes,
        cell: ({ row }) => (
          <Badge variant="outline">
            {row.original.orderType === "subscription" ? "Subscription" : "Credit"}
          </Badge>
        ),
        meta: {
          label: content.orders.filters.allTypes.value,
          variant: "select" as const,
          options: [
            { label: content.orders.filters.subscription.value, value: "subscription" },
            { label: content.orders.filters.creditPackage.value, value: "credit_package" },
          ],
        },
        enableColumnFilter: true,
        enableSorting: false,
        enableHiding: true,
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={content.orders.table.createdAt.value}
          />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground text-sm">
            {formatDate(row.original.createdAt, locale)}
          </span>
        ),
        enableHiding: true,
      },
      {
        id: "paidAt",
        accessorKey: "paidAt",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={content.orders.table.paidAt.value}
          />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground text-sm">
            {formatDate(row.original.paidAt, locale)}
          </span>
        ),
        enableHiding: true,
      },
    ],
    [content, locale]
  )

  const { table } = useDataTable({
    data: orders,
    columns,
    pageCount,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      pagination: { pageIndex: 0, pageSize: 10 },
    },
    getRowId: (row) => row.id,
  })

  const hasFilters = search || (status && status !== "all") || (orderType && orderType !== "all")

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <PageHeader
        title={content.orders.title.value}
        description={content.orders.description.value}
      />

      <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0 lg:grid-cols-4 shrink-0">
        <StatCard
          icon={ReceiptIcon}
          label={content.orders.stats.total.value}
          value={stats.total}
          iconClassName="rounded-xl bg-primary/10 p-2.5 text-primary"
        />
        <StatCard
          icon={CheckCircle2Icon}
          label={content.orders.stats.paid.value}
          value={stats.paid}
          iconClassName="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500"
        />
        <StatCard
          icon={ClockIcon}
          label={content.orders.stats.pending.value}
          value={stats.pending}
          iconClassName="rounded-xl bg-amber-500/10 p-2.5 text-amber-500"
        />
        <StatCard
          icon={RefreshCwIcon}
          label={content.orders.stats.refunded.value}
          value={stats.refunded}
          iconClassName="rounded-xl bg-destructive/10 p-2.5 text-destructive"
        />
      </div>

      {isLoading ? (
        <DataTableSkeleton
          columnCount={8}
          rowCount={perPage}
          filterCount={3}
        />
      ) : orders.length === 0 && !hasFilters ? (
        <div className="flex flex-1 flex-col items-center justify-center py-16 rounded-md border">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
            <PackageIcon className="size-7 text-muted-foreground" />
          </div>
          <h3 className="mt-5 text-base font-medium">{content.orders.empty}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{content.orders.emptyDesc}</p>
        </div>
      ) : (
        <DataTable table={table}>
          <DataTableToolbar table={table} />
        </DataTable>
      )}
    </div>
  )
}

import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { ColumnDef } from "@tanstack/react-table"
import { Ban, Coins, Crown, Eye, Mail, ShieldCheck, User, UserRoundX, Users } from "lucide-react"
import { parseAsInteger, parseAsString, useQueryState } from "nuqs"
import { useMemo, useState } from "react"
import { useIntlayer } from "react-intlayer"
import { PageHeader, UserDetailSheet } from "@/shared/components/admin"
import {
  DataTable,
  DataTableColumnHeader,
  DataTableSkeleton,
  DataTableToolbar,
} from "@/shared/components/common/data-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { useGlobalContext } from "@/shared/context/global.context"
import { useDataTable } from "@/shared/hooks/use-data-table"
import { http } from "@/shared/lib/tools/http-client"
import { cn } from "@/shared/lib/utils"
import type { AdminUserListItem, PaginatedResponse } from "@/shared/types/admin"

export const Route = createFileRoute("/{-$locale}/_main/admin/users")({
  component: UsersPage,
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

function UsersPage() {
  const content = useIntlayer("admin")
  const { config } = useGlobalContext()
  const creditEnabled = config?.public_credit_enable ?? false

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const [page] = useQueryState("page", parseAsInteger.withDefault(1))
  const [perPage] = useQueryState("perPage", parseAsInteger.withDefault(10))
  const [sortBy] = useQueryState("sortBy", parseAsString.withDefault("createdAt"))
  const [sortOrder] = useQueryState("sortOrder", parseAsString.withDefault("desc"))
  const [search] = useQueryState("name", parseAsString)
  const [status] = useQueryState("status", parseAsString)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "users", page, perPage, sortBy, sortOrder, search, status],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(perPage),
        sortBy,
        sortOrder,
      })

      if (search) {
        params.set("search", search)
      }

      if (status) {
        if (status === "banned") {
          params.set("banned", "true")
        } else if (status === "verified" || status === "unverified") {
          params.set("emailVerified", status === "verified" ? "true" : "false")
        }
      }

      return http<PaginatedResponse<AdminUserListItem>>(`/api/admin/users?${params}`)
    },
  })

  const users = data?.items ?? []
  const totalRows = data?.pagination.total ?? 0
  const pageCount = data?.pagination.totalPages ?? -1

  const columns: ColumnDef<AdminUserListItem>[] = useMemo(
    () => [
      {
        id: "avatar",
        header: "",
        size: 60,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <Avatar className="size-9">
            <AvatarImage
              src={row.original.image ?? undefined}
              alt={row.original.name}
            />
            <AvatarFallback className="text-xs">
              {row.original.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ),
      },
      {
        id: "name",
        accessorKey: "name",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={content.users.table.name.value}
          />
        ),
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
        meta: {
          label: content.users.table.name.value,
          placeholder: "Search users...",
          variant: "text" as const,
          icon: User,
        },
        enableColumnFilter: true,
        enableHiding: true,
      },
      {
        id: "email",
        accessorKey: "email",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={content.users.table.email.value}
          />
        ),
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.email}</span>,
        meta: {
          label: content.users.table.email.value,
          placeholder: "Search email...",
          variant: "text" as const,
          icon: Mail,
        },
        enableColumnFilter: true,
        enableHiding: true,
      },
      {
        id: "roles",
        header: () => content.users.roles,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.roles.length > 0 ? (
              <>
                {row.original.roles.slice(0, 2).map((role) => (
                  <Badge
                    key={role.roleId}
                    variant={role.name === "banned" ? "destructive" : "outline"}
                    className="text-xs"
                  >
                    {role.title}
                  </Badge>
                ))}
                {row.original.roles.length > 2 && (
                  <Badge
                    variant="outline"
                    className="text-xs"
                  >
                    +{row.original.roles.length - 2}
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">-</span>
            )}
          </div>
        ),
      },
      {
        id: "subscription",
        header: () => content.users.subscription,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.subscription ? (
            <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-0 text-xs">
              {row.original.subscription.planName}
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              className="text-xs"
            >
              {content.users.free}
            </Badge>
          ),
        enableHiding: true,
      },
      ...(creditEnabled
        ? [
            {
              id: "credits",
              header: () => content.users.credits,
              enableSorting: false,
              cell: ({ row }: { row: { original: AdminUserListItem } }) => (
                <div className="flex items-center gap-1 tabular-nums text-muted-foreground">
                  <Coins className="size-3.5" />
                  {row.original.creditBalance}
                </div>
              ),
              enableHiding: true,
            } as ColumnDef<AdminUserListItem>,
          ]
        : []),
      {
        id: "status",
        accessorFn: (row) =>
          row.banned ? "banned" : row.emailVerified ? "verified" : "unverified",
        header: () => content.users.table.status,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.banned ? (
            <Badge variant="destructive">{content.users.banned}</Badge>
          ) : (
            <Badge variant={row.original.emailVerified ? "default" : "secondary"}>
              {row.original.emailVerified ? content.users.verified : content.users.unverified}
            </Badge>
          ),
        meta: {
          label: content.users.table.status.value,
          variant: "select" as const,
          options: [
            { label: content.users.verified.value, value: "verified" },
            { label: content.users.unverified.value, value: "unverified" },
            { label: content.users.banned.value, value: "banned" },
          ],
        },
        enableColumnFilter: true,
        enableHiding: true,
      },
      {
        id: "createdAt",
        accessorKey: "createdAt",
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            label={content.users.table.createdAt.value}
          />
        ),
        cell: ({ row }) => (
          <span className="tabular-nums text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </span>
        ),
        enableHiding: true,
      },
      {
        id: "actions",
        header: "",
        size: 50,
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={(e) => {
              e.stopPropagation()
              handleViewUser(row.original.id)
            }}
            aria-label="View details"
          >
            <Eye className="size-4" />
          </Button>
        ),
      },
    ],
    [content, creditEnabled]
  )

  const { table } = useDataTable({
    data: users,
    columns,
    pageCount,
    initialState: {
      sorting: [{ id: "createdAt", desc: true }],
      pagination: { pageIndex: 0, pageSize: 10 },
    },
    getRowId: (row) => row.id,
  })

  const stats = useMemo(() => {
    return {
      total: totalRows,
      verified: users.filter((u) => u.emailVerified).length,
      banned: users.filter((u) => u.banned).length,
      subscribed: users.filter((u) => u.subscription).length,
    }
  }, [users, totalRows])

  const handleViewUser = (userId: string) => {
    setSelectedUserId(userId)
    setSheetOpen(true)
  }

  const handleSheetClose = () => {
    setSheetOpen(false)
    setSelectedUserId(null)
  }

  const hasFilters = search || status

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <PageHeader
        title={content.users.title.value}
        description={content.users.description.value}
      />

      <div className="-mx-4 px-4 flex gap-2 overflow-x-auto pb-2 no-scrollbar sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0 lg:grid-cols-4 shrink-0">
        <StatCard
          icon={Users}
          label={content.users.stats.total.value}
          value={stats.total}
          iconClassName="rounded-xl bg-primary/10 p-2.5 text-primary"
        />
        <StatCard
          icon={ShieldCheck}
          label={content.users.stats.verified.value}
          value={stats.verified}
          iconClassName="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-500"
        />
        <StatCard
          icon={Crown}
          label={content.users.stats.subscribed.value}
          value={stats.subscribed}
          iconClassName="rounded-xl bg-amber-500/10 p-2.5 text-amber-500"
        />
        <StatCard
          icon={Ban}
          label={content.users.stats.banned.value}
          value={stats.banned}
          iconClassName="rounded-xl bg-destructive/10 p-2.5 text-destructive"
        />
      </div>

      {isLoading ? (
        <DataTableSkeleton
          columnCount={creditEnabled ? 9 : 8}
          rowCount={perPage}
          filterCount={2}
        />
      ) : users.length === 0 && !hasFilters ? (
        <div className="flex flex-1 flex-col items-center justify-center py-16 rounded-md border">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
            <UserRoundX className="size-7 text-muted-foreground" />
          </div>
          <h3 className="mt-5 text-base font-medium">{content.users.empty}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground">{content.users.emptyDesc}</p>
        </div>
      ) : (
        <DataTable table={table}>
          <DataTableToolbar table={table} />
        </DataTable>
      )}

      <UserDetailSheet
        userId={selectedUserId}
        open={sheetOpen}
        onOpenChange={(open: boolean) => {
          if (!open) handleSheetClose()
        }}
        onUpdate={() => refetch()}
      />
    </div>
  )
}

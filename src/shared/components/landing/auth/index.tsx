"use client"

import { CreditCard, LogOut, ScanFace, Settings } from "lucide-react"
import { useTranslations } from "next-intl"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Link } from "@/i18n/navigation"

import { authClient } from "@/lib/auth/client-auth"
import { cn } from "@/lib/utils"

import { useUserStore } from "@/stores/user-store"

// Helpers
const getUserInitials = (user: { name?: string | null; email: string }): string => {
  if (user.name) {
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }
  return user.email.charAt(0).toUpperCase()
}

// Main component
export const UserMenu = () => {
  const { data: session, isPending } = authClient.useSession()

  const t = useTranslations("auth.userMenu")
  const { user: persistedUser, hydrated, clearUser } = useUserStore()

  // Prefer session user; while loading, fallback to persisted user if hydrated
  const effectiveUser = session?.user
    ? {
        id: session.user.id,
        name: session.user.name ?? undefined,
        email: session.user.email as string,
        avatarUrl: session.user.image ?? undefined,
      }
    : hydrated && persistedUser
      ? persistedUser
      : null

  // Loading: render skeleton unless we already have a persisted user
  if (isPending && !effectiveUser) {
    return <div className={cn("h-8 w-8 rounded-full bg-muted animate-pulse")} />
  }

  // Authenticated user
  if (effectiveUser) {
    const userInitials = getUserInitials({
      name: effectiveUser.name ?? null,
      email: effectiveUser.email || "",
    })

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn("relative h-8 w-8 rounded-full p-0")}
          >
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={effectiveUser.avatarUrl || ""}
                alt={(effectiveUser.name || effectiveUser.email || "") as string}
              />
              <AvatarFallback className="text-sm">{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-56 p-2 shadow-lg border bg-background/95 backdrop-blur-sm"
          align="end"
          forceMount
        >
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className={cn("text-sm font-medium leading-none")}>
                {effectiveUser.name || t("defaultUserName")}
              </p>
              <p className={cn("text-xs leading-none text-muted-foreground")}>
                {effectiveUser.email}
              </p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            asChild
            className="rounded-md px-3 py-2 hover:bg-muted/50 focus:bg-muted/50"
          >
            <Link
              href="/dashboard/billing"
              className="cursor-pointer flex items-center text-foreground hover:text-rose-500 transition-colors duration-150"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              <span className="font-medium">{t("billing")}</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem
            asChild
            className="rounded-md px-3 py-2 hover:bg-muted/50 focus:bg-muted/50"
          >
            <Link
              href="/dashboard"
              className="cursor-pointer flex items-center text-foreground hover:text-rose-500 transition-colors duration-150"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span className="font-medium">{t("settings")}</span>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className={cn(
              "cursor-pointer rounded-md px-3 py-2 font-medium",
              "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20",
              "focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/20",
              "transition-colors duration-150"
            )}
            onClick={async () => {
              await authClient.signOut()
              clearUser()
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t("signOut")}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Unauthenticated user
  return (
    <div className="w-full">
      <Button
        asChild
        size="sm"
        className={cn("gap-2 w-full justify-center", "sm:w-auto sm:justify-start")}
      >
        <Link href="/auth/login">
          <ScanFace className="h-4 w-4" />
          <span>{t("signIn")}</span>
        </Link>
      </Button>
    </div>
  )
}

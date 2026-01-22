import { useLocation, useRouterState } from "@tanstack/react-router"
import { getLocaleName, getPathWithoutLocale, getPrefix } from "intlayer"
import {
  ChevronsUpDown,
  Cog,
  Coins,
  Home,
  Languages,
  LogOut,
  Moon,
  Package,
  Sun,
  Users,
} from "lucide-react"
import { useEffect, useState } from "react"
import { useIntlayer, useLocale } from "react-intlayer"
import { useTheme } from "tanstack-theme-kit"
import logo from "@/logo.svg"
import { LocalizedLink, type To } from "@/shared/components/locale/localized-link"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/shared/components/ui/sidebar"
import { signOut, useSession } from "@/shared/lib/auth/auth-client"

function getInitials(name: string | undefined | null) {
  if (!name) return "U"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function AdminSidebar() {
  const content = useIntlayer("admin")
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const { data: session } = useSession()
  const { pathname } = useLocation()
  const { availableLocales, locale, setLocale } = useLocale()
  const pathWithoutLocale = getPathWithoutLocale(pathname)
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentTheme = theme === "system" ? systemTheme : theme
  const isDark = currentTheme === "dark"

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark")
  }

  const mainNavItems: { title: string; url: To; icon: typeof Users; match: string }[] = [
    {
      title: String(content.sidebar.users.value),
      url: "/admin/users",
      icon: Users,
      match: "/admin/users",
    },
    {
      title: String(content.sidebar.products.value),
      url: "/admin/products",
      icon: Package,
      match: "/admin/products",
    },
    {
      title: String(content.sidebar.creditPackages.value),
      url: "/admin/credit-packages",
      icon: Coins,
      match: "/admin/credit-packages",
    },
  ]

  const isConfigActive = currentPath.includes("/admin/config")

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
            >
              <LocalizedLink to="/">
                <div className="flex items-center justify-center w-7 h-7 p-0.5 bg-black/90 rounded-md">
                  <img
                    src={logo}
                    alt="Logo"
                    className="size-8 invert dark:invert-0"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight group-data-[state=collapsed]:hidden">
                  <span className="truncate font-semibold">{content.title}</span>
                </div>
              </LocalizedLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive = currentPath.includes(item.match)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <LocalizedLink to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </LocalizedLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isConfigActive}
              tooltip={String(content.sidebar.config.value)}
            >
              <LocalizedLink to="/admin/config">
                <Cog />
                <span>{content.sidebar.config}</span>
              </LocalizedLink>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {session?.user && (
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent"
                    tooltip={session.user.name ?? "User"}
                  >
                    <Avatar className="size-8">
                      <AvatarImage
                        src={session.user.image ?? undefined}
                        alt={session.user.name ?? ""}
                      />
                      <AvatarFallback className="text-xs">
                        {getInitials(session.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{session.user.name}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {session.user.email}
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  side="right"
                  align="end"
                  className="min-w-56"
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{session.user.name}</p>
                      <p className="text-xs text-muted-foreground">{session.user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      signOut({ fetchOptions: { onSuccess: () => window.location.reload() } })
                    }
                    className="cursor-pointer text-destructive focus:text-destructive"
                  >
                    <LogOut className="size-4" />
                    <span>{content.sidebar.logout}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          )}
        </SidebarMenu>

        <div className="flex items-center gap-1 border-t px-2 py-1 group-data-[state=collapsed]:justify-center">
          <LocalizedLink
            to="/"
            className="flex size-8 items-center justify-center rounded-md hover:bg-sidebar-accent"
            aria-label="Home"
          >
            <Home className="size-4" />
          </LocalizedLink>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex size-8 items-center justify-center rounded-md hover:bg-sidebar-accent"
                aria-label="Switch language"
              >
                <Languages className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="min-w-32"
            >
              {availableLocales.map((localeEl) => (
                <DropdownMenuItem
                  key={localeEl}
                  asChild
                  className="cursor-pointer"
                >
                  <LocalizedLink
                    onClick={() => setLocale(localeEl)}
                    params={{ locale: getPrefix(localeEl).localePrefix }}
                    to={pathWithoutLocale as To}
                  >
                    <span>{getLocaleName(localeEl)}</span>
                    {locale === localeEl && <span className="ml-auto text-xs">✓</span>}
                  </LocalizedLink>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1" />

          <button
            type="button"
            onClick={toggleTheme}
            disabled={!mounted}
            className="flex size-8 items-center justify-center rounded-md hover:bg-sidebar-accent disabled:opacity-50"
            aria-label="Toggle theme"
          >
            {mounted && isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
          </button>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

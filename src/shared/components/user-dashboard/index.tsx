import { CoinsIcon, MenuIcon, UserIcon } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useIntlayer } from "react-intlayer"
import { Dialog, DialogContent, DialogTitle } from "@/shared/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { useGlobalContext } from "@/shared/context/global.context"
import { cn } from "@/shared/lib/utils"
import { AccountPanel } from "./account-panel"
import { CreditHistoryPanel } from "./credit-history-panel"
import { SettingsPanel } from "./settings-panel"

interface UserDashboardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const UserDashboard = ({ open, onOpenChange }: UserDashboardProps) => {
  const [currentMenuId, setCurrentMenuId] = useState("account")
  const [isOverflowing, setIsOverflowing] = useState(false)
  const tabsRef = useRef<HTMLDivElement>(null)
  const { userInfo } = useGlobalContext()
  const { menu: menuLabels } = useIntlayer("user-dashboard")

  const menu = [
    { id: "account", label: menuLabels.account.value, icon: UserIcon },
    { id: "credit-history", label: menuLabels.usage.value, icon: CoinsIcon },
  ]

  useEffect(() => {
    const checkOverflow = () => {
      if (tabsRef.current) {
        setIsOverflowing(tabsRef.current.scrollWidth > tabsRef.current.clientWidth)
      }
    }
    checkOverflow()
    window.addEventListener("resize", checkOverflow)
    return () => window.removeEventListener("resize", checkOverflow)
  }, [open])

  if (!userInfo?.user) return null

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-w-96 sm:max-w-2xl! md:max-w-4xl! w-full h-[70dvh] md:h-150 flex flex-col md:flex-row p-0 gap-0">
        <DialogTitle className="sr-only">User Dashboard</DialogTitle>

        {/* Mobile header + tabs */}
        <div className="md:hidden p-4 pb-0 space-y-4">
          <h2 className="text-xl font-semibold">{menuLabels.settings.value}</h2>
          <div className="flex items-center border-b">
            <div
              ref={tabsRef}
              className="flex items-center gap-1 overflow-x-auto flex-1"
            >
              {menu.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setCurrentMenuId(item.id)}
                  className={cn(
                    "px-3 py-2 text-sm whitespace-nowrap text-muted-foreground hover:text-foreground transition-colors border-b-2 border-transparent -mb-px",
                    currentMenuId === item.id && "text-foreground border-foreground"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {isOverflowing && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="p-2 text-muted-foreground hover:text-foreground shrink-0"
                    aria-label="More options"
                  >
                    <MenuIcon className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {menu.map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => setCurrentMenuId(item.id)}
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Desktop sidebar */}
        <aside className="hidden md:block w-56 border-r overflow-y-auto p-3 space-y-1">
          {menu.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setCurrentMenuId(item.id)}
              className={cn(
                "flex w-full items-center gap-2 text-sm text-muted-foreground hover:bg-muted/50 px-3 py-2 rounded-md transition-colors",
                currentMenuId === item.id && "text-foreground bg-muted"
              )}
            >
              <item.icon className="size-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Main content */}
        <main className="flex-1 py-6 md:py-8 px-4 md:px-5 overflow-y-auto">
          {currentMenuId === "account" && <AccountPanel />}
          {currentMenuId === "settings" && <SettingsPanel />}
          {currentMenuId === "credit-history" && <CreditHistoryPanel />}
        </main>
      </DialogContent>
    </Dialog>
  )
}

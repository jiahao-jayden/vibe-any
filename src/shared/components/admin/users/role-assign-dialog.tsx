import { useMutation, useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useState } from "react"
import { useIntlayer } from "react-intlayer"
import { Button } from "@/shared/components/ui/button"
import { Calendar } from "@/shared/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog"
import { Label } from "@/shared/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select"
import { http } from "@/shared/lib/tools/http-client"
import { cn } from "@/shared/lib/utils"
import type { AdminRole } from "@/shared/types/admin"

type RoleAssignDialogProps = {
  userId: string
  currentRoleIds: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function RoleAssignDialog({
  userId,
  currentRoleIds,
  open,
  onOpenChange,
  onSuccess,
}: RoleAssignDialogProps) {
  const content = useIntlayer("admin")
  const [selectedRoleId, setSelectedRoleId] = useState<string>("")
  const [expiresAt, setExpiresAt] = useState<Date | undefined>()

  const { data: roles } = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: () => http<AdminRole[]>("/api/admin/roles"),
    enabled: open,
  })

  const availableRoles = roles?.filter((r) => !currentRoleIds.includes(r.id)) ?? []

  const assignMutation = useMutation({
    mutationFn: async () => {
      return http(`/api/admin/users/${userId}/roles`, {
        method: "POST",
        body: JSON.stringify({
          roleId: selectedRoleId,
          expiresAt: expiresAt?.toISOString(),
        }),
      })
    },
    onSuccess: () => {
      onOpenChange(false)
      setSelectedRoleId("")
      setExpiresAt(undefined)
      onSuccess?.()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedRoleId) {
      assignMutation.mutate()
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSelectedRoleId("")
      setExpiresAt(undefined)
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{content.users.assignRole.title}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="role">{content.users.assignRole.selectRole}</Label>
            <Select
              value={selectedRoleId}
              onValueChange={setSelectedRoleId}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder={content.users.assignRole.selectRole} />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map((role) => (
                  <SelectItem
                    key={role.id}
                    value={role.id}
                  >
                    <span className="font-medium">{role.title}</span>
                    {role.description && (
                      <span className="ml-2 text-muted-foreground">({role.description})</span>
                    )}
                  </SelectItem>
                ))}
                {availableRoles.length === 0 && (
                  <div className="py-2 px-2 text-sm text-muted-foreground text-center">-</div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{content.users.assignRole.expiresAt}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expiresAt && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 size-4" />
                  {expiresAt ? format(expiresAt, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-auto p-0"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={expiresAt}
                  onSelect={setExpiresAt}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {content.creditPackages.form.cancel}
            </Button>
            <Button
              type="submit"
              disabled={!selectedRoleId || assignMutation.isPending}
            >
              {content.users.assignRole.confirm}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

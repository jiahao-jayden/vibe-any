# 禁止使用 className 的参数拼接

错误：
```tsx
<div
  className={`fixed ${overlapped ? "bg-transparent" : "bg-black"} text-white py-3 px-4 text-center text-sm h-12`}
>
</div>
````

正确:
```tsx
import { cn } from "@/shared/lib/utils"

<div className={cn("base-class", isActive && "active-class")} />
```

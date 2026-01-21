# 国际化路由规则
你不能使用 tanstack 的 `<Link>` 组件，因为它无法处理国际化，正确的做法是:
```tsx
import { LocalizedLink, type To } from "@/shared/components/locale/localized-link"

<LocalizedLink to="/">
```

如果需要函数式跳转，应该使用 `useLocalizedNavigate`:

```ts
import { useLocalizedNavigate } from "@/shared/hooks/use-localized-navigate"

const navigate = useLocalizedNavigate()
```

import { createFileRoute, Outlet } from "@tanstack/react-router"
import { defineI18nUI } from "fumadocs-ui/i18n"
import { RootProvider } from "fumadocs-ui/provider/tanstack"
import { i18n } from "@/shared/lib/i18n"

const { provider } = defineI18nUI(i18n, {
  translations: {
    zh: {
      displayName: "中文",
      search: "搜索文档",
      searchNoResult: "没有找到结果",
      toc: "目录",
      tocNoHeadings: "没有标题",
      lastUpdate: "最后更新",
      chooseLanguage: "选择语言",
      nextPage: "下一页",
      previousPage: "上一页",
      chooseTheme: "选择主题",
      editOnGithub: "在 GitHub 上编辑",
    },
    en: {
      displayName: "English",
    },
  },
})

export const Route = createFileRoute("/{-$locale}/docs")({
  component: RouteComponent,
})

function RouteComponent() {
  const { locale } = Route.useParams()

  return (
    <RootProvider i18n={provider(locale)}>
      <Outlet />
    </RootProvider>
  )
}

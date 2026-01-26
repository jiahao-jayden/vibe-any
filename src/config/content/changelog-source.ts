import { changelog } from "fumadocs-mdx:collections/server"
import { loader } from "fumadocs-core/source"
import { toFumadocsSource } from "fumadocs-mdx/runtime/server"
import { i18n } from "@/shared/lib/i18n"

export type ChangelogFrontmatter = {
  title: string
  description?: string
  date: Date
  version?: string
  published: boolean
  tags: string[]
}

export const changelogSource = loader({
  baseUrl: "/changelog",
  source: toFumadocsSource(changelog, []),
  i18n,
})

export type ChangelogEntry = {
  slug: string
  path: string
  title: string
  date: string
  version?: string
  tags: string[]
}

export function getChangelogs(lang?: string): ChangelogEntry[] {
  const language = lang || i18n.defaultLanguage
  const pages = changelogSource.getPages(language)

  return pages
    .filter((page) => (page.data as ChangelogFrontmatter).published !== false)
    .map((page) => {
      const data = page.data as ChangelogFrontmatter
      return {
        slug: page.slugs.join("/"),
        path: page.path,
        title: data.title,
        date: data.date.toISOString(),
        version: data.version,
        tags: data.tags || [],
      }
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

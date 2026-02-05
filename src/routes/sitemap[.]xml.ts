import fs from "node:fs"
import path from "node:path"
import { createFileRoute } from "@tanstack/react-router"
import intlayerConfig from "@/../intlayer.config"

const BASE_URL = process.env.VITE_APP_URL || "http://localhost:3377"
const LOCALES = intlayerConfig.internationalization?.locales ?? ["en", "zh"]
const DEFAULT_LOCALE = intlayerConfig.internationalization?.defaultLocale ?? "en"

type ChangeFreq = "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never"

interface PageInfo {
  path: string
  changeFrequency: ChangeFreq
  priority: number
}

const STATIC_ROUTES: PageInfo[] = [
  { path: "", changeFrequency: "daily", priority: 1.0 },
  { path: "blog", changeFrequency: "daily", priority: 0.8 },
  { path: "waitlist", changeFrequency: "weekly", priority: 0.8 },
  { path: "changelog", changeFrequency: "weekly", priority: 0.7 },
  { path: "roadmap", changeFrequency: "weekly", priority: 0.7 },
  { path: "chat", changeFrequency: "weekly", priority: 0.6 },
  { path: "login", changeFrequency: "monthly", priority: 0.4 },
]

const CONTENT_CONFIG: Record<string, { changeFrequency: ChangeFreq; priority: number }> = {
  blog: { changeFrequency: "weekly", priority: 0.7 },
  docs: { changeFrequency: "weekly", priority: 0.8 },
  legal: { changeFrequency: "yearly", priority: 0.3 },
  changelog: { changeFrequency: "monthly", priority: 0.6 },
}

function scanContentDir(contentType: string, urlPrefix: string): PageInfo[] {
  const contentDir = path.join(process.cwd(), `content/${contentType}`)
  const pages: PageInfo[] = []
  const config = CONTENT_CONFIG[contentType] ?? { changeFrequency: "monthly", priority: 0.5 }
  const seenSlugs = new Set<string>()

  if (!fs.existsSync(contentDir)) return pages

  function scan(dir: string, basePath: string = "") {
    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      const name = entry.name

      if (entry.isDirectory()) {
        if (["categories", "authors", "meta"].includes(name)) continue
        scan(fullPath, basePath ? `${basePath}/${name}` : name)
      } else if (entry.isFile() && name.endsWith(".mdx")) {
        // Extract slug: remove .mdx and locale suffix (.en, .zh)
        const slug = name.replace(/\.(en|zh)?\.mdx$/, "").replace(/\.mdx$/, "")
        const uniqueKey = basePath ? `${basePath}/${slug}` : slug

        // Skip if already processed
        if (seenSlugs.has(uniqueKey)) continue
        seenSlugs.add(uniqueKey)

        if (slug === "index") {
          if (basePath) {
            pages.push({ path: `${urlPrefix}/${basePath}`, ...config })
          }
        } else {
          const pagePath = basePath ? `${urlPrefix}/${basePath}/${slug}` : `${urlPrefix}/${slug}`
          pages.push({ path: pagePath, ...config })
        }
      }
    }
  }

  scan(contentDir)
  return pages
}

function generateSitemap(): string {
  const today = new Date().toISOString().split("T")[0]

  const allPages: PageInfo[] = [
    ...STATIC_ROUTES,
    ...scanContentDir("blog", "blog"),
    ...scanContentDir("docs", "docs"),
    ...scanContentDir("legal", "legal"),
    ...scanContentDir("changelog", "changelog"),
  ]

  const pageMap = new Map<string, PageInfo>()
  for (const page of allPages) {
    if (!pageMap.has(page.path)) {
      pageMap.set(page.path, page)
    }
  }

  const pages = Array.from(pageMap.values()).sort((a, b) => b.priority - a.priority)

  const urlEntries: string[] = []

  for (const page of pages) {
    for (const locale of LOCALES) {
      const loc = page.path ? `${BASE_URL}/${locale}/${page.path}` : `${BASE_URL}/${locale}`

      const hreflangLinks = LOCALES.map((l) => {
        const href = page.path ? `${BASE_URL}/${l}/${page.path}` : `${BASE_URL}/${l}`
        return `      <xhtml:link rel="alternate" hreflang="${l}" href="${href}"/>`
      })

      const defaultHref = page.path
        ? `${BASE_URL}/${DEFAULT_LOCALE}/${page.path}`
        : `${BASE_URL}/${DEFAULT_LOCALE}`
      hreflangLinks.push(
        `      <xhtml:link rel="alternate" hreflang="x-default" href="${defaultHref}"/>`
      )

      urlEntries.push(`    <url>
      <loc>${loc}</loc>
      <lastmod>${today}</lastmod>
      <changefreq>${page.changeFrequency}</changefreq>
      <priority>${page.priority.toFixed(1)}</priority>
${hreflangLinks.join("\n")}
    </url>`)
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlEntries.join("\n")}
</urlset>`
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const xml = generateSitemap()

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, s-maxage=86400",
          },
        })
      },
    },
  },
})

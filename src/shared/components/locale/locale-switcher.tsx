import { useLocation } from "@tanstack/react-router"
import { getLocaleName, getPathWithoutLocale, getPrefix } from "intlayer"
import { useLocale } from "react-intlayer"
import { Button } from "@/shared/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu"
import { cn } from "@/shared/lib/utils"
import { LocalizedLink, type To } from "./localized-link"

const localeToCountry: Record<string, string> = {
  en: "US",
  "en-US": "US",
  "en-GB": "GB",
  zh: "CN",
  "zh-Hans": "CN",
  "zh-Hant": "TW",
  "zh-CN": "CN",
  "zh-TW": "TW",
  ja: "JP",
  ko: "KR",
  fr: "FR",
  de: "DE",
  es: "ES",
  pt: "PT",
  "pt-BR": "BR",
  ru: "RU",
  it: "IT",
}

const getLanguageFlag = (lang: string): string => {
  const country = localeToCountry[lang]
  if (!country) return "🌐"
  const codePoints = country
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

export const LocaleSwitcher = () => {
  const { pathname } = useLocation()
  const { availableLocales, locale, setLocale } = useLocale()
  const pathWithoutLocale = getPathWithoutLocale(pathname)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 select-none cursor-pointer"
          aria-label="Switch language"
        >
          <span className="text-base leading-none">{getLanguageFlag(locale)}</span>
          <span className="hidden sm:inline">{getLocaleName(locale)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-35"
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
              className={cn("flex items-center gap-2 w-full", locale === localeEl && "bg-muted")}
            >
              <span className="text-base leading-none">{getLanguageFlag(localeEl)}</span>
              <span>{getLocaleName(localeEl)}</span>
            </LocalizedLink>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

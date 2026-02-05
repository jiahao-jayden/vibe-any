import { createServerFn } from "@tanstack/react-start"
import { configResolver, type PublicConfig } from "@/config/dynamic-config"
import { getConfigs } from "@/shared/model/config.model"

export const getConfigFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicConfig> => {
    try {
      const dbConfigs = await getConfigs()
      const values = configResolver.resolveAllConfigs(dbConfigs)
      const publicConfigs = configResolver.filterPublicConfigs(values)
      return publicConfigs as PublicConfig
    } catch (error) {
      console.error("[getConfigFn] Failed to fetch config:", error)
      const defaultValues = configResolver.resolveAllConfigs({})
      return configResolver.filterPublicConfigs(defaultValues) as PublicConfig
    }
  }
)

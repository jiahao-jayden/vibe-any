import { type Dictionary, t } from "intlayer"

export default {
  key: "app",
  content: {
    links: {
      about: t({ en: "About", zh: "关于" }),
      home: t({ en: "Home", zh: "首页" }),
    },
    meta: {
      title: t({
        en: "Welcome to Intlayer + TanStack Router",
        zh: "欢迎使用 Intlayer + TanStack Router",
      }),
      description: t({
        en: "This is an example of using Intlayer with TanStack Router",
        zh: "这是一个使用 Intlayer 和 TanStack Router 的示例",
      }),
    },
  },
} satisfies Dictionary

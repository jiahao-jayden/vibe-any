import { type Dictionary, t } from "intlayer"

export default {
  key: "not-found",
  content: {
    title: t({
      en: "Boo! Page missing!",
      zh: "哎呀！页面不见了！",
    }),
    description: t({
      en: "Whoops! This page must be a ghost - it's not here!",
      zh: "糟糕！这个页面像幽灵一样消失了！",
    }),
    home: t({
      en: "Find shelter",
      zh: "返回首页",
    }),
  },
} satisfies Dictionary

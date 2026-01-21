import { type Dictionary, t } from "intlayer"

export default {
  key: "admin",
  content: {
    title: t({ en: "Admin Dashboard", zh: "管理后台" }),
    welcome: t({ en: "Welcome to the admin panel", zh: "欢迎来到管理面板" }),
    sidebar: {
      users: t({ en: "Users", zh: "用户" }),
    },
    users: {
      title: t({ en: "User Management", zh: "用户管理" }),
      description: t({
        en: "View and manage all registered users",
        zh: "查看和管理所有注册用户",
      }),
      count: t({ en: "users", zh: "位用户" }),
      empty: t({ en: "No users yet", zh: "暂无用户" }),
      emptyDesc: t({
        en: "Users will appear here once they sign up",
        zh: "用户注册后将显示在这里",
      }),
      verified: t({ en: "Verified", zh: "已验证" }),
      unverified: t({ en: "Unverified", zh: "未验证" }),
      table: {
        name: t({ en: "Name", zh: "用户名" }),
        email: t({ en: "Email", zh: "邮箱" }),
        status: t({ en: "Status", zh: "状态" }),
        createdAt: t({ en: "Created At", zh: "注册时间" }),
      },
    },
  },
} satisfies Dictionary

interface AbilityRule {
  permissionCode: string
  inverted: boolean
  conditions?: {
    ownOnly?: boolean
    fields?: string[]
  }
}

export class PermissionChecker {
  private rules: AbilityRule[]

  constructor(rules: AbilityRule[]) {
    this.rules = rules
  }

  // CASL style: can(action, resource)
  can(
    action: string,
    resource: string,
    context?: { userId?: string; ownerId?: string; field?: string }
  ): boolean {
    const code = `${resource}:${action}`

    // traverse from back to front, the later defined rules have higher priority (CASL semantic)
    for (let i = this.rules.length - 1; i >= 0; i--) {
      const rule = this.rules[i]

      // match permission code (supports wildcard)
      if (!this.matchCode(rule.permissionCode, code)) continue

      // check conditions
      if (rule.conditions) {
        // ownOnly: can only operate on own resources
        if (rule.conditions.ownOnly && context?.userId !== context?.ownerId) {
          continue
        }
        // fields: field permission
        if (rule.conditions.fields && context?.field) {
          if (!rule.conditions.fields.includes(context.field)) continue
        }
      }

      // match success, return whether it is can (not inverted)
      return !rule.inverted
    }

    return false // default reject
  }

  // CASL style: cannot
  cannot(action: string, resource: string, context?: any): boolean {
    return !this.can(action, resource, context)
  }

  private matchCode(pattern: string, code: string): boolean {
    if (pattern === "*") return true
    if (pattern === code) return true
    if (pattern.endsWith(":*")) {
      const prefix = pattern.slice(0, -2)
      return code.startsWith(prefix + ":")
    }
    return false
  }
}

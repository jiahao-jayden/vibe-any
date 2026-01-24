import { CodeTabs } from "../animate-ui/components/code-tabs"

export const CommandTab = (props: { code: string }) => {
  const generateCommand = (command: string) => {
    return {
      npm: `npx ${command}`,
      pnpm: `pnpm dlx ${command}`,
      yarn: `yarn dlx ${command}`,
      bun: `bunx ${command}`,
    }
  }
  return (
    <CodeTabs
      className="font-jetbrains-mono"
      codes={generateCommand(props.code)}
    />
  )
}

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export function formatEnv(env: string) {
  return env[0]?.toUpperCase() + env.slice(1)
}

export const kebabCaseRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/



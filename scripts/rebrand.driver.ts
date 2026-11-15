/**
 * Applies the NoHarness fork policy to the whole working tree.
 *
 * The fork tracks upstream and merges it, so this script is the policy step after every upstream
 * merge: rules are ordered and idempotent, and a second run rewrites nothing. `--check` lists the
 * paths a run would rename and the files it would rewrite, and exits non-zero without touching the
 * tree.
 *
 * Upstream spellings are assembled from fragments so this file is never rewritten by its own
 * rules, and the file itself is excluded from the walk.
 *
 * What keeps the upstream name because it is an upstream interface: the `DeepSeek AI` and
 * `DeepSeek API` product names, the `deepseek-*` provider and model identifiers (`deepseek-official`,
 * `deepseek-v4-flash`, `deepseek-messages`, `DEEPSEEK_API_KEY`, the `llm-deepseek*`,
 * `web-deepseek-api`, `deepseek-account`, `deepseek-chat-import` and `deepseek-llm-api-extensions`
 * packages), and the upstream repository link in the fork credit.
 */
import { readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Text aliases for the brand tokens. Fragments keep this file out of its own rules. */
const upstreamName = 'Deep' + 'Seek'
const upstreamLower = 'deep' + 'seek'
const upstreamCli = 'd' + 's' + 'h'
const upstreamCliUpper = 'D' + 'S' + 'H'
const forkName = 'No' + 'Harness'
const forkLower = 'no' + 'harness'
const forkCli = 'n' + 'h' + 's'
const forkCliUpper = 'N' + 'H' + 'S'
const forkOwner = 'levanza1358'

const root = fileURLToPath(new URL('..', import.meta.url))
const self = fileURLToPath(import.meta.url)
const skipDirs = new Set(['.git', 'node_modules', 'lib', 'dist', 'coverage', '.cache', '__pycache__'])

/**
 * Decodes file bytes, rejecting anything that is not valid UTF-8. `ignoreBOM` keeps a leading byte
 * order mark in the decoded text so rewriting a file never drops it.
 */
const utf8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true })

/** Upstream repository path, kept in the fork credit. */
const upstreamRepoPath = 'https://github.com/' + upstreamLower + '-ai/' + upstreamLower + '-harness'

/**
 * Packages upstream publishes to npm under its own scope. The fork consumes them as third-party
 * dependencies, so their names stay upstream's; only the workspace package that wraps them is
 * renamed. `node-addon-system-workspace` is the one name in this family the fork owns.
 */
const externalScopeGuard =
  '(?!libreoffice-kit|node-addon-system(?!-workspace))'

/** The fork credit line exactly as it is written in the fork docs. */
const UPSTREAM_CREDIT = 'forked from [' + upstreamName + ' Harness](' + upstreamRepoPath + ')'

/**
 * Matches a credit line that no longer names upstream, which a merge reintroduces, and replaces the
 * whole line so the restored wording survives the brand rules.
 */
const rebrandedCredit = /forked from \[[^\]]*\]\(https:\/\/[^) ]*\)/g

/**
 * Restores the credit line a merge may have reintroduced under a stale wording.
 * @param text - File content about to be rebranded.
 * @returns The content with the upstream credit line in place.
 */
const restoreCredit = (text: string): string =>
  text.replace(rebrandedCredit, (match: string) => (match === UPSTREAM_CREDIT ? match : UPSTREAM_CREDIT))

/**
 * Ordered content rules. Each rule is anchored on word boundaries so a second run is a no-op, and
 * the `deepseek-*` provider and model identifiers are excluded by lookahead rather than by a
 * placeholder, so no marker can survive into the tree.
 */
const contentRules: [RegExp, string][] = [
  // The fork's own repository, before the product slug rule rewrites the path segment.
  [new RegExp('github\\.com/' + upstreamLower + '-ai/' + upstreamLower + '-harness', 'g'), 'github.com/' + forkOwner + '/' + forkLower],
  [new RegExp('github\\.com/' + upstreamLower + '-ai(?![\\w/-])', 'g'), 'github.com/' + forkOwner],
  // The upstream product slug, in every spelling the tree uses.
  [new RegExp('(?<![\\w-])' + upstreamLower + '_harness_runtime(?![\\w-])', 'g'), forkLower + '_runtime'],
  [new RegExp('(?<![\\w-])' + upstreamLower + '_harness(?![\\w-])', 'g'), forkLower],
  [new RegExp('(?<![\\w])' + upstreamLower + 'harness', 'g'), forkLower],
  [new RegExp('(?<![\\w-])' + upstreamLower + '-harness(?![A-Za-z0-9_])', 'g'), forkLower],
  [new RegExp('(?<![\\w-])' + upstreamLower + '-ai/' + forkLower, 'g'), forkOwner + '/' + forkLower],
  [new RegExp(upstreamName + ' Harness', 'g'), forkName],
  [new RegExp(upstreamName + 'Harness', 'g'), forkName],
  // The slugified npm scope that heading anchors and fixture paths use.
  [new RegExp('(?<![\\w])' + upstreamLower + '-ai-' + externalScopeGuard, 'g'), forkLower + '-'],
  [new RegExp('(?<![\\w-])' + upstreamLower + '-ai' + upstreamCli + '-', 'g'), forkLower + forkCli + '-'],
  // The npm scope, including the vendored packages and the pnpm store path form.
  [new RegExp('@' + upstreamLower + '-ai/' + upstreamCli + 's?(?![\\w-])', 'g'), '@' + forkLower + '/cli'],
  [new RegExp('@' + upstreamLower + '-ai/' + upstreamCli + '-', 'g'), '@' + forkLower + '/'],
  [new RegExp('@' + upstreamLower + '-ai/' + externalScopeGuard, 'g'), '@' + forkLower + '/'],
  [new RegExp('@' + upstreamLower + '-ai\\+', 'g'), '@' + forkLower + '+'],
  [new RegExp('@' + upstreamLower + '-ai(?![\\w/-])', 'g'), '@' + forkLower],
  // The CLI token. The word-boundary rules below cannot see a token that follows an escape
  // sequence, a URL-encoded slash, an identifier separator, or a camelCase prefix, so each of
  // those contexts gets its own rule ahead of them.
  [new RegExp('_' + upstreamCliUpper, 'g'), '_' + forkCliUpper],
  [new RegExp('(?<=[a-z])' + upstreamCliUpper + '(?=[A-Z])', 'g'), forkCliUpper],
  [new RegExp('\\\\0' + upstreamCliUpper, 'g'), '\\0' + forkCliUpper],
  [new RegExp('\\\\n' + upstreamCliUpper, 'g'), '\\n' + forkCliUpper],
  [new RegExp('\\\\uFEFF' + upstreamCliUpper, 'g'), '\\uFEFF' + forkCliUpper],
  [new RegExp('/D' + upstreamCliUpper, 'g'), '/D' + forkCliUpper],
  [new RegExp('(?<![\\w])' + upstreamCliUpper + '(?=\\w)', 'g'), forkCliUpper],
  [new RegExp('(?<![\\w])' + upstreamCliUpper + '(?![\\w])', 'g'), forkCliUpper],
  [new RegExp('_' + upstreamCli, 'g'), '_' + forkCli],
  [new RegExp('\\\\0' + upstreamCli, 'g'), '\\0' + forkCli],
  [new RegExp('%2F' + upstreamCli, 'g'), '%2F' + forkCli],
  [new RegExp('%2f' + upstreamCli, 'g'), '%2f' + forkCli],
  [new RegExp(upstreamCli + '-app://', 'g'), forkCli + '-app://'],
  [new RegExp(upstreamCli + '(?=> )', 'g'), forkCli],
  [new RegExp('(?<![\\w])' + upstreamCli + '(?=\\w)', 'g'), forkCli],
  [new RegExp('(?<![\\w])' + upstreamCli + '\\.cua', 'g'), forkCli + '.cua'],
  [new RegExp('(?<![\\w])' + upstreamCli + '(?=@\\d)', 'g'), forkCli],
  [new RegExp('(?<![\\w])' + upstreamCli + '-', 'g'), forkCli + '-'],
  [new RegExp('(?<![\\w])' + upstreamCli + '(?![\\w-])', 'g'), forkCli],
]

/**
 * Upstream repositories the fork links to but does not own. The CLI token rule rewrites their path
 * segment, so the original name is restored after the content rules run.
 */
const restoreRules: [RegExp, string][] = [
  [
    new RegExp('github\\.com/' + upstreamLower + '-ai/' + forkCli + '-libreoffice-kit', 'g'),
    'github.com/' + upstreamLower + '-ai/' + upstreamCli + '-libreoffice-kit',
  ],
  [
    new RegExp('(?<![\\w@/-])' + forkLower + '/libreoffice-kit', 'g'),
    upstreamLower + '-harness/libreoffice-kit',
  ],
]

/**
 * Applies every content rule, then restores the fork credit so the upstream link survives them.
 * @param text - File content to rebrand.
 * @returns The rebranded content.
 */
export const transform = (text: string): string => {
  let out = text
  for (const [pattern, replacement] of contentRules) out = out.replace(pattern, replacement)
  for (const [pattern, replacement] of restoreRules) out = out.replace(pattern, replacement)
  return restoreCredit(out)
}

/**
 * Renames files and directories whose name carries a brand token. Each path segment goes through
 * the same rules as file content, so a renamed file never disagrees with the links that point at it.
 * @param check - Report the paths a run would rename instead of renaming them.
 * @returns The number of paths that were, or would be, renamed.
 */
const renamePaths = (check: boolean): number => {
  const stale: string[] = []
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (skipDirs.has(entry.name)) continue
      const source = join(dir, entry.name)
      const name = transform(entry.name)
      const target = name === entry.name ? source : join(dir, name)
      if (target !== source) {
        stale.push(source.slice(root.length))
        if (!check) renameSync(source, target)
      }
      if (entry.isDirectory()) walk(check ? source : target)
    }
  }
  walk(root)
  for (const path of stale) console.log(`rebrand: ${check ? 'stale' : 'renamed'} ${path}`)
  console.log(`rebrand: ${check ? 'needs renaming' : 'renamed'} ${stale.length} paths`)
  return stale.length
}

/**
 * Walks the tree, rewriting every text file whose content rules match.
 * @param check - Report the files a run would rewrite instead of writing them.
 * @returns The number of files that were, or would be, rewritten.
 */
const rebrand = (check: boolean): number => {
  const stale: string[] = []
  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue
      const target = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (skipDirs.has(entry.name)) continue
        walk(target)
        continue
      }
      if (target === self) continue
      let raw: string
      try {
        raw = utf8.decode(readFileSync(target))
      } catch {
        continue
      }
      const next = transform(raw)
      if (next === raw) continue
      stale.push(target.slice(root.length))
      if (!check) writeFileSync(target, next)
    }
  }
  walk(root)
  for (const file of stale) console.log(`rebrand: ${check ? 'stale' : 'rewrote'} ${file}`)
  console.log(`rebrand: ${check ? 'needs rewriting' : 'rewrote'} ${stale.length} files`)
  return stale.length
}

if (import.meta.main) {
  const check = process.argv.includes('--check')
  const renamed = renamePaths(check)
  const stale = rebrand(check)
  if (check && renamed + stale > 0) process.exitCode = 1
}

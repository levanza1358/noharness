# Loadable Harness plugin packages

This file is GENERATED from workspace manifests (`scripts/gen-plugin-packages.ts`) and verified fresh by `pnpm run verify-plugin-packages` (part of `doc-sync`); do not edit it by hand.

Every package below exports a Cordis plugin that a bundle patch can name in a Loader row. `Config` marks packages whose row accepts a `config` mapping; read the mounted schema from `Config.listConfigs` through `cordis_inspect_query` (filter by `name`, then query the `entry` id) when available, otherwise from the package README. Packages under `experimental` are pre-stable.

## acp

| Package | Config | Description |
|---|---|---|
| `@noharness/acp` | yes | Automation-only Agent Client Protocol server for driving NoHarness agents over JSON-RPC stdio |

## api

| Package | Config | Description |
|---|---|---|
| `@noharness/api-gateway` | yes | Typert Remote Host dispatcher and Client API endpoint |
| `@noharness/api-job-controller` | yes | Job Remote observation stream and the reference-counted client job-output service |
| `@noharness/api-remote-access` | no | Method-level Remote access control for non-owner Peers and the per-Peer access snapshot |
| `@noharness/api-remotes` | no | Remote BFF assembly for application-selected Host capabilities |
| `@noharness/api-session-controller` | yes | Session Remote commands, cold reads, and live control transport |
| `@noharness/api-settings-controller` | yes | Remote owner for the configuration surfaces over the settings-domain seams |
| `@noharness/api-terminal-controller` | yes | Session-owned interactive terminals with shell discovery, screen recovery and typed Remote control |
| `@noharness/api-workspace-controller` | yes | Workspace Remote commands and reconnect-safe state transport |
| `@noharness/api-workspace-files` | yes | Workspace file service and Client resource provider: bounded reads, directory listing, and live metadata over the workspaceFiles Remote namespace |

## attachment

| Package | Config | Description |
|---|---|---|
| `@noharness/attachment-local` | yes | Private content-addressed NHS_HOME attachment storage |

## boot

| Package | Config | Description |
|---|---|---|
| `@noharness/config-editor` | no | Persist plugin configuration through profile patches and Loader reconciliation |
| `@noharness/hmr` | yes | Coordinated module and profile configuration hot reload |
| `@noharness/plugin-manager` | yes | Current-profile plugin and bundle management shared by nhs CLI, Web and agent tools |
| `@noharness/plugin-market` | yes | Configured plugin market indexes for the Web Discover page and the plugin_market agent tool |

## browser-use

| Package | Config | Description |
|---|---|---|
| `@noharness/browser-use` | no | Exclusive named browser-use provider registration |

## bundle

| Package | Config | Description |
|---|---|---|
| `@noharness/acp-app` | no | The nhs ACP profile bundle: automation-only JSON-RPC stdio and process lifecycle over nhs-base |
| `@noharness/headless` | yes | The nhs one-shot bundle: a direct core Agent/Session runner over nhs-base with no Host, HTTP, or browser layer |
| `@noharness/sdk-app` | yes | The nhs SDK profile bundle: stdio JSON-RPC serving and process lifecycle over nhs-base |
| `@noharness/web-app` | yes | The nhs browser-surface bundle: the web patch layer over nhs-base plus the runtime glue plugin (frontend dist serving, bash runtime variables, URL line) |

## client

| Package | Config | Description |
|---|---|---|
| `@noharness/client-connection` | yes | Authenticated RPC transport and generation lifecycle |
| `@noharness/client-file-upload` | no | Agent-scoped browser file upload, streaming intake, and staged receipt service |
| `@noharness/client-hmr` | yes | Web client graph synchronization and rebuilt-bundle reload transport |
| `@noharness/client-locale` | no | Locale plugin: Host-backed preference, extensible language catalog, browser fallback, and typed built-in dictionaries |
| `@noharness/client-modules` | no | Client module system, dual-face: node half composes the __NHS_BOOT__ entry graph (incremental nhs.client scan, bundle route, index tap, webPlugins service); browser half is the lazy-CJS module table the vendored cordis Loader consumes as its internal seam |
| `@noharness/client-product-analytics` | yes | Desktop product event collection and authenticated Host reporting |
| `@noharness/client-resources` | no | Unified client resource model: protocol-registered providers turn URL addresses into live values, consumed through the useResource global standard hook |
| `@noharness/client-script-realm` | no | Direct-reference script environments and Cordis-owned provider registration |
| `@noharness/client-script-realm-iframe` | no | Optional iframe ScriptRealm provider |
| `@noharness/client-shortcuts` | yes | Application keyboard command registry and physical-key routing |
| `@noharness/client-ui-account-notifications` | yes | Display account notifications and refresh localized content |
| `@noharness/client-ui-agent-preset` | no | Agent-preset surfaces: the default for later sessions, this session's seat, and the composition editor |
| `@noharness/client-ui-agent-team` | no | Web shared task board for a subagent tree |
| `@noharness/client-ui-approval` | no | Approval composer takeover over the scoped Remote Event waterfall |
| `@noharness/client-ui-attachment` | no | Dynamic attachment presentation plugin for conversation input, message-image, and trajectory image slots |
| `@noharness/client-ui-brand-official` | no | Official NoHarness brand artwork and click-triggered home background |
| `@noharness/client-ui-chat` | no | Chat Conversation target, node definitions, renderers, and details surface |
| `@noharness/client-ui-commands` | no | Client command surface: global directory cache, '/' source, three command UI kinds, popupSelect registry |
| `@noharness/client-ui-context-menu` | no | Typed, plugin-extensible context menus with captured targets and shared Web presentation |
| `@noharness/client-ui-conversation` | no | Target-neutral Conversation assembly, shell, composer, queue, and view navigation |
| `@noharness/client-ui-deliverables` | no | Changed-files card with per-file comparison tabs, delivery cards, and clickable final-response file references for Web |
| `@noharness/client-ui-directory-picker-browse` | no | In-app directory browsing surface: the workspace directory-flow owner rendering the host's listing and creation primitives |
| `@noharness/client-ui-directory-picker-native` | no | Native directory-picker surface: the renderless workspace directory-flow occupant driving the local Desktop or Host OS chooser |
| `@noharness/client-ui-entry-customization` | no | Customize plugin entries in the left sidebar, conversation views, and right sidebar, and quickly create new plugins. |
| `@noharness/client-ui-file-actions` | no | Original-file saving and image clipboard actions for Web and Desktop |
| `@noharness/client-ui-file-drag` | no | Application-owned file drag transfers and localized failure feedback |
| `@noharness/client-ui-goal` | no | Session goal surface: GoalBar docked above the composer, read from the goal session projection |
| `@noharness/client-ui-input-trigger` | no | Input trigger pipeline: '/' and '@' detection, candidate menu, pick routing to registered sources |
| `@noharness/client-ui-jobs` | no | Session-header background-job list with on-demand streaming record panels |
| `@noharness/client-ui-layout` | no | Shell plugin: three-column AppFrame with drag handles, ctx.layout viewing-state service (navigation + panels) |
| `@noharness/client-ui-message-feedback` | no | The Web feedback surface: per-message Like/Dislike in the assistant-message action strip and the feedback dialog behind both ratings and /feedback, backed by the messageFeedback and sessionFeedback Host Remotes |
| `@noharness/client-ui-model-selection` | no | Model selection over the shared model catalog, Session projection, and session.selectModel |
| `@noharness/client-ui-open-in-app` | no | Session application submenus and native opening controls for directories and previewed files |
| `@noharness/client-ui-permission-presets` | no | Permission surfaces: a new-session default in General settings and a current-session /permission popup over the permissions projection |
| `@noharness/client-ui-plan` | no | Plan mode controls, persistent transcript plan cards, and sidebar Markdown previews |
| `@noharness/client-ui-plugin-manager` | yes | Plugin management for the nhs web client: the sidebar Plugins panel installs, enables, disables, retries, and composes installed plugin packages |
| `@noharness/client-ui-plugin-market` | no | Discover tab of the nhs web Plugins page: browse configured plugin market indexes and install their bundles |
| `@noharness/client-ui-reference` | no | Unified Web @file and @session reference source |
| `@noharness/client-ui-renderer` | no | Browser UI renderer: React slot bindings, ctx.uiRenderer, and the assembled application root |
| `@noharness/client-ui-schedule` | no | Host task management page and Session reminder catalog |
| `@noharness/client-ui-secret-mask` | no | Web display masking for recognized credentials in sent user text |
| `@noharness/client-ui-session` | no | Session Controller adapter for React and session-scoped slots |
| `@noharness/client-ui-session-status` | no | Client Session status table over Host reading records: running state, the effective pending interaction, and read or unread reminders shared by clients of one Host |
| `@noharness/client-ui-settings` | no | Settings domain base plugin: shared configuration forms and the canonical settings slot-type contract |
| `@noharness/client-ui-settings-account` | yes | Manage DeepSeek login and open Platform billing pages |
| `@noharness/client-ui-settings-agent-loop` | no | Settings page of the agent loop on the nhs web client's Plugins page: the parallel tool-call cap of the agent-loop namespace |
| `@noharness/client-ui-settings-general` | no | Settings ownerless-copy and product onboarding plugin: the General section, shell trigger/header chrome content, settings dictionaries, and the versioned welcome notice |
| `@noharness/client-ui-settings-models` | yes | Models settings and shared product-onboarding dialogs over existing settings and credential joins |
| `@noharness/client-ui-settings-plugin-inventory` | no | Read-only Cordis Loader inventory tab in Web Plugins settings |
| `@noharness/client-ui-settings-plugins` | no | Built-in plugins settings section for the nhs web client: the Settings navigation entry and the tab chrome feature-owned tabs register into |
| `@noharness/client-ui-settings-session-log` | no | General settings control for Session-log upload with DeepSeek API requests |
| `@noharness/client-ui-settings-shell` | no | Settings page of the shell executor on the nhs web client's Plugins page: the command timeout and the per-stream output cap of the shell namespace |
| `@noharness/client-ui-settings-subagent` | no | Settings page of Subagent delegation on the nhs web client's Plugins page: recursion depth, parallel capacity, and the models agents may choose for subagents |
| `@noharness/client-ui-settings-web-search` | no | Settings page for web search and fetch on the nhs web client's Plugins page: the Search and Fetch provider menus, the DeepSeek Search API result count, DeepSeek Search and Fetch API billing, and legacy Messages search settings |
| `@noharness/client-ui-shortcuts` | no | Keyboard shortcut reference, recording, and local preference editing |
| `@noharness/client-ui-sidebar` | no | Sidebar plugin: session multi-level tree, search, grouping, state dots |
| `@noharness/client-ui-sidebar-browser` | no | Sandboxed Web browser tabs for the right Sidebar |
| `@noharness/client-ui-sidebar-documentpreview` | yes | Extensible Sidebar previews for Office documents, spreadsheets, Markdown, code, images, PDF, HTML, and plain text |
| `@noharness/client-ui-sidebar-files` | no | The workspace files page and one workspace directory tree per pane beside docked and floating file previews, listed lazily over the workspaceFiles Remote namespace |
| `@noharness/client-ui-sidebar-right` | no | Right Sidebar: the docking surface's session-bound state, its panel and header expand control, and the navigation service over it |
| `@noharness/client-ui-sidebar-terminal` | no | Interactive shell tabs for the right Sidebar |
| `@noharness/client-ui-skill` | no | Web skill references and the dedicated skill tool row |
| `@noharness/client-ui-subagent` | no | Subagent conversation catalog, continuation routing UI, and '@' reference source |
| `@noharness/client-ui-theme` | yes | Theme plugin: Host bootstrap for the pre-plugin palette; ThemeRuntime for light/dark/system state and icon replacements; --dsw-* token styles and Appearance settings row |
| `@noharness/client-ui-tool` | no | Client Tool call-tree renderer and keyed per-tool presentation slot |
| `@noharness/client-ui-trajectory` | yes | Trajectory event ledger and timing overview with live tool-result inspection |
| `@noharness/client-ui-user-questions` | no | Web ask_user_question composer takeover and plan-review presentation UI |
| `@noharness/client-ui-workflow-run` | no | Durable workflow-run Conversation Node and nested member disclosure for nhs web |
| `@noharness/client-ui-workspace` | no | Workspace picker plugin: one WorkspacePicker registered into the sidebar and empty-state workspace slots |

## compaction

| Package | Config | Description |
|---|---|---|
| `@noharness/command-compact` | no | Human-facing slash command for explicit session compaction |
| `@noharness/compaction-basic` | yes | Token-meter-driven compaction policy and LLM summarization backend for the NoHarness |
| `@noharness/compaction-image-offload` | no | Durable image offload for image-capable routes: replace over-budget request images with placeholders and retry |
| `@noharness/compaction-tool-result-pruner` | yes | Replay-safe model-free head/middle/tail pruning for tool-result surface nodes |

## computer-use

| Package | Config | Description |
|---|---|---|
| `@noharness/computer-use` | no | Exclusive named computer-use provider registration |

## context

| Package | Config | Description |
|---|---|---|
| `@noharness/agent-instructions` | yes | Workspace context loader for AGENTS.md/CLAUDE.md instruction files |
| `@noharness/file-reference-local` | yes | Local-filesystem ctx.fileReferences provider with bounded fuzzy indexes |
| `@noharness/harness-dev-context` | no | Model context naming the NoHarness checkout and Web GUI URL without letting either change the system prompt |
| `@noharness/session-reference` | yes | Cross-session snapshot references and durable untrusted model context (ctx.sessionReferenceResolver) |
| `@noharness/time-context` | yes | Durable per-step context with the current time and elapsed time |
| `@noharness/tmux-context` | yes | Opt-in durable per-step context with this agent's tmux pane and window location |

## core

| Package | Config | Description |
|---|---|---|
| `@noharness/agent` | no | Agent interface, registry, initiator scope, and event vocabulary for the NoHarness |
| `@noharness/agent-default-model` | yes | Default model selection shared by Agent entry points |
| `@noharness/agent-loop` | yes | The concrete agent loop plugin for the NoHarness |
| `@noharness/agent-tool-presentation` | yes | Deprecated tool presentation selector; use nhs-tool-executor-native or nhs-tool-executor-ptc directly |
| `@noharness/session` | no | Event-sourced session store for the NoHarness |
| `@noharness/system-prompt` | yes | System prompt assembly registry for the NoHarness |
| `@noharness/tool-executor-native` | no | Native tool execution plugin |
| `@noharness/tool-executor-ptc` | yes | PTC program execution, tool bindings, and generated SDK prompts |
| `@noharness/tools` | no | Tool registry and execution pipeline for the NoHarness |

## credentials

| Package | Config | Description |
|---|---|---|
| `@noharness/authorization` | no | Authorization seam (ctx.authorization): plugin-owned flows that obtain a credential through a conversation with the human |
| `@noharness/credentials-local` | yes | File-backed credentials provider ($NHS_HOME/.env under the live process environment) for the NoHarness |
| `@noharness/deepseek-account` | yes | Sign in to DeepSeek and manage account credentials and notifications |

## deliverables

| Package | Config | Description |
|---|---|---|
| `@noharness/deliverable-file-references` | no | Shared model guidance for file links and deliverables across NoHarness hosts |
| `@noharness/tool-present` | yes | Explicit workspace file delivery declarations for the NoHarness |
| `@noharness/workspace-changes` | yes | Per-turn workspace file changes recorded from git working-tree snapshots and whole-file captures, with per-file comparisons, for the NoHarness |

## document

| Package | Config | Description |
|---|---|---|
| `@noharness/office-kit` | yes | Shared Office rendering, conversion, and recalculation with bounded queues and caching |
| `@noharness/tool-office` | yes | Model-facing Office tools for rendering, converting, and recalculating documents |

## experimental

| Package | Config | Description |
|---|---|---|
| `@noharness/action-cards` | yes | Optional action cards below answers: one shared proposal tool, card state, user actions and status notices |
| `@noharness/client-ui-action-cards` | no | Action cards below completed answers: the shared card frame, kind bodies and the compact tool row |
| `@noharness/client-ui-creation-recommendations` | no | Body of the personalized page card: location choice, creation progress, Undo and Restore |
| `@noharness/client-ui-plugin-recommendations` | no | Official plugin card body with catalog text and enabling |
| `@noharness/creation-recommendations` | no | Create persistent removable interface plugins from explicit conversation needs |
| `@noharness/cua` | no | Shared Computer Use application objects, authorization, and logged tool execution |
| `@noharness/cua-macos` | yes | macOS native provider for shared Computer Use application and window objects |
| `@noharness/cua-mcp` | yes | Computer Use as an MCP stdio server: a nhs profile bundle that exposes cua_run_code to external agent harnesses |
| `@noharness/cua-windows` | yes | Windows C# computer use through shared application and window objects |
| `@noharness/deepseek-chat-import` | yes | Import DeepSeek chat exports as stored Sessions in a chosen Workspace |
| `@noharness/experimental-api-speech-to-text` | yes | Authenticated experimental speech transcription for browser clients |
| `@noharness/experimental-auto-review` | no | Per-tool LLM authorization review for the NoHarness Auto permission preset |
| `@noharness/experimental-browser-use-chrome-devtools-mcp` | yes | Experimental per-Session Chromium browser tools through chrome-devtools-mcp |
| `@noharness/experimental-browser-use-playwright-mcp` | yes | Experimental per-Session Chromium browser tools through @playwright/mcp |
| `@noharness/experimental-browser-use-stagehand-native` | yes | Experimental Stagehand browser tools with separately configured native models |
| `@noharness/experimental-claude-code-mods` | yes | Experimental bridge: load Claude Code mods (hooks modules) and run their hook chains on NoHarness extension points |
| `@noharness/experimental-client-ui-claude-code-mods` | no | Web band above the prompt for Claude Code mods: draws each session's mod tree and sends button presses back to the bridge |
| `@noharness/experimental-client-ui-cot-translation` | yes | Optional machine translation of expanded reasoning, preserving original Session text |
| `@noharness/experimental-client-ui-forge` | yes | Sidebar panel for a Session's change requests, with a worktree option for new Sessions and its Host Remote |
| `@noharness/experimental-client-ui-stats` | no | Per-turn and per-step context, timing, cache, and tool-cost table contributed as an experimental conversation View |
| `@noharness/experimental-client-ui-voice-input` | no | Record speech and insert editable text into the conversation draft |
| `@noharness/experimental-computer-use-cua-driver-mcp` | yes | Experimental computer use through an installed Cua Driver MCP executable |
| `@noharness/experimental-computer-use-cua-driver-native` | no | Experimental computer-use provider embedding the Cua Driver native npm SDK |
| `@noharness/experimental-forge` | yes | Provider-neutral change request registry with shared status polling |
| `@noharness/experimental-forge-github` | yes | GitHub provider for the experimental forge registry, read through the GitHub CLI on the host |
| `@noharness/experimental-forge-session` | yes | Binds change requests to the Session that created, pushed, or tracked them |
| `@noharness/experimental-inspector` | yes | Experimental cross-realm CDP hub for Host debugging and Client Runtime inspection |
| `@noharness/experimental-session-inspector` | no | Experimental virtualized Session log and live Chat group/node inspectors |
| `@noharness/experimental-speech-to-text` | yes | Experimental speech recognition with independently selectable providers |
| `@noharness/experimental-speech-to-text-sensevoice` | yes | Local SenseVoice ONNX transcription with a managed sherpa-onnx process |
| `@noharness/experimental-subagent-oar` | yes | Experimental one-shot subagents through OAR runtimes |
| `@noharness/experimental-tool-subagent-oar` | yes | Delegate standalone tasks to configured external subagent providers |
| `@noharness/experimental-tool-worktree` | no | Model tool that creates and enters a new Git worktree |
| `@noharness/experimental-translator` | yes | Machine translation with reusable Session results |
| `@noharness/experimental-worktree` | yes | Creates a named Git worktree and changes the calling Session working directory |
| `@noharness/hooks-claude-code` | yes | Bridge plugin: run a Claude Code hooks.json / settings hook config on the NoHarness interception seams |
| `@noharness/hooks-codex` | yes | Bridge plugin: run a Codex hooks.json hook config on the NoHarness interception seams |
| `@noharness/plugin-recommendations` | no | Official plugin suggestions with explicit user activation and persistent conversation decisions |
| `@noharness/session-title-all-prompts-llm` | yes | All-user-messages LLM provider plugin for NoHarness session titles |
| `@noharness/skill-badge` | no | Bundled nhs badge skill provider for NoHarness |
| `@noharness/terminal-panel` | yes | Persistent Agent terminals shown in the Web sidebar, plus read-only access to the user's terminals |
| `@noharness/timeline` | yes | Replace Todo in long-running sessions with task trees, a live progress bar, and timed reports |
| `@noharness/tool-ralph` | yes | Model-facing fresh-agent Ralph loop over the workflow and subagent seams |
| `@noharness/tool-session-query` | yes | Workspace-authorized model-facing session history search, trace, and event read tools |
| `@noharness/tool-terminal` | yes | Six model-facing persistent PTY tools with owner isolation and generic background-job integration |
| `@noharness/webhook` | no | Fire-and-forget webhook rule runtime that creates Workspace-backed NoHarness Sessions |
| `@noharness/webhook-github` | yes | Signed GitHub HTTP webhook adapter for the NoHarness webhook runtime |

## extensions

| Package | Config | Description |
|---|---|---|
| `@noharness/client-ui-cordis` | no | Cordis dynamic-plugin definition card: the keyed cordis_define tool row with its run/stop switch |
| `@noharness/cordis-client-runner` | no | Browser half of dynamic dual-half plugin packages: event subscription, closure evaluation, guard facade, and loader entries |
| `@noharness/cordis-host-runner` | yes | Dynamic package definition registry, host-half sandbox lifecycle, and invoke handler table for model-mounted dual-half packages |
| `@noharness/tool-cordis` | no | Read-only runtime API inspection for Harness plugin development |

## feedback

| Package | Config | Description |
|---|---|---|
| `@noharness/command-feedback` | no | Log-only session feedback: the record event, the sessionFeedback Host Remote, and the human-facing slash command |
| `@noharness/message-feedback` | yes | Canonical Session-log ratings and notes for finalized assistant messages |

## fs

| Package | Config | Description |
|---|---|---|
| `@noharness/fs-local` | yes | Local-filesystem implementation of the NoHarness filesystem seam (ctx.fs) |
| `@noharness/fs-observation-policy` | no | File-context policy plugin for the NoHarness — observed-state, read-before-edit, and version-guarded write/edit added over the ctx.fs provider seam through the fs/* event gate (no service API) |
| `@noharness/fs-sandbox` | yes | Sandbox-enforcing implementation of the NoHarness filesystem seam: fences write/edit by the per-call sandbox mode (read-only denies mutation, workspace-write contains it to the workspace + temp roots) while reads pass through |
| `@noharness/tool-fs` | yes | Model-facing filesystem tools (read, write, edit) over the NoHarness filesystem seam (ctx.fs) |
| `@noharness/tool-fs-search` | yes | Model-facing filesystem discovery tools (glob, grep) backed by the packaged ripgrep binary (@vscode/ripgrep) |
| `@noharness/tool-str-replace-editor` | yes | Model-facing view, create, literal replace, and line insert tool over the Harness filesystem service |

## goal

| Package | Config | Description |
|---|---|---|
| `@noharness/command-goal` | no | Human-facing slash command for persisted same-session goals |
| `@noharness/goal` | yes | Event-sourced same-session goal state and lifecycle service for the NoHarness |
| `@noharness/goal-round-driver` | no | Race-fenced same-session goal-round driver |
| `@noharness/tool-goal` | yes | Model-facing same-session goal tools with execution-time authority checks |

## guard

| Package | Config | Description |
|---|---|---|
| `@noharness/repeat-tool-reminder` | yes | Repeat-tool-call guard plugin: advisory reminders when an agent loops on identical tool calls |
| `@noharness/tool-call-timeout-policy` | no | Tool-call timeout policy: a tools/execute wrapper that arms a per-tool deadline on exec.signal and returns TOOL_TIMEOUT when it wins |

## host

| Package | Config | Description |
|---|---|---|
| `@noharness/host-authentication-desktop` | yes | Desktop private-channel authentication provider |
| `@noharness/host-authentication-token` | yes | Default token authentication provider and HTTP cookie exchange |
| `@noharness/host-directory-picker-auto` | no | Adaptive chooser of the directory-picker seam: resolves the host situation at boot and mounts the native or browse backend for the NoHarness web GUI host |
| `@noharness/host-directory-picker-browse` | yes | In-app browsing backend of the directory-picker seam (listing/creation primitives over the host filesystem) |
| `@noharness/host-directory-picker-native` | no | Native-OS-chooser backend of the directory-picker seam for the NoHarness web GUI host |
| `@noharness/host-frontend-static` | yes | SPA dist server for the Web shell: owns the webserver fallback seat, serving explicit index entries and static assets with traversal rejection and 404 misses |
| `@noharness/host-open-in-app` | yes | Host half of open-in-app: resolved application catalog, icons, and the launch endpoint as three webServer routes |
| `@noharness/host-plugin-inventory` | no | Read-only Remote projection of current Cordis Loader plugin state |
| `@noharness/host-product-telemetry-otel` | yes | Explicit product usage events exported through OpenTelemetry HTTP logs |
| `@noharness/host-webserver` | yes | Web route-registration plugin: HTTP and upgrade routes, per-Peer index transform taps, and static dist fallback |

## interaction

| Package | Config | Description |
|---|---|---|
| `@noharness/commands` | no | Plugin-owned human command registry for NoHarness UIs |
| `@noharness/permission-presets` | yes | User-facing permission presets (ctx.permissionPresets) for the NoHarness: one product-level Permissions select bundling the sandbox-mode and approval-policy knobs, written through to their own session events |
| `@noharness/tool-ask-user` | yes | Model-facing ask_user_question tool over the ctx.userQuestions seam |
| `@noharness/user-approval` | yes | User-approval seam (ctx.approval) for the NoHarness: one-shot permission decisions dispatched to composed answerers over the approval/request waterfall, fail-closed by default |
| `@noharness/user-questions` | no | Abstract user-questions seam (ctx.userQuestions) for asking the human during agent runs |

## jobs

| Package | Config | Description |
|---|---|---|
| `@noharness/jobs-local` | yes | Process-local implementation of the NoHarness background job registry seam |
| `@noharness/tool-jobs` | yes | Model-facing background job control tools (job_output, job_list, job_kill) over the ctx.jobs registry |

## llm

| Package | Config | Description |
|---|---|---|
| `@noharness/deepseek-llm-api-extensions` | no | Additive request-field registry for the official DeepSeek LLM API adapter |
| `@noharness/llm` | no | Provider-neutral LLM service interface for the NoHarness |
| `@noharness/llm-deepseek-account` | yes | DeepSeek account provider authentication and discovery |
| `@noharness/llm-deepseek-api-key` | yes | DeepSeek api-key provider authentication and discovery |
| `@noharness/llm-pi-ai` | yes | pi-ai-backed DeepSeek adapter for the NoHarness LLM seam (design-verification twin of nhs-llm-deepseek) |
| `@noharness/llm-retry` | yes | Provider-routed LLM request retry policy for the NoHarness |
| `@noharness/plugin-package-inventory-deepseek` | yes | Active Loader-backed plugin package inventory for official DeepSeek LLM API requests |
| `@noharness/token-meter` | yes | Replay-aware token measurement service (ctx.tokenMeter) for the NoHarness |

## lsp

| Package | Config | Description |
|---|---|---|
| `@noharness/lsp` | no | Abstract LSP capability seam (ctx.lsp) for the NoHarness — language-server provider registry keyed by branded id and extension mapping, order-independent per-query selection, normalized definition/references/implementation/hover requests and results, and the LspError taxonomy |
| `@noharness/lsp-stdio` | yes | Generic stdio language-server provider for the NoHarness LSP capability seam (ctx.lsp) — spawns configured servers, translates JSON-RPC, and serves transient-open goToDefinition/findReferences/goToImplementation/hover queries in the host filesystem namespace |
| `@noharness/tool-lsp` | yes | Model-facing lsp tool over the NoHarness LSP capability seam (ctx.lsp) — one read-only tool with goToDefinition/findReferences/goToImplementation/hover operations, one-based UTF-16 cursor coordinates, bounded location rendering, and hover normalization |

## mcp

| Package | Config | Description |
|---|---|---|
| `@noharness/mcp-client` | yes | MCP client bridge: connects to MCP servers and registers their tools on ctx.tools |
| `@noharness/mcp-manager` | yes | MCP server manager: a settings-driven fleet of mcp-client instances with runtime status, restart, and probe |
| `@noharness/mcp-resources` | no | Scoped MCP resource discovery and reading through shared model tools |

## plan

| Package | Config | Description |
|---|---|---|
| `@noharness/plan-mode` | yes | Logged per-agent plan mode with deployment guidance, a direct slash command, and a user-reviewed exit |

## preset

| Package | Config | Description |
|---|---|---|
| `@noharness/agent-preset` | yes | Declare an Agent capability composition in Cordis YAML |
| `@noharness/agent-preset-registry` | yes | Declarative Agent preset registry and profile-backed editing |
| `@noharness/persona` | yes | Composition-authored deployment persona section for the NoHarness |

## ptc-runtime

| Package | Config | Description |
|---|---|---|
| `@noharness/ptc-runtime-node` | yes | Node PTC execution with async function, REPL, scoped REPL and VM Script evaluators and optional retained state |

## sandbox

| Package | Config | Description |
|---|---|---|
| `@noharness/sandbox-local` | yes | Local process-sandbox backends for the NoHarness sandbox seam: bwrap, the npm-distributed landlock-run launcher, macOS Seatbelt, or the Windows ACL restricted-token runner — functionally probed, fail-closed |
| `@noharness/sandbox-policy` | yes | Per-call sandbox policy resolver and current model context: deployment fallbacks plus each session's mode and workspace root, shared by every enforcing capability family |

## schedule

| Package | Config | Description |
|---|---|---|
| `@noharness/schedule` | yes | Host-wide durable reminders with shared management and delivery to existing or new Sessions |
| `@noharness/tool-schedule` | no | Model-facing scheduled task tools (schedule_create, schedule_list, schedule_view, schedule_edit) over the Host ctx.schedule service |

## sdk

| Package | Config | Description |
|---|---|---|
| `@noharness/sdk-jsonrpc-server` | yes | Stdio JSON-RPC server plugin for out-of-process NoHarness SDK clients |

## session

| Package | Config | Description |
|---|---|---|
| `@noharness/message-quotes` | no | Selected-text quotation and Markdown blockquote presentation |
| `@noharness/session-checkpoint-policy` | no | Semantic session durability checkpoints before model requests and tool side effects |
| `@noharness/session-log-deepseek` | yes | Incremental lossless session-log request extension for the official DeepSeek LLM API |
| `@noharness/session-persistence-jsonl` | yes | JSONL durable session persistence backend for the NoHarness |
| `@noharness/session-projection` | no | Session-projection seam: the merge-extensible projection type table, the provider contract, and the ctx.sessionProjections registry serving whole current values of log-derived per-session state |
| `@noharness/session-projection-cache` | yes | Persisted projection cache (ctx.sessionProjectionCache): durable per-session checkpoint records on the session_projcache storage domain (per-record layout), throttled write-behind, and the cached listing read |
| `@noharness/session-stats` | no | Whole-log conversation counts and wall times projection (sessionStats) for the NoHarness |
| `@noharness/session-telemetry-otel` | yes | Feedback-authorized Session logs over byte-bounded OpenTelemetry HTTP requests |
| `@noharness/session-title` | yes | Log-backed session title service and provider registry for the NoHarness |
| `@noharness/session-title-first-prompt-llm` | yes | First-message LLM provider plugin for NoHarness session titles |
| `@noharness/session-turn-outline` | no | Whole-log turn outline projection (turnOutline) for the NoHarness |
| `@noharness/tool-working-directory` | no | Read and change the active Session working directory |
| `@noharness/working-directory` | yes | Session working directories with durable changes and model context |

## session-query

| Package | Config | Description |
|---|---|---|
| `@noharness/session-log-export` | yes | Web Session-log ZIP export and Session Markdown copy |
| `@noharness/session-query-sqlite` | yes | Concrete ctx.sessionQuery backend with SQLite FTS5 search |

## settings

| Package | Config | Description |
|---|---|---|
| `@noharness/settings` | no | Abstract user-settings seam (ctx.settings) for the NoHarness |

## shell

| Package | Config | Description |
|---|---|---|
| `@noharness/bash-local` | yes | Local-subprocess implementation of the NoHarness bash executor seam |
| `@noharness/bash-sandbox` | yes | Sandbox-consuming implementation of the NoHarness bash executor seam (confines every command via ctx.sandbox, reports denial/enforcement result facts) |
| `@noharness/pwsh-local` | yes | Local PowerShell implementation of the NoHarness bash executor seam |
| `@noharness/pwsh-sandbox` | yes | Sandbox-consuming implementation of the NoHarness PowerShell executor seam (confines every command via ctx.sandbox, reports denial/enforcement result facts) |
| `@noharness/shell-env` | yes | Tool-independent managed NHS_* shell environment registry |
| `@noharness/tool-bash` | yes | Model-facing bash tool with optional generic background-job and sandbox-escalation support |
| `@noharness/tool-bash-persistent` | yes | Model-facing owner-scoped persistent Bash tool backed by the Harness PTY service |
| `@noharness/tool-pwsh` | yes | Model-facing pwsh tool over the bash executor seam |
| `@noharness/tool-pwsh-persistent` | yes | Model-facing owner-scoped persistent PowerShell tool backed by the Harness PTY service |

## skill

| Package | Config | Description |
|---|---|---|
| `@noharness/skill` | yes | Agent skill provider registry for the NoHarness |
| `@noharness/skill-filesystem` | yes | Local filesystem skill provider for the NoHarness |
| `@noharness/skill-office` | yes | Bundled Word, PowerPoint, and Excel workflows and Office operation guidance |
| `@noharness/tool-skill` | yes | Model-facing skill loading tool for the NoHarness |
| `@noharness/tool-workspace-dependencies` | yes | The load_workspace_dependencies tool: absolute paths into a bundled Python, Node.js, and pnpm payload |

## spill

| Package | Config | Description |
|---|---|---|
| `@noharness/spill-local` | yes | Local-filesystem implementation of the NoHarness spill storage seam (private session-scoped files) |
| `@noharness/spill-policy` | yes | Token-budgeted tool-result retention with recoverable text and image paths |

## ssh

| Package | Config | Description |
|---|---|---|
| `@noharness/fs-ssh` | no | Filesystem provider over the shared POSIX SSH helper |
| `@noharness/sandbox-ssh` | no | Remote POSIX sandbox argv provider over the shared SSH helper |
| `@noharness/ssh` | yes | Shared OpenSSH connection and versioned POSIX remote helper |
| `@noharness/subprocess-ssh` | no | Subprocess and terminal provider over the shared POSIX SSH helper |

## storage

| Package | Config | Description |
|---|---|---|
| `@noharness/storage` | no | Storage hub (ctx.storage): named backend registry plus mounted data-form facilities for the NoHarness |
| `@noharness/storage-domain` | yes | Domain data form (ctx.storage.domain): schema-validated, event-emitting KV domains over storage backends for the NoHarness |
| `@noharness/storage-json` | yes | JSON file KV storage backend for the NoHarness storage hub |
| `@noharness/storage-sqlite` | yes | SQLite storage backend (kv facet) for the NoHarness storage hub |

## subagent

| Package | Config | Description |
|---|---|---|
| `@noharness/subagent` | yes | Abstract subagent seam (ctx.subagents): named-provider registry for delegating to child agents |
| `@noharness/subagent-acp` | yes | Out-of-process ACP subagent backend: drives a child agent in a spawned subprocess over the Agent Client Protocol |
| `@noharness/subagent-claude-code` | yes | One-shot Claude Code subagent provider over the official Agent SDK |
| `@noharness/subagent-codex` | yes | One-shot Codex subagent provider over the official app-server protocol |
| `@noharness/subagent-nhs-sdk` | yes | Out-of-process SDK subagent backend: drives a child NoHarness runtime subprocess over stdio JSON-RPC through the TypeScript SDK client |
| `@noharness/subagent-fork-in-process` | yes | In-process fork subagent backend: runs a child agent seeded with a prefix of the parent's log |
| `@noharness/subagent-spawn-in-process` | yes | In-process spawn subagent backend: runs a fresh child agent on ctx.agents |
| `@noharness/tool-subagent` | yes | Model-facing subagent delegation tool over the ctx.subagents seam |
| `@noharness/tool-subagent-control` | yes | Shared messaging, interruption, and child discovery tools for subagents |

## subprocess

| Package | Config | Description |
|---|---|---|
| `@noharness/subprocess-local` | no | Local-subprocess implementation of the NoHarness subprocess seam |

## team

| Package | Config | Description |
|---|---|---|
| `@noharness/agent-team` | yes | Shared task DAG and change waits for subagent trees |
| `@noharness/tool-agent-team` | yes | Scoped model-facing Agent Teams tools over ctx.agentTeams |

## telemetry

| Package | Config | Description |
|---|---|---|
| `@noharness/otel` | no | Cordis service for independent ordinary-event and byte-bounded Session-log OTLP channels |

## terminal

| Package | Config | Description |
|---|---|---|
| `@noharness/terminal` | no | Persistent PTY session seam for the NoHarness — owner-scoped ids, backend registry, interactive sends, reads, signals, and awaited cleanup |
| `@noharness/terminal-bash` | yes | Persistent shell PTY backend over the NoHarness subprocess terminal primitive |

## test-support

| Package | Config | Description |
|---|---|---|
| `@noharness/llm-replay` | yes | Replay LLM plugin: short-circuits llm/stream with model chunks reconstructed from a recorded session JSONL (keyless snapshot tests) |

## todo

| Package | Config | Description |
|---|---|---|
| `@noharness/tool-todo` | yes | Model-facing todo_write tool over the NoHarness event-sourced session log |

## typert

| Package | Config | Description |
|---|---|---|
| `@noharness/typert-loader` | yes | Loader integration for generated Typert package contributions |

## web

| Package | Config | Description |
|---|---|---|
| `@noharness/tool-web` | yes | Model-facing web tools (web_search, web_fetch) over the NoHarness web capability seam (ctx.web) |
| `@noharness/web` | yes | Abstract web access capability seam (ctx.web) for the NoHarness — search/fetch provider registry, registration-order-independent selection, request/result vocabulary, and the WebError taxonomy |
| `@noharness/web-deepseek-api` | yes | DeepSeek Search and Fetch API providers for the NoHarness web capability seam (ctx.web) |
| `@noharness/web-fetch-http` | yes | Anonymous HTTP(S) fetch provider for the NoHarness web capability seam (ctx.web) |
| `@noharness/web-search-deepseek` | yes | DeepSeek-backed search provider (native web_search via the Anthropic-compatible API) for the NoHarness web capability seam (ctx.web) |

## workflow

| Package | Config | Description |
|---|---|---|
| `@noharness/tool-workflow` | yes | Model-facing workflow tool: run a JavaScript orchestration script over ctx.workflowEngine |
| `@noharness/workflow-ptc` | yes | Workflow orchestration in the shared sandboxed Node PTC runtime |

## workspace

| Package | Config | Description |
|---|---|---|
| `@noharness/workspace` | no | Workspace entity registry (ctx.workspaceRegistry): durable workspace records with validated session attachment over the domain data form for the NoHarness |

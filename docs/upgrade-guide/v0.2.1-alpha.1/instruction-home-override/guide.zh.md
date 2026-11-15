---
kind: upgrade-guide
description: "`agent-instructions` 行不再接受 `nhsHome`；指令加载始终从 `$NHS_HOME` 或 `~/.nhs` 解析 harness home。"
---

# 指令加载只解析一个 harness home

[English](guide.md) | 中文

## 变更

`@noharness/agent-instructions` 移除了 `nhsHome` 配置字段。该插件通过 `@noharness/home-paths` 的 `resolveDshHome()` 解析 harness home，与 harness 其他消费方一致：`$NHS_HOME` 已设置且非空白时以它为准，否则使用 `~/.nhs`，并展开波浪号。

`cordis.yml`、profile patch 或 `--patch` overlay 中 `agent-instructions` 行上残留的 `nhsHome` 不再有任何效果：该行会保留这个多余键，插件忽略它，指令加载跟随进程 home。其他 provider（如 `nhs-skill-filesystem`、`nhs-shell-env`）保留各自的 home 字段；本次删除只覆盖指令加载器。

## 迁移

1. 从 `cordis.yml`、`$NHS_HOME/cordis.patch.yml`、`$NHS_HOME/profiles/<profile>/cordis.patch.yml` 以及任何 `--patch` overlay 的 `agent-instructions` 行中删除 `nhsHome`。
2. 若该覆盖原本指向非默认 home，改为在进程中导出 `NHS_HOME`，让所有 harness 消费方读取同一个 home。
3. 用 `nhs --profile <profile> --dump-config` 确认 `agent-instructions` 行只剩其余字段，并确认新会话的首次请求在该文件存在时显示 `Instructions from: $NHS_HOME/AGENTS.md`（或 `~/.nhs/AGENTS.md`）。

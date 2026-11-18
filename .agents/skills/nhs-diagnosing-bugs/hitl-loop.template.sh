#!/usr/bin/env bash
# Human-in-the-loop reproduction loop.
# Copy this file, edit the steps below, and run it.
# The agent runs the script; the user follows the prompts in their terminal.
#
# Usage: bash hitl-loop.template.sh
#
# step "<instruction>"        show an instruction, wait for Enter
# capture VAR "<question>"    show a question, read the answer into VAR
#
# Captured values print as KEY=VALUE at the end for the agent to parse.
# Capture observations only; leave signing in to the user as a step.

set -euo pipefail

step() {
  printf '\n>>> %s\n' "$1"
  read -r -p "    [Enter when done] " _
}

capture() {
  local var="$1" question="$2" answer
  printf '\n>>> %s\n' "$question"
  read -r -p "    > " answer
  printf -v "$var" '%s' "$answer"
}

# --- edit below ---------------------------------------------------------

step "Launch the desktop app and open Settings from the sidebar."

capture OPENED "Did Settings fill the middle column with the sidebar still visible? (y/n)"

capture SYMPTOM "Describe what happened instead (or 'none'):"

# --- edit above ---------------------------------------------------------

printf '\n--- Captured ---\n'
printf 'OPENED=%s\n' "$OPENED"
printf 'SYMPTOM=%s\n' "$SYMPTOM"

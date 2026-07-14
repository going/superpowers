#!/usr/bin/env bash
# Compute a wayfinder map's frontier: the open, unblocked, unclaimed tickets.
#
# Usage: frontier.sh <map-dir>
#   e.g. frontier.sh docs/superpowers/wayfinder/2026-07-14-billing-multi-provider
#
# A ticket is takeable when it is open, every id in its blocked-by is closed,
# and claimed-by is empty. Joining blocked-by against status by eye is the step
# that goes wrong quietly, so it is done here instead.

set -euo pipefail

MAP_DIR="${1:-}"
if [[ -z "$MAP_DIR" ]]; then
  echo "usage: frontier.sh <map-dir>" >&2
  exit 2
fi

TICKETS="$MAP_DIR/tickets"
if [[ ! -d "$TICKETS" ]]; then
  echo "no tickets/ directory under $MAP_DIR" >&2
  exit 2
fi

shopt -s nullglob
files=("$TICKETS"/*.md)
if [[ ${#files[@]} -eq 0 ]]; then
  echo "no tickets yet — map is freshly charted"
  exit 0
fi

# field <file> <name> — value of a frontmatter key, empty if absent/blank.
field() {
  sed -n "s/^$2:[[:space:]]*//p" "$1" | head -1 | sed 's/[[:space:]]*$//'
}

closed=" "
for f in "${files[@]}"; do
  [[ "$(field "$f" status)" == "closed" ]] && closed+="$(field "$f" id) "
done

frontier=() blocked=() claimed=() done_=()

for f in "${files[@]}"; do
  id=$(field "$f" id)
  title=$(field "$f" title)
  type=$(field "$f" type)
  status=$(field "$f" status)
  claim=$(field "$f" claimed-by)
  raw=$(field "$f" blocked-by)

  label="$id  $title  [$type]"

  if [[ "$status" == "closed" ]]; then
    done_+=("$label")
    continue
  fi

  # blocked-by: [001, 002] -> "001 002"
  deps=$(printf '%s' "$raw" | tr -d '[],' )

  waiting=""
  for d in $deps; do
    [[ "$closed" == *" $d "* ]] || waiting+="$d "
  done

  if [[ -n "$waiting" ]]; then
    blocked+=("$label  ← waiting on ${waiting% }")
  elif [[ -n "$claim" ]]; then
    claimed+=("$label  ← claimed by $claim")
  else
    frontier+=("$label")
  fi
done

show() {
  printf '\n%s\n' "$1"
  shift
  if [[ $# -eq 0 ]]; then
    printf '  (none)\n'
  else
    printf '  %s\n' "$@"
  fi
}

# ${arr[@]+"${arr[@]}"} — expand to nothing when empty; bash 3.2 (macOS) treats a
# bare "${empty[@]}" as an unbound variable under set -u.
show "FRONTIER — takeable now:" ${frontier[@]+"${frontier[@]}"}
show "BLOCKED:" ${blocked[@]+"${blocked[@]}"}
show "CLAIMED — another session is on these:" ${claimed[@]+"${claimed[@]}"}
show "CLOSED:" ${done_[@]+"${done_[@]}"}

if [[ ${#frontier[@]} -eq 0 && ${#blocked[@]} -eq 0 && ${#claimed[@]} -eq 0 ]]; then
  printf '\nNo open tickets. If Not-yet-specified is also empty, the way is clear —\nhand off to writing-plans.\n'
fi

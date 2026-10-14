#!/usr/bin/env bash
set -e
fail=0
check() {
  if grep -RInE "$1" app components lib widget/src --include=*.ts --include=*.tsx --include=*.css 2>/dev/null | grep -v node_modules >/dev/null; then
    echo "✗ $2"
    grep -RInE "$1" app components lib widget/src --include=*.ts --include=*.tsx --include=*.css 2>/dev/null | grep -v node_modules | head
    fail=1
  else
    echo "✓ $2"
  fi
}
check "material-symbols|Material Symbols|material-icons" "No Material Symbols"
check "surface-container|on-surface|on-primary|primary-container|outline-variant" "No MD3 tokens"
check "text-accent\\b" "No bordeaux text"
check "#ffb2ba|#FFB2BA" "No MD3 pink"
check "©\\s*2025" "No © 2025"
check "ada-002|OpenAI embedding" "No wrong embedding label"
check "font-family:\\s*['\"]?(Inter|Roboto|Arial)" "No foreign fonts"
exit $fail

#!/usr/bin/env bash
# Prueba la clave de la Meta Model API sin Supabase ni la app.
# Uso:  read -s MODEL_API_KEY && export MODEL_API_KEY   # pega la clave (no se ve) y Enter
#       ./scripts/muse-smoke-test.sh [es|en]
set -euo pipefail
: "${MODEL_API_KEY:?Exporta MODEL_API_KEY primero}"
LANG_CODE="${1:-es}"
BASE="${MUSE_BASE_URL:-https://api.meta.ai/v1}"
MODEL="${MUSE_MODEL:-muse-spark-1.3}"

echo "→ Modelos disponibles para tu equipo:"
curl -sS "$BASE/models" -H "Authorization: Bearer $MODEL_API_KEY" | grep -o '"id":"[^"]*"' | sed 's/"id"://' || true

echo "→ Pidiendo 5 palabras ($LANG_CODE) a $MODEL…"
curl -sS "$BASE/chat/completions" \
  -H "Authorization: Bearer $MODEL_API_KEY" -H "Content-Type: application/json" \
  -d @- <<JSON
{
  "model": "$MODEL",
  "reasoning_effort": "low",
  "max_completion_tokens": 4000,
  "response_format": {"type": "json_schema", "json_schema": {"name": "lexia_words", "strict": true, "schema": {
    "type": "object", "additionalProperties": false, "required": ["candidates"],
    "properties": {"candidates": {"type": "array", "items": {"type": "object", "additionalProperties": false,
      "required": ["word", "definition", "hint"],
      "properties": {"word": {"type": "string"}, "definition": {"type": "string"}, "hint": {"type": "string"}}}}}}}},
  "messages": [
    {"role": "developer", "content": "Propose 5 common words of EXACTLY 5 letters in language '$LANG_CODE', uppercase, no accents, with a short definition and an indirect hint in that language."},
    {"role": "user", "content": "Theme: animals."}
  ]
}
JSON
echo

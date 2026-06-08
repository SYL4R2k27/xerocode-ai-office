#!/bin/bash
set -e
export $(grep -v "^#" ~/ai-office/backend/.env | xargs)

echo "PING ALL MODELS - $(date)"
echo "========================="

ping_model() {
  local name="$1" url="$2" key="$3" body="$4" proxy="$5"
  local pf=""
  [ "$proxy" = "y" ] && pf="--socks5 127.0.0.1:10808"
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 $pf -X POST "$url" \
    -H "Authorization: Bearer $key" -H "Content-Type: application/json" -d "$body" 2>/dev/null)
  [ "$CODE" = "200" ] && echo "  OK $name" || echo "  FAIL $name ($CODE)"
}

echo ""
echo "-- OPENAI (proxy) --"
for m in gpt-5.4-mini gpt-5-mini gpt-4o-mini gpt-4.1-nano o4-mini; do
  ping_model "$m" "https://api.openai.com/v1/chat/completions" "$OPENAI_API_KEY" \
    "{\"model\":\"$m\",\"messages\":[{\"role\":\"user\",\"content\":\"p\"}],\"max_tokens\":3}" "y"
done

echo ""
echo "-- ANTHROPIC (proxy) --"
for m in claude-haiku-4-5-20251001 claude-sonnet-4-5-20250514; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 --socks5 127.0.0.1:10808 \
    -X POST "https://api.anthropic.com/v1/messages" \
    -H "x-api-key: $ANTHROPIC_API_KEY" -H "anthropic-version: 2023-06-01" -H "Content-Type: application/json" \
    -d "{\"model\":\"$m\",\"messages\":[{\"role\":\"user\",\"content\":\"p\"}],\"max_tokens\":3}" 2>/dev/null)
  [ "$CODE" = "200" ] && echo "  OK $m" || echo "  FAIL $m ($CODE)"
done

echo ""
echo "-- OPENROUTER --"
for m in meta-llama/llama-4-maverick deepseek/deepseek-chat-v3-0324 qwen/qwen3-coder \
         x-ai/grok-4.1-fast perplexity/sonar-pro meta-llama/llama-3.3-70b-instruct \
         mistralai/mistral-large-2411 deepseek/deepseek-r1-0528 cohere/command-a \
         "nvidia/nemotron-3-nano-30b-a3b:free"; do
  ping_model "$m" "https://openrouter.ai/api/v1/chat/completions" "$OPENROUTER_API_KEY" \
    "{\"model\":\"$m\",\"messages\":[{\"role\":\"user\",\"content\":\"p\"}],\"max_tokens\":3}" ""
done

echo ""
echo "-- GROQ --"
for m in llama-3.3-70b-versatile llama-3.1-8b-instant; do
  ping_model "$m" "https://api.groq.com/openai/v1/chat/completions" "$GROQ_API_KEY" \
    "{\"model\":\"$m\",\"messages\":[{\"role\":\"user\",\"content\":\"p\"}],\"max_tokens\":3}" ""
done

echo ""
echo "-- SAMBANOVA --"
for m in Meta-Llama-3.1-8B-Instruct Meta-Llama-3.3-70B-Instruct; do
  ping_model "$m" "https://api.sambanova.ai/v1/chat/completions" "$SAMBANOVA_API_KEY" \
    "{\"model\":\"$m\",\"messages\":[{\"role\":\"user\",\"content\":\"p\"}],\"max_tokens\":3}" ""
done

echo ""
echo "-- CEREBRAS --"
for m in llama3.1-8b llama-3.3-70b; do
  ping_model "$m" "https://api.cerebras.ai/v1/chat/completions" "$CEREBRAS_API_KEY" \
    "{\"model\":\"$m\",\"messages\":[{\"role\":\"user\",\"content\":\"p\"}],\"max_tokens\":3}" ""
done

echo ""
echo "-- STABILITY AI --"
echo -n "  Balance: "
curl -s https://api.stability.ai/v1/user/balance -H "Authorization: Bearer $STABILITY_API_KEY" 2>/dev/null | python3 -c "import sys,json;print(json.load(sys.stdin).get('credits','?'))" 2>/dev/null || echo "?"

echo ""
echo "-- TOGETHER AI --"
ping_model "Llama-3.3-70B" "https://api.together.xyz/v1/chat/completions" "$TOGETHER_API_KEY" \
  "{\"model\":\"meta-llama/Llama-3.3-70B-Instruct-Turbo\",\"messages\":[{\"role\":\"user\",\"content\":\"p\"}],\"max_tokens\":3}" ""

echo ""
echo "-- APIYI --"
ping_model "gpt-4o-mini" "https://api.apiyi.com/v1/chat/completions" "$APIYI_API_KEY" \
  "{\"model\":\"gpt-4o-mini\",\"messages\":[{\"role\":\"user\",\"content\":\"p\"}],\"max_tokens\":3}" ""

echo ""
echo "-- OPENAI DALL-E (proxy) --"
CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 25 --socks5 127.0.0.1:10808 \
  -X POST "https://api.openai.com/v1/images/generations" \
  -H "Authorization: Bearer $OPENAI_API_KEY" -H "Content-Type: application/json" \
  -d "{\"model\":\"dall-e-3\",\"prompt\":\"red circle\",\"n\":1,\"size\":\"1024x1024\",\"response_format\":\"url\"}" 2>/dev/null)
[ "$CODE" = "200" ] && echo "  OK dall-e-3" || echo "  FAIL dall-e-3 ($CODE)"

echo ""
echo "========================="
echo "DONE"

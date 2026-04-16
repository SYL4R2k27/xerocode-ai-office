# XeroCode CLI

Chat with a **team of AI models** from your terminal. Claude, GPT, Gemini, Grok — working together on your task, checking each other.

```bash
npm install -g xerocode-cli
xerocode login
xerocode run "explain quicksort in one paragraph"
```

## Features

- 🧠 **Team of models** — multi-model orchestration out of the box
- 🎯 **Single-model mode** — `--model claude-3-5-sonnet` bypasses orchestration
- 🔀 **5 orchestration modes** — `--mode team|swarm|auction|manager|xerocode_ai`
- 🚰 **Pipe-friendly** — `cat code.py | xerocode run "add type hints"`
- 🔐 **OS keychain** — JWT tokens stored in macOS Keychain / Win Credential Manager / libsecret
- 📜 **Markdown rendering** — code highlight, headings, lists

## Commands

```bash
xerocode login                            # browser OAuth, stores JWT in OS keychain
xerocode logout                           # remove credentials

xerocode chat                             # interactive REPL
xerocode run "<prompt>"                   # one-shot, prints answer

xerocode models                           # list available models
xerocode config get|set <key> [value]     # manage ~/.xerocode/config.json
```

## Global flags

| Flag | Meaning |
|---|---|
| `--model <id>` | Force a single model. Skips orchestration. |
| `--mode <name>` | Orchestration mode: `xerocode_ai` (default), `team`, `swarm`, `auction`, `manager`. |
| `--system "..."` | Custom system prompt. |
| `--json` | Machine-readable output (for piping to `jq`, etc.). |
| `--no-stream` | Print the full answer at once instead of streaming. |

## Examples

```bash
# Single-model, piped input
cat file.py | xerocode run "add type hints" --model claude-3-5-sonnet

# Swarm mode — 3 models compete, best answer wins
xerocode --mode swarm run "compare Python and Rust for systems programming"

# JSON output for scripting
xerocode run "2+2" --json | jq -r '.response'

# Interactive REPL
xerocode chat
> /model gpt-4o
> /mode team
> What is a monad?
```

## Configuration

Config file: `~/.xerocode/config.json`

```json
{
  "api": { "base": "https://xerocode.ru/api" },
  "default": { "mode": "xerocode_ai" }
}
```

Credentials are stored securely in the OS keychain.

## Requirements

- Node.js ≥ 18.17
- Active XeroCode account (free tier works): https://xerocode.ru

## License

MIT © XeroCode

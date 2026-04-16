/**
 * `xerocode models` — list models available to the current user.
 *
 * Backend response from GET /api/agents/models/capabilities (no params):
 *   {
 *     capabilities: { cap_id: "Human label", ... },
 *     models: { "provider/model-id": ["cap1", "cap2"], ... }
 *   }
 */
import { Command } from "commander";
import { theme } from "../ui/theme.js";
import { apiJson } from "../api/client.js";
import { getAuthToken } from "../api/auth.js";
import { ApiError, friendlyError } from "../util/errors.js";

interface CapabilitiesResponse {
  capabilities?: Record<string, string>;
  models?: Record<string, string[]>;
}

/** Group "provider/model-name" pairs by provider. */
function groupByProvider(
  models: Record<string, string[]>
): Map<string, { id: string; caps: string[] }[]> {
  const out = new Map<string, { id: string; caps: string[] }[]>();
  for (const [id, caps] of Object.entries(models)) {
    const slash = id.indexOf("/");
    const provider = slash >= 0 ? id.slice(0, slash) : "other";
    if (!out.has(provider)) out.set(provider, []);
    out.get(provider)!.push({ id, caps });
  }
  // Sort providers alphabetically; sort models inside
  const sorted = new Map<string, { id: string; caps: string[] }[]>(
    [...out.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  );
  for (const arr of sorted.values()) arr.sort((a, b) => a.id.localeCompare(b.id));
  return sorted;
}

export function modelsCommand(): Command {
  const cmd = new Command("models");
  cmd
    .description("List available AI models")
    .option("--json", "JSON output")
    .option("--caps", "show capabilities next to each model")
    .action(async (opts) => {
      if (!getAuthToken()) {
        console.error(
          theme.error("✖ Not authenticated.") +
            "\n  Run " +
            theme.brand("xerocode login") +
            " first."
        );
        process.exit(1);
      }

      let data: CapabilitiesResponse;
      try {
        data = await apiJson<CapabilitiesResponse>("/agents/models/capabilities");
      } catch (err) {
        if (err instanceof ApiError) {
          console.error(friendlyError(err.status, err.body));
        } else {
          console.error(theme.error("✖ " + (err as Error).message));
        }
        process.exit(1);
      }

      if (opts.json) {
        process.stdout.write(JSON.stringify(data, null, 2) + "\n");
        return;
      }

      const models = data.models || {};
      const capLabels = data.capabilities || {};

      if (!Object.keys(models).length) {
        console.log(theme.muted("No models returned."));
        return;
      }

      const grouped = groupByProvider(models);
      for (const [provider, entries] of grouped) {
        console.log("");
        console.log(theme.brandBold(provider.toUpperCase()));
        for (const { id, caps } of entries) {
          const shortId = id.includes("/") ? id.slice(id.indexOf("/") + 1) : id;
          const line = `  ${theme.primary(id)}`;
          if (opts.caps && caps.length) {
            const capStr = caps
              .map((c) => capLabels[c] || c)
              .join(", ");
            console.log(line + theme.muted(`  [${capStr}]`));
          } else {
            console.log(line);
          }
        }
      }
      console.log("");
      console.log(
        theme.muted(
          `  Pass any model ID with ${theme.brand("--model <id>")} to bypass orchestration.`
        )
      );
      console.log("");
    });
  return cmd;
}

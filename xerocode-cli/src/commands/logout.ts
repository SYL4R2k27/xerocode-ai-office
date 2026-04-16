import { Command } from "commander";
import { theme } from "../ui/theme.js";
import { removeAuthToken, getAuthToken } from "../api/auth.js";

export function logoutCommand(): Command {
  const cmd = new Command("logout");
  cmd.description("Remove saved credentials from this machine").action(() => {
    const had = !!getAuthToken();
    removeAuthToken();
    if (had) {
      console.log(theme.success("✓ Logged out. Credentials removed."));
    } else {
      console.log(theme.muted("No credentials were stored."));
    }
  });
  return cmd;
}

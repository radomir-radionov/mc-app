import { execFileSync } from "node:child_process";
import path from "node:path";
import "./load-env";

const tsx = path.join(process.cwd(), "node_modules", ".bin", "tsx");

execFileSync(tsx, ["--test", ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
  cwd: process.cwd(),
});

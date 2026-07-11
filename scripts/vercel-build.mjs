import { execFileSync } from "node:child_process";

const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const isPreview = process.env.VERCEL_ENV === "preview";
const previewName =
  process.env.GITHUB_HEAD_REF ?? process.env.VERCEL_GIT_COMMIT_REF ?? "preview";

const args = ["convex", "deploy"];
if (isPreview) {
  args.push(`--preview-create=${previewName}`, "--preview-run", "seed:preview");
}
args.push(
  "--cmd-url-env-var-name",
  "NEXT_PUBLIC_CONVEX_URL",
  "--cmd",
  "npm run build"
);

execFileSync(npx, args, { stdio: "inherit" });

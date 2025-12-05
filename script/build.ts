import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";
import { execSync } from "child_process";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "@neondatabase/serverless",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

function getGitCommit(): string {
  try {
    const commit = execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
    return commit;
  } catch (error) {
    console.warn("Could not get git commit hash, using 'dev'");
    return "dev";
  }
}

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  const commitHash = getGitCommit();
  console.log(`Building with commit: ${commitHash.substring(0, 7)}`);

  // Set the commit hash as an environment variable for vite
  process.env.VITE_BUILD_COMMIT = commitHash;

  console.log("building client...");
  await viteBuild({
    define: {
      'import.meta.env.VITE_BUILD_COMMIT': JSON.stringify(commitHash),
    },
  });

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});

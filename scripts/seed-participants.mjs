import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const sourceDirectory =
  process.env.PARTICIPANT_PHOTO_DIR ??
  "/Users/sebastianstoelen/Library/CloudStorage/GoogleDrive-sebastian.stoelen@gmail.com/My Drive/01 - Projects/Vrijgezellen Tommie/Foto's/Stickers";

const roster = [
  ["Diet", "diet", "diet.png", 120, false],
  ["Tommie", "tommie", "tommie.png", 80, true],
  ["Mehuys", "mehuys", "mehuys.png", 110, false],
  ["Tim", "tim", "tim 5.png", 60, false],
  ["Seba", "seba", "seba.png", 100, true],
  ["Antoon", "antoon", "antoon.png", 90, false],
  ["Robbert", "robbert", "robbert.png", 75, false],
  ["Chiel", "chiel", "chiel.png", 130, true],
  ["Bossie", "bossie", "bossie.png", 55, false],
  ["Okan", "okan", "okan.png", 95, false],
  ["Goossens", "goossens", "goossens.png", 105, false],
  ["Toubri", "toubri", "toubri.png", 70, false],
  ["Wolsing", "wolsing", "wolsing.png", 115, false],
  ["Jakkie", "jakkie", "jakkie.png", 65, false],
  ["Vinny", "vinny", "vinny.png", 85, false]
];

const deploymentArgs = process.env.CONVEX_DEPLOYMENT
  ? ["--deployment", process.env.CONVEX_DEPLOYMENT]
  : ["--prod"];
const requestedSeedKeys = process.env.PARTICIPANT_SEED_KEYS
  ?.split(",")
  .map((seedKey) => seedKey.trim().toLowerCase())
  .filter(Boolean);
const rosterToSeed = requestedSeedKeys
  ? roster.filter(([, seedKey]) => requestedSeedKeys.includes(seedKey))
  : roster;

function run(functionName, args) {
  const result = execFileSync(
    "npx",
    ["convex", "run", functionName, JSON.stringify(args), ...deploymentArgs],
    { encoding: "utf8", stdio: ["inherit", "pipe", "inherit"] }
  ).trim();
  return JSON.parse(result);
}

async function getPasscode() {
  if (process.env.ADMIN_PASSCODE) {
    return process.env.ADMIN_PASSCODE;
  }
  const readline = createInterface({ input: stdin, output: stdout });
  try {
    return await readline.question("Convex production admin passcode: ");
  } finally {
    readline.close();
  }
}

const passcode = await getPasscode();
const adminToken = randomBytes(32).toString("hex");
run("authTokens:login", { passcode, sessionToken: adminToken });

try {
  for (const [name, seedKey, filename, initialPoints, initialCanDate] of rosterToSeed) {
    const filePath = resolve(sourceDirectory, filename);
    const photo = await readFile(filePath);
    const uploadUrl = run("participants:generatePhotoUploadUrl", { adminToken });
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": "image/png" },
      body: photo
    });
    if (!response.ok) {
      throw new Error(`Could not upload ${basename(filePath)} (${response.status}).`);
    }
    const { storageId } = await response.json();
    if (!storageId) {
      throw new Error(`Convex did not return a storage ID for ${basename(filePath)}.`);
    }
    run("participants:upsertRosterEntry", {
      adminToken,
      name,
      seedKey,
      photoStorageId: storageId,
      initialPoints,
      initialCanDate
    });
    console.log(`Seeded ${name}.`);
  }
  run("trackerAdmin:resetToStartingState", { adminToken });
  console.log("Set the starting scores, date flags, and Tommie's pot (€1,000).");
} finally {
  try {
    run("authTokens:logout", { adminToken });
  } catch {
    // The short-lived session will expire if cleanup cannot be completed.
  }
}

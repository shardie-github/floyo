import fs from "fs";
import path from "path";

const FLAGS_PATH = path.join(process.cwd(), "featureflags", "flags.json");

export function loadFlags(): Record<string, any> {
  try {
    if (fs.existsSync(FLAGS_PATH)) {
      return JSON.parse(fs.readFileSync(FLAGS_PATH, "utf8"));
    }
  } catch (e) {
    console.error("Failed to load flags:", e);
  }
  return {};
}

export function getFlag(key: string, defaultValue: any = false): any {
  const flags = loadFlags();
  return flags[key] ?? defaultValue;
}

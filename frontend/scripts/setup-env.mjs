import { existsSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

const sourcePath = resolve(".env.example");
const targetPath = resolve(".env");

if (!existsSync(targetPath)) {
  copyFileSync(sourcePath, targetPath);
  console.log("created frontend/.env");
} else {
  console.log("kept existing frontend/.env");
}

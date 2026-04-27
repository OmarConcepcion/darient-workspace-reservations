import { existsSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

const files = [
  [".env.example", ".env"],
  ["backend/.env.example", "backend/.env"],
  ["frontend/.env.example", "frontend/.env"]
];

for (const [source, target] of files) {
  const sourcePath = resolve(source);
  const targetPath = resolve(target);

  if (!existsSync(targetPath)) {
    copyFileSync(sourcePath, targetPath);
    console.log(`created ${target}`);
  } else {
    console.log(`kept existing ${target}`);
  }
}

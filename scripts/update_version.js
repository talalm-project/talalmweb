import { execFileSync } from "child_process";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";

const versionName = "API_VERSION";
const envFiles = [".env"];
const defaultBranch = "master";

const branchName =
  (process.env.VERSION_BRANCH || process.argv[2] || defaultBranch).trim() || defaultBranch;

const latestCommit = execFileSync("git", ["rev-parse", branchName], {
  stdio: ["ignore", "pipe", "inherit"],
  encoding: "utf-8"
}).trim();

const lineValue = `${versionName}="${latestCommit}"`;

const formatContent = (lines) => {
  return `${lines.join("\n").trimEnd()}\n`;
};

envFiles.forEach((envFile) => {
  const filePath = path.resolve(envFile);
  let content = "";

  if (existsSync(filePath)) {
    content = readFileSync(filePath, "utf-8");
  }

  const lines = content.length === 0 ? [] : content.split(/\r?\n/);
  let updated = false;

  const normalizedLines = lines.map((line) => {
    if (line.startsWith(`${versionName}=`)) {
      updated = true;
      return lineValue;
    }
    return line;
  });

  if (!updated) {
    normalizedLines.push(lineValue);
  }

  writeFileSync(filePath, formatContent(normalizedLines), "utf-8");
  console.log(`${envFile} updated with ${lineValue}`);
});

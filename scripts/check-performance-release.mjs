import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const artifactPath = path.join(root, "dist-vercel", "index.html");

if (!fs.existsSync(artifactPath)) {
  console.error("release gate incomplete: Vercel deployment artifact is missing");
  process.exitCode = 2;
} else {
  const html = fs.readFileSync(artifactPath, "utf8");
  if (!html.includes('data-campaign-keyboard-profile="vercel"')) {
    console.error("release gate failed: Vercel keyboard profile is missing");
    process.exitCode = 1;
  } else console.log("Vercel deployment artifact passed");
}

if (process.exitCode === undefined && process.argv.includes("--require-evidence")) {
  const evidencePath = process.env.AMSO_PERFORMANCE_EVIDENCE;
  if (!evidencePath) {
    console.error("release gate incomplete: AMSO_PERFORMANCE_EVIDENCE report is required");
    process.exitCode = 2;
  } else {
    const absoluteEvidencePath = path.resolve(root, evidencePath);
    const evidence = JSON.parse(fs.readFileSync(absoluteEvidencePath, "utf8"));
    const requiredPassFields = [
      "configurationPassed", "checkpointsPassed", "digestPassed", "requiredCoveragePassed",
      "visualRegressionPassed", "coldStartPassed", "worldTransitionsPassed",
      "vercelDeploymentPassed",
      "onePlusReportPassed", "nokiaReportPassed", "iphoneSafariReportPassed",
      "minimumProfileReportPassed", "reportMetadataComplete"
    ];
    const missing = requiredPassFields.filter((field) => evidence[field] === undefined);
    const failed = requiredPassFields.filter((field) => evidence[field] === false);
    if (evidence.minimumProfileDeviceAvailable === undefined) missing.push("minimumProfileDeviceAvailable");
    else if (evidence.minimumProfileDeviceAvailable !== true) failed.push("minimumProfileDeviceAvailable");
    if (evidence.consoleErrorCount === undefined) missing.push("consoleErrorCount");
    else if (evidence.consoleErrorCount !== 0) failed.push("consoleErrorCount");
    if (evidence.inputQueueOverflows === undefined) missing.push("inputQueueOverflows");
    else if (evidence.inputQueueOverflows !== 0) failed.push("inputQueueOverflows");
    if (evidence.androidMemoryMb === undefined) missing.push("androidMemoryMb");
    else if (!(Number.isFinite(evidence.androidMemoryMb) && evidence.androidMemoryMb <= 220)) failed.push("androidMemoryMb");
    if (evidence.androidCycleGrowthMb === undefined) missing.push("androidCycleGrowthMb");
    else if (!(Number.isFinite(evidence.androidCycleGrowthMb) && evidence.androidCycleGrowthMb <= 10)) failed.push("androidCycleGrowthMb");
    if (failed.length > 0) {
      console.error(`release gate failed or incomplete: ${failed.join(", ")}`);
      process.exitCode = 1;
    } else if (missing.length > 0) {
      console.error(`release gate incomplete: ${missing.join(", ")}`);
      process.exitCode = 2;
    } else {
      console.log("integrated performance release gate passed");
    }
  }
}

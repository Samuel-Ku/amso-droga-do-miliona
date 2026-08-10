import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const outputDirectory = path.resolve("dist-vercel");

describe("optimized Vercel deployment", () => {
  it("ships a production page with the Vercel keyboard profile and no source maps", () => {
    const htmlPath = path.join(outputDirectory, "index.html");
    expect(existsSync(htmlPath)).toBe(true);
    const html = readFileSync(htmlPath, "utf8");

    expect(html).toContain('data-campaign-keyboard-profile="vercel"');
    expect(html).not.toContain('data-campaign-keyboard-profile="idosell"');
    expect(html).toMatch(/<script[^>]+src="\.\/assets\/[^"/]+\.js"/u);
    expect(html).toMatch(/<link[^>]+href="\.\/assets\/[^"/]+\.css"/u);
    expect(readdirSync(path.join(outputDirectory, "assets")))
      .not.toContainEqual(expect.stringMatching(/\.map$/u));
  });

  it("omits source artwork and other files that the production runtime never requests", () => {
    const files = (directory: string): string[] => readdirSync(directory, { withFileTypes: true })
      .flatMap((entry) => {
        const target = path.join(directory, entry.name);
        return entry.isDirectory() ? files(target) : [target];
      });
    const deployedFiles = files(outputDirectory);
    const deployedBytes = deployedFiles.reduce((total, file) => total + statSync(file).size, 0);

    expect(deployedBytes).toBeLessThan(8 * 1024 * 1024);
    expect(deployedFiles).not.toContainEqual(expect.stringMatching(/(?:\.DS_Store|\.map|\.png)$/u));
  });
});

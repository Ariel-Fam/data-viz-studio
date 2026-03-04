import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw";

const root = process.cwd();
const inputPath = resolve(root, "architecture-diagram.md");
const outputPath = resolve(root, "architecture-diagram.excalidraw");

function extractMermaidBlocks(markdown) {
  const regex = /```mermaid\s*([\s\S]*?)```/g;
  const blocks = [];
  let match = regex.exec(markdown);
  while (match) {
    blocks.push(match[1].trim());
    match = regex.exec(markdown);
  }
  return blocks;
}

function getMaxBottom(elements) {
  return elements.reduce((max, el) => {
    const y = typeof el.y === "number" ? el.y : 0;
    const h = typeof el.height === "number" ? el.height : 0;
    return Math.max(max, y + h);
  }, 0);
}

function offsetElements(elements, dx, dy) {
  return elements.map((el) => ({
    ...el,
    x: (typeof el.x === "number" ? el.x : 0) + dx,
    y: (typeof el.y === "number" ? el.y : 0) + dy,
  }));
}

async function main() {
  const markdown = readFileSync(inputPath, "utf8");
  const blocks = extractMermaidBlocks(markdown);
  if (blocks.length === 0) {
    throw new Error("No mermaid blocks found in architecture-diagram.md");
  }

  const first = await parseMermaidToExcalidraw(blocks[0], {
    themeVariables: { fontSize: "20px" },
  });

  let combinedElements = [...first.elements];
  let combinedFiles = { ...first.files };

  if (blocks[1]) {
    const second = await parseMermaidToExcalidraw(blocks[1], {
      themeVariables: { fontSize: "20px" },
    });
    const offsetY = getMaxBottom(first.elements) + 220;
    const secondOffset = offsetElements(second.elements, 0, offsetY);
    combinedElements = combinedElements.concat(secondOffset);
    combinedFiles = { ...combinedFiles, ...second.files };
  }

  const doc = {
    type: "excalidraw",
    version: 2,
    source: "https://excalidraw.com",
    elements: combinedElements,
    appState: {
      viewBackgroundColor: "#ffffff",
      currentItemStrokeColor: "#1e1e1e",
      currentItemBackgroundColor: "transparent",
      currentItemFillStyle: "hachure",
      currentItemStrokeWidth: 1,
      currentItemStrokeStyle: "solid",
      currentItemRoughness: 1,
      currentItemOpacity: 100,
      currentItemFontFamily: 1,
      currentItemFontSize: 20,
      currentItemTextAlign: "left",
      currentItemStartArrowhead: null,
      currentItemEndArrowhead: "arrow",
      scrollX: 0,
      scrollY: 0,
      zoom: { value: 1 },
      collaborators: [],
    },
    files: combinedFiles,
  };

  writeFileSync(outputPath, JSON.stringify(doc, null, 2), "utf8");
  console.log(`Created ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

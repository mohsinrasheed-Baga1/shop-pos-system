import sharp from "sharp";
import { mkdirSync } from "fs";
import { join } from "path";
const out = join(process.cwd(), "build");
mkdirSync(out, { recursive: true });
// Generate a simple emerald POS icon (store + barcode theme)
const svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="96" fill="#059669"/>
  <g fill="#ffffff">
    <rect x="120" y="150" width="272" height="170" rx="16" fill="none" stroke="#ffffff" stroke-width="14"/>
    <rect x="150" y="190" width="212" height="20" rx="6"/>
    <rect x="150" y="230" width="150" height="16" rx="6"/>
    <rect x="150" y="262" width="180" height="16" rx="6"/>
    <rect x="170" y="370" width="14" height="60"/>
    <rect x="194" y="370" width="10" height="60"/>
    <rect x="214" y="370" width="18" height="60"/>
    <rect x="242" y="370" width="10" height="60"/>
    <rect x="262" y="370" width="14" height="60"/>
    <rect x="286" y="370" width="10" height="60"/>
    <rect x="306" y="370" width="22" height="60"/>
  </g>
</svg>`;
await sharp(Buffer.from(svg)).png().toFile(join(out, "icon.png"));
console.log("icon.png generated");

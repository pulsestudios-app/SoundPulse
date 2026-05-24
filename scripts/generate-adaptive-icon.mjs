import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const source = path.join(root, "assets", "soundpulse-icon-2048.png");
const output = path.join(root, "assets", "soundpulse-adaptive-foreground.png");

const size = 1024;
const padding = Math.round(size * 0.15);
const inner = size - padding * 2;

await sharp(source)
  .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .extend({
    top: padding,
    bottom: padding,
    left: padding,
    right: padding,
    background: { r: 10, g: 10, b: 26, alpha: 1 },
  })
  .png()
  .toFile(output);

console.log(`Wrote ${output} (${size}px, ${padding}px padding per side)`);

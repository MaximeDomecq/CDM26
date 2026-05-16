// Generates PWA icons using Canvas API (Node.js)
// Run: node scripts/generate-icons.mjs
import { createCanvas } from "canvas";
import { writeFileSync, mkdirSync } from "fs";

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  const r = size * 0.12;

  // Background: dark navy
  ctx.fillStyle = "#080e1a";
  ctx.beginPath();
  ctx.roundRect(0, 0, size, size, r);
  ctx.fill();

  // Gold gradient square in center
  const pad = size * 0.15;
  const sq = size - pad * 2;
  const sqR = size * 0.08;
  const grad = ctx.createLinearGradient(pad, pad, pad + sq, pad + sq);
  grad.addColorStop(0, "#f59e0b");
  grad.addColorStop(0.5, "#fcd34d");
  grad.addColorStop(1, "#d97706");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(pad, pad, sq, sq, sqR);
  ctx.fill();

  // "26" text
  ctx.fillStyle = "#080e1a";
  ctx.font = `900 ${Math.round(size * 0.38)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("26", size / 2, size / 2 + size * 0.02);

  return canvas.toBuffer("image/png");
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", generateIcon(192));
writeFileSync("public/icons/icon-512.png", generateIcon(512));
console.log("Icons generated: public/icons/icon-192.png and icon-512.png");

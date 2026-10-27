// Validasi katalog: setiap id wajib punya 0.jpg dan 1.jpg di CDN jsDelivr
// dengan commit SHA terkunci. Jalankan: npm run check-exercises
import { readFileSync } from "node:fs";

const SOURCE = "src/data/exercises.ts";
const text = readFileSync(new URL("../" + SOURCE, import.meta.url), "utf8");

const ids = [...text.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
const cdnMatch = text.match(/CDN_BASE\s*=\s*`([^`]+)`/);
if (!cdnMatch) {
  console.error("Tidak menemukan CDN_BASE di", SOURCE);
  process.exit(1);
}
const CDN = cdnMatch[1].replace("${GITHUB_SHA}", "dummy") === "" ? null : text.match(/GITHUB_SHA\s*=\s*"([^"]+)"/)?.[1];
const BASE = cdnMatch[1].replace(/\$\{GITHUB_SHA\}/g, CDN ?? "");

const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dup.length) {
  console.error("ID duplikat:", [...new Set(dup)]);
  process.exit(1);
}

async function check(id, file, limit) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${BASE}/${id}/${file}`, { method: "HEAD" });
      return res.status;
    } catch (err) {
      if (attempt === limit - 1) throw err;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
}

const CONCURRENCY = 12;
let cursor = 0;
const failures = [];
const tasks = [];

for (const id of ids) {
  for (const file of ["0.jpg", "1.jpg"]) {
    tasks.push({ id, file });
  }
}

async function worker() {
  while (true) {
    const index = atomicNext();
    if (index === null) return;
    const { id, file } = tasks[index];
    try {
      const status = await check(id, file, 3);
      if (status !== 200) failures.push(`${id}/${file} -> ${status}`);
    } catch (err) {
      failures.push(`${id}/${file} -> ${err.name}: ${err.message}`);
    }
  }
}
function atomicNext() {
  if (cursor >= tasks.length) return null;
  return cursor++;
}
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

console.log(
  failures.length
    ? `GAGAL: ${failures.length} dari ${tasks.length} gambar bermasalah:\n` + failures.join("\n")
    : `OK: ${ids.length} id, ${tasks.length} gambar semua 200 (${BASE})`,
);
process.exit(failures.length ? 1 : 0);

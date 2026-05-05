const fs = require("fs/promises");
const path = require("path");

const sourceDataDir = path.join(__dirname, "..", "data");
const dataDir = process.env.VERCEL ? path.join("/tmp", "archha-data") : sourceDataDir;

async function readJson(fileName, fallback) {
  const filePath = path.join(dataDir, fileName);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === "ENOENT") {
      const sourcePath = path.join(sourceDataDir, fileName);
      try {
        const raw = await fs.readFile(sourcePath, "utf8");
        const seeded = JSON.parse(raw);
        await writeJson(fileName, seeded);
        return seeded;
      } catch {
        await writeJson(fileName, fallback);
        return fallback;
      }
    }
    throw error;
  }
}

async function writeJson(fileName, data) {
  await fs.mkdir(dataDir, { recursive: true });
  const filePath = path.join(dataDir, fileName);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

module.exports = { readJson, writeJson };

#!/usr/bin/env node
/**
 * build_items_index.js
 *
 * Builds a compact item index from NEU-REPO items/ JSON files.
 *
 * Usage:
 *   node scripts/build_items_index.js
 *
 * Reads from:  data/neu/items/   (local directory, if it exists)
 * Downloads:   raw.githubusercontent.com (if local dir is absent)
 *
 * Outputs:
 *   data/neu/items_index.json       — compact { ITEM_ID: { name, lore, category } }
 *   data/neu/items_bazaar_ids.json  — list of item IDs that appear in the Hypixel Bazaar
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const REPO_RAW_BASE  = 'https://raw.githubusercontent.com/pogamer63-lgtm/NotEnoughUpdates-REPO/master';
const REPO_TREE_API  = 'https://api.github.com/repos/pogamer63-lgtm/NotEnoughUpdates-REPO/git/trees/master?recursive=1';
const BAZAAR_API     = 'https://api.hypixel.net/skyblock/bazaar';

const PROJECT_ROOT   = path.resolve(__dirname, '..');
const LOCAL_ITEMS_DIR = path.join(PROJECT_ROOT, 'data', 'neu', 'items');
const OUT_INDEX      = path.join(PROJECT_ROOT, 'data', 'neu', 'items_index.json');
const OUT_BAZAAR_IDS = path.join(PROJECT_ROOT, 'data', 'neu', 'items_bazaar_ids.json');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Strip Minecraft §x color/formatting codes from a string. */
function stripCodes(str) {
  if (!str) return '';
  return str.replace(/§[0-9a-fklmnorA-FKLMNOR]/g, '').trim();
}

/** Simple HTTPS GET that returns a Buffer (works without external deps). */
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: { 'User-Agent': 'SkyHub-build-script/1.0' },
    }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpsGet(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });
    req.on('error', reject);
    req.setTimeout(30_000, () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
  });
}

/** Fetch and parse JSON from a URL. */
async function fetchJSON(url) {
  const buf = await httpsGet(url);
  return JSON.parse(buf.toString('utf8'));
}

/** Ensure a directory exists (creates recursively). */
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ---------------------------------------------------------------------------
// Step 1: Collect item JSON sources
// ---------------------------------------------------------------------------

/**
 * Returns an async iterable of { filename, getData() } entries.
 * If localDir exists, reads from disk; otherwise downloads from GitHub.
 */
async function getItemSources() {
  const localExists = fs.existsSync(LOCAL_ITEMS_DIR) &&
    fs.statSync(LOCAL_ITEMS_DIR).isDirectory();

  if (localExists) {
    const files = fs.readdirSync(LOCAL_ITEMS_DIR)
      .filter((f) => f.endsWith('.json'));
    console.log(`[source] Local directory found — ${files.length} files in ${LOCAL_ITEMS_DIR}`);
    return files.map((filename) => ({
      filename,
      getData: () =>
        JSON.parse(fs.readFileSync(path.join(LOCAL_ITEMS_DIR, filename), 'utf8')),
    }));
  }

  // --- Download mode ---
  console.log('[source] Local items/ directory not found — fetching file list from GitHub tree API…');
  const tree = await fetchJSON(REPO_TREE_API);

  if (tree.truncated) {
    console.warn('[warn] GitHub tree response was truncated — some items may be missing.');
  }

  const itemPaths = (tree.tree || [])
    .filter((entry) => entry.type === 'blob' &&
      entry.path.startsWith('items/') &&
      entry.path.endsWith('.json'))
    .map((entry) => entry.path);

  console.log(`[source] Remote tree: ${itemPaths.length} items/*.json found`);

  return itemPaths.map((itemPath) => {
    const filename = path.basename(itemPath);
    const url = `${REPO_RAW_BASE}/${itemPath}`;
    return {
      filename,
      getData: async () => {
        const buf = await httpsGet(url);
        return JSON.parse(buf.toString('utf8'));
      },
    };
  });
}

// ---------------------------------------------------------------------------
// Step 2: Fetch current Bazaar product IDs from Hypixel API
// ---------------------------------------------------------------------------

async function fetchBazaarIds() {
  console.log('[bazaar] Fetching product IDs from Hypixel Bazaar API…');
  try {
    const data = await fetchJSON(BAZAAR_API);
    if (!data.success || !data.products) {
      console.warn('[bazaar] Unexpected response shape; skipping bazaar IDs.');
      return new Set();
    }
    const ids = new Set(Object.keys(data.products));
    console.log(`[bazaar] ${ids.size} bazaar product IDs retrieved.`);
    return ids;
  } catch (err) {
    console.warn(`[bazaar] Failed to fetch bazaar data: ${err.message}`);
    console.warn('[bazaar] items_bazaar_ids.json will be empty — re-run later.');
    return new Set();
  }
}

// ---------------------------------------------------------------------------
// Step 3: Determine a category from item data
// ---------------------------------------------------------------------------

/**
 * NEU-REPO items do not all have an explicit "category" field.
 * We derive it from clues in the data in this priority order:
 *   1. item.category  (present in some older-format files)
 *   2. Last non-empty lore line (usually "§6§lLEGENDARY SWORD" etc.)
 *   3. item.itemid   (e.g. "minecraft:diamond_sword" → SWORD)
 *   4. internalname suffix heuristics
 */
function deriveCategory(item) {
  // 1. Explicit field
  if (item.category) return item.category;

  // 2. Parse the rarity line — last non-empty lore line, strip codes
  const lore = Array.isArray(item.lore) ? item.lore : [];
  for (let i = lore.length - 1; i >= 0; i--) {
    const clean = stripCodes(lore[i]);
    if (!clean) continue;
    // Typical pattern: "LEGENDARY SWORD", "EPIC HELMET", "COMMON ACCESSORY", etc.
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) {
      const rarity = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC',
        'DIVINE', 'SUPREME', 'SPECIAL', 'VERY SPECIAL'];
      // Find first token that is a rarity word, return everything after it
      for (let j = 0; j < parts.length; j++) {
        if (rarity.includes(parts[j])) {
          const cat = parts.slice(j + 1).join('_').toUpperCase();
          if (cat) return cat;
        }
      }
    }
    break; // only look at the last non-empty line
  }

  // 3. Derive from minecraft item ID
  if (item.itemid) {
    const mcId = item.itemid.replace('minecraft:', '').toUpperCase();
    const weaponMap = {
      DIAMOND_SWORD: 'SWORD', IRON_SWORD: 'SWORD', GOLDEN_SWORD: 'SWORD',
      STONE_SWORD: 'SWORD', WOOD_SWORD: 'SWORD',
      BOW: 'BOW',
      DIAMOND_PICKAXE: 'PICKAXE', IRON_PICKAXE: 'PICKAXE',
      DIAMOND_AXE: 'AXE', IRON_AXE: 'AXE',
      DIAMOND_HOE: 'HOE', IRON_HOE: 'HOE',
      DIAMOND_HELMET: 'HELMET', IRON_HELMET: 'HELMET', CHAINMAIL_HELMET: 'HELMET',
      DIAMOND_CHESTPLATE: 'CHESTPLATE', IRON_CHESTPLATE: 'CHESTPLATE',
      DIAMOND_LEGGINGS: 'LEGGINGS', IRON_LEGGINGS: 'LEGGINGS',
      DIAMOND_BOOTS: 'BOOTS', IRON_BOOTS: 'BOOTS',
    };
    if (weaponMap[mcId]) return weaponMap[mcId];
    if (mcId === 'SKULL') return 'HELMET'; // most skulls are helmets in NEU
  }

  // 4. Internal name heuristics
  const name = (item.internalname || '').toUpperCase();
  if (name.endsWith('_HELMET'))      return 'HELMET';
  if (name.endsWith('_CHESTPLATE'))  return 'CHESTPLATE';
  if (name.endsWith('_LEGGINGS'))    return 'LEGGINGS';
  if (name.endsWith('_BOOTS'))       return 'BOOTS';
  if (name.endsWith('_SWORD'))       return 'SWORD';
  if (name.endsWith('_BOW'))         return 'BOW';
  if (name.endsWith('_PICKAXE'))     return 'PICKAXE';
  if (name.endsWith('_AXE'))         return 'AXE';
  if (name.endsWith('_HOE'))         return 'HOE';
  if (name.includes('NPC'))          return 'NPC';

  return 'MISC';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('=== SkyHub NEU Items Index Builder ===\n');

  ensureDir(path.join(PROJECT_ROOT, 'data', 'neu'));

  // Run item-source collection and bazaar fetch in parallel
  const [sources, bazaarIds] = await Promise.all([
    getItemSources(),
    fetchBazaarIds(),
  ]);

  const index       = {};     // ITEM_ID -> { name, lore, category }
  const bazaarMatch = [];     // item IDs that are in the bazaar
  let   processed   = 0;
  let   errors      = 0;

  // Determine if we're in download mode (getData is async)
  // We detect this by checking the local dir flag again:
  const localExists = fs.existsSync(LOCAL_ITEMS_DIR) && fs.statSync(LOCAL_ITEMS_DIR).isDirectory();

  if (localExists) {
    // --- Synchronous local mode ---
    for (const src of sources) {
      try {
        const item = src.getData();
        processItem(item, index, bazaarIds, bazaarMatch);
        processed++;
        if (processed % 500 === 0) {
          process.stdout.write(`\r[progress] ${processed} / ${sources.length}`);
        }
      } catch (err) {
        errors++;
        if (errors <= 10) console.warn(`\n[error] ${src.filename}: ${err.message}`);
      }
    }
    process.stdout.write('\n');
  } else {
    // --- Async download mode (rate-limited) ---
    const CONCURRENCY = 20; // parallel download slots
    let idx = 0;

    async function worker() {
      while (idx < sources.length) {
        const src = sources[idx++];
        try {
          const item = await src.getData();
          processItem(item, index, bazaarIds, bazaarMatch);
          processed++;
          if (processed % 50 === 0) {
            process.stdout.write(`\r[progress] ${processed} / ${sources.length}`);
          }
        } catch (err) {
          errors++;
          if (errors <= 10) console.warn(`\n[error] ${src.filename}: ${err.message}`);
        }
      }
    }

    const workers = Array.from({ length: CONCURRENCY }, () => worker());
    await Promise.all(workers);
    process.stdout.write('\n');
  }

  // Write outputs
  const sortedIndex = Object.fromEntries(
    Object.keys(index).sort().map((k) => [k, index[k]])
  );

  fs.writeFileSync(OUT_INDEX, JSON.stringify(sortedIndex, null, 2), 'utf8');
  console.log(`\n[output] items_index.json   — ${Object.keys(sortedIndex).length} items → ${OUT_INDEX}`);

  const sortedBazaar = bazaarMatch.sort();
  fs.writeFileSync(OUT_BAZAAR_IDS, JSON.stringify(sortedBazaar, null, 2), 'utf8');
  console.log(`[output] items_bazaar_ids.json — ${sortedBazaar.length} bazaar items → ${OUT_BAZAAR_IDS}`);

  if (errors > 0) console.warn(`\n[warn] ${errors} files failed to parse.`);
  console.log('\nDone.');
}

/** Extract fields from a parsed item object and add to the index. */
function processItem(item, index, bazaarIds, bazaarMatch) {
  const id = item.internalname;
  if (!id) return; // skip malformed entries

  const name     = stripCodes(item.displayname || '');
  // Keep full lore WITH §-codes so the modal can render Minecraft colors.
  // Filter completely blank lines (empty string or only whitespace).
  const loreArr  = (Array.isArray(item.lore) ? item.lore : []).filter(
    (l) => typeof l === 'string'
  );
  const category = deriveCategory(item);

  index[id] = { name, lore: loreArr, category };

  if (bazaarIds.has(id)) {
    bazaarMatch.push(id);
  }
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});

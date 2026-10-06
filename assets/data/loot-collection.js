// Named drops retain the existing combat stats, perks and mesh families.
export const COLLECTION_CHANCE = .25, COLLECTION_GUARANTEE = 4;
export const COLLECTION_ITEMS = Object.freeze([
  {
    "id": "scrapfang",
    "name": "Scrapfang Edge",
    "slot": "weapon",
    "rarity": "common",
    "noun": "Edge",
    "minLevel": 1
  },
  {
    "id": "thornbite",
    "name": "Thornbite Fang",
    "slot": "weapon",
    "rarity": "uncommon",
    "noun": "Fang",
    "minLevel": 1
  },
  {
    "id": "frostbite",
    "name": "Frostbite Edge",
    "slot": "weapon",
    "rarity": "rare",
    "noun": "Edge",
    "theme": "Frostbound",
    "minLevel": 10
  },
  {
    "id": "voidcleaver",
    "name": "Voidcleaver Fang",
    "slot": "weapon",
    "rarity": "epic",
    "noun": "Fang",
    "theme": "Riftforged",
    "minLevel": 22
  },
  {
    "id": "sunspike",
    "name": "Sunspike Focus",
    "slot": "weapon",
    "rarity": "legendary",
    "noun": "Focus",
    "theme": "Solar",
    "minLevel": 36
  },
  {
    "id": "bloodreaver",
    "name": "Bloodreaver Fang",
    "slot": "weapon",
    "rarity": "mythic",
    "noun": "Fang",
    "minLevel": 64
  },
  {
    "id": "tidecaller",
    "name": "Tidecaller Focus",
    "slot": "weapon",
    "rarity": "ancient",
    "noun": "Focus",
    "minLevel": 84
  },
  {
    "id": "starfall",
    "name": "Starfall Edge",
    "slot": "weapon",
    "rarity": "divine",
    "noun": "Edge",
    "theme": "Celestial",
    "minLevel": 100
  },
  {
    "id": "frostwarden",
    "name": "Frostwarden Helm",
    "slot": "helmet",
    "rarity": "rare",
    "noun": "Helm",
    "theme": "Frostbound",
    "minLevel": 10
  },
  {
    "id": "veilmantle",
    "name": "Veilmantle Hood",
    "slot": "helmet",
    "rarity": "epic",
    "noun": "Hood",
    "theme": "Riftforged",
    "minLevel": 22
  },
  {
    "id": "dawnguard",
    "name": "Dawnguard Helm",
    "slot": "helmet",
    "rarity": "legendary",
    "noun": "Helm",
    "theme": "Solar",
    "minLevel": 36
  },
  {
    "id": "seraphcrown",
    "name": "Seraphcrown Helm",
    "slot": "helmet",
    "rarity": "divine",
    "noun": "Helm",
    "theme": "Celestial",
    "minLevel": 100
  },
  {
    "id": "glacierguard",
    "name": "Glacierguard Plate",
    "slot": "chest",
    "rarity": "rare",
    "noun": "Plate",
    "theme": "Frostbound",
    "minLevel": 10
  },
  {
    "id": "riftweave",
    "name": "Riftweave Robe",
    "slot": "chest",
    "rarity": "epic",
    "noun": "Robe",
    "theme": "Riftforged",
    "minLevel": 22
  },
  {
    "id": "sunward",
    "name": "Sunward Plate",
    "slot": "chest",
    "rarity": "legendary",
    "noun": "Plate",
    "theme": "Solar",
    "minLevel": 36
  },
  {
    "id": "heavenshield",
    "name": "Heavenshield Plate",
    "slot": "chest",
    "rarity": "divine",
    "noun": "Plate",
    "theme": "Celestial",
    "minLevel": 100
  },
  {
    "id": "frostmarch",
    "name": "Frostmarch Treads",
    "slot": "boots",
    "rarity": "rare",
    "noun": "Treads",
    "theme": "Frostbound",
    "minLevel": 10
  },
  {
    "id": "voidstep",
    "name": "Voidstep Striders",
    "slot": "boots",
    "rarity": "epic",
    "noun": "Striders",
    "theme": "Riftforged",
    "minLevel": 22
  },
  {
    "id": "solarmarch",
    "name": "Solarmarch Boots",
    "slot": "boots",
    "rarity": "legendary",
    "noun": "Boots",
    "theme": "Solar",
    "minLevel": 36
  },
  {
    "id": "skystride",
    "name": "Skystride Striders",
    "slot": "boots",
    "rarity": "divine",
    "noun": "Striders",
    "theme": "Celestial",
    "minLevel": 100
  },
  {
    "id": "winterheart",
    "name": "Winterheart Charm",
    "slot": "accessory",
    "rarity": "rare",
    "noun": "Charm",
    "theme": "Frostbound",
    "elem": "ice",
    "minLevel": 10
  },
  {
    "id": "voidseal",
    "name": "Voidseal Amulet",
    "slot": "accessory",
    "rarity": "epic",
    "noun": "Amulet",
    "theme": "Riftforged",
    "elem": "storm",
    "minLevel": 22
  },
  {
    "id": "sunheart",
    "name": "Sunheart Ring",
    "slot": "accessory",
    "rarity": "legendary",
    "noun": "Ring",
    "theme": "Solar",
    "elem": "fire",
    "minLevel": 36
  },
  {
    "id": "seraphseal",
    "name": "Seraphseal Amulet",
    "slot": "accessory",
    "rarity": "divine",
    "noun": "Amulet",
    "theme": "Celestial",
    "elem": "storm",
    "minLevel": 100
  }
]);
const COLLECTION_BY_ID = new Map(COLLECTION_ITEMS.map(d => [d.id, d]));
const COLLECTION_POOLS = new Map();
for (const d of COLLECTION_ITEMS) {
  const key = d.slot + '|' + d.rarity;
  if (!COLLECTION_POOLS.has(key)) COLLECTION_POOLS.set(key, []);
  COLLECTION_POOLS.get(key).push(d);
}
export function collectionItem(it) {
  const d = it && COLLECTION_BY_ID.get(it.collectionId);
  return d && d.slot === it.slot && d.rarity === it.rarity ? d : null;
}
export function collectionIcon(it) {
  const d = collectionItem(it);
  return d ? 'assets/ui/collection-v1/' + d.id + '.webp' : '';
}
export function recordCollectionItem(p, it, now = Date.now()) {
  const d = collectionItem(it); if (!d) return false;
  p.collection ||= {};
  const previous = p.collection[d.id];
  p.collection[d.id] = { firstSeen: previous?.firstSeen || now, count: Math.min(1000000000, (previous?.count || 0) + 1) };
  return true;
}
export function rollCollectionItem(p, it, random = Math.random) {
  if (collectionItem(it)) return false;
  const key = it.slot + '|' + it.rarity;
  const pool = (COLLECTION_POOLS.get(key) || []).filter(d => it.ilvl >= d.minLevel);
  if (!pool.length) return false;
  p.collectionLuck ||= {}; p.collection ||= {};
  const misses = Math.max(0, Math.min(COLLECTION_GUARANTEE - 1, p.collectionLuck[key] | 0));
  if (misses < COLLECTION_GUARANTEE - 1 && random() >= COLLECTION_CHANCE) {
    p.collectionLuck[key] = misses + 1; return false;
  }
  const missing = pool.filter(d => !p.collection[d.id]), choices = missing.length ? missing : pool;
  const d = choices[Math.min(choices.length - 1, Math.floor(random() * choices.length))];
  it.collectionId = d.id; it.name = d.name;
  if (d.elem) it.elem = d.elem;
  p.collectionLuck[key] = 0;
  return true;
}
export function migrateCollection(p) {
  const found = p.collection && typeof p.collection === 'object' ? p.collection : {}, clean = {};
  for (const d of COLLECTION_ITEMS) {
    const record = found[d.id];
    if (record && Number.isFinite(record.count) && record.count > 0)
      clean[d.id] = { firstSeen: Number.isFinite(record.firstSeen) && record.firstSeen > 0 ? record.firstSeen : Date.now(), count: Math.min(1000000000, Math.floor(record.count)) };
  }
  p.collection = clean;
  const oldLuck = p.collectionLuck || {}; p.collectionLuck = {};
  for (const key of COLLECTION_POOLS.keys()) p.collectionLuck[key] = Math.max(0, Math.min(COLLECTION_GUARANTEE - 1, oldLuck[key] | 0));
  for (const it of [...Object.values(p.gear || {}), ...(Array.isArray(p.bag) ? p.bag : [])]) {
    const d = collectionItem(it); if (d && !p.collection[d.id]) recordCollectionItem(p, it);
  }
  return p;
}
export function regionBossCase(key, zone) {
  return key === 'boss' ? ({2: 'frost', 3: 'ember', 6: 'celestial'}[zone] || key) : key;
}

#!/usr/bin/env node

const { pbkdf2Sync, randomBytes } = require("node:crypto");
const { existsSync, readFileSync } = require("node:fs");
const path = require("node:path");
const { Client } = require("pg");

const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env.local");
const schemaPath = path.join(root, "database", "schema.sql");
const credentialsPath = path.join(root, "DEMO_ACCOUNTS.md");
const currentYear = new Date().getUTCFullYear();

const accounts = [
  {
    key: "government-owner",
    id: "USR-DEMO-GOV-TB",
    name: "City of Thunder Bay Screen Operations",
    role: "institutional",
    operatorLimit: 4,
  },
  {
    key: "government-operator-primary",
    id: "USR-DEMO-GOV-OP-01",
    name: "Maya Chen — Civic Screen Operator",
    role: "operator",
    institutionKey: "government-owner",
  },
  {
    key: "government-operator-backup",
    id: "USR-DEMO-GOV-OP-02",
    name: "Noah Martin — Civic Communications",
    role: "operator",
    institutionKey: "government-owner",
  },
  {
    key: "institution-owner",
    id: "USR-DEMO-INST-LU",
    name: "Lakehead University Campus Media",
    role: "institutional",
    operatorLimit: 3,
  },
  {
    key: "institution-operator",
    id: "USR-DEMO-INST-OP-01",
    name: "Priya Singh — Campus Media Operator",
    role: "operator",
    institutionKey: "institution-owner",
  },
  {
    key: "advertiser-local",
    id: "USR-DEMO-ADV-01",
    name: "Northline Fitness Marketing",
    role: "advertiser",
  },
  {
    key: "advertiser-retail",
    id: "USR-DEMO-ADV-02",
    name: "Atlas Grocery Campaign Team",
    role: "advertiser",
  },
  {
    key: "advertiser-agency",
    id: "USR-DEMO-ADV-03",
    name: "North Shore Media Buying",
    role: "advertiser",
  },
];

const devices = [
  {
    id: "INV-DEMO-STATIC-001", institutionKey: "government-owner", managerKey: "government-operator-primary",
    name: "Memorial Avenue Bulletin Face", format: "static", deliveryMode: "static", productType: "poster-face",
    x: 67.305, y: 40.93, address: "Memorial Avenue at Central Avenue, Thunder Bay, ON", price: 540,
    impressions: 126000, traffic: 91000, income: 72000, audience: "Drivers, retail visitors, and commuters",
    competitor: "Medium", occupancy: 18, imageInterval: 6, maxLoopSeconds: 120, approvalStatus: "approved",
    productionLeadDays: 8, installationLeadDays: 4, tags: ["large", "physical", "static", "retail", "high-traffic"], displayTemplate: "fullscreen",
    specification: { trimWidthMm: 3048, trimHeightMm: 1524, visibleWidthMm: 2946, visibleHeightMm: 1422, bleedMm: 25, safeAreaMm: 76, scaleRatio: "1:10", minimumDpi: 300, colourSpace: "CMYK", acceptedFileTypes: ["application/pdf", "image/jpeg"], maximumFileBytes: 524288000, substrate: "13 oz vinyl", finishing: "hemmed and grommeted", notes: "Face-specific operator specification; verify current template before production." },
  },
  {
    id: "INV-DEMO-STATIC-002", institutionKey: "institution-owner", managerKey: "institution-operator",
    name: "Balmoral Campus Poster Face", format: "static", deliveryMode: "static", productType: "campus-poster",
    x: 67.274, y: 40.908, address: "Balmoral Street campus entrance, Thunder Bay, ON", price: 320,
    impressions: 61000, traffic: 44000, income: 63000, audience: "Students, staff, and campus visitors",
    competitor: "Low", occupancy: 12, imageInterval: 6, maxLoopSeconds: 120, approvalStatus: "approved",
    productionLeadDays: 6, installationLeadDays: 3, tags: ["medium", "physical", "static", "campus", "students"], displayTemplate: "fullscreen",
    specification: { trimWidthMm: 1219, trimHeightMm: 1829, visibleWidthMm: 1168, visibleHeightMm: 1778, bleedMm: 13, safeAreaMm: 38, scaleRatio: "1:4", minimumDpi: 200, colourSpace: "CMYK", acceptedFileTypes: ["application/pdf"], maximumFileBytes: 262144000, substrate: "weatherproof poster stock", finishing: "operator supplied frame", notes: "Campus face specification; dimensions differ from Memorial Avenue." },
  },
  {
    id: "INV-DEMO-GOV-001",
    institutionKey: "government-owner",
    managerKey: "government-operator-primary",
    name: "Thunder Bay City Hall Civic Screen",
    format: "digital",
    x: 67.29117,
    y: 40.95185,
    address: "500 Donald Street East, Thunder Bay, ON",
    price: 470,
    impressions: 88000,
    traffic: 57000,
    income: 69000,
    audience: "Civic visitors, residents, and downtown workers",
    competitor: "Low",
    occupancy: 28,
    imageInterval: 10,
    maxLoopSeconds: 100,
    approvalStatus: "approved",
    tags: ["medium", "digital", "government", "civic", "downtown", "public-space", "accessible"],
    displayTemplate: "public-info",
  },
  {
    id: "INV-DEMO-GOV-002",
    institutionKey: "government-owner",
    managerKey: "government-operator-primary",
    name: "Marina Park Community Display",
    format: "digital",
    x: 67.32117,
    y: 40.86431,
    address: "Marina Park Drive, Thunder Bay, ON",
    price: 620,
    impressions: 114000,
    traffic: 68000,
    income: 87000,
    audience: "Residents, tourists, families, and event visitors",
    competitor: "Medium",
    occupancy: 34,
    imageInterval: 9,
    maxLoopSeconds: 120,
    approvalStatus: "approved",
    tags: ["medium", "digital", "government", "waterfront", "tourism", "events", "public-space"],
    displayTemplate: "community",
  },
  {
    id: "INV-DEMO-GOV-003",
    institutionKey: "government-owner",
    managerKey: "government-operator-backup",
    name: "Water Street Transit Terminal Display",
    format: "transit",
    x: 67.3005,
    y: 40.887,
    address: "Water Street Transit Terminal, Thunder Bay, ON",
    price: 410,
    impressions: 102000,
    traffic: 83000,
    income: 64000,
    audience: "Transit riders, students, and downtown commuters",
    competitor: "Low",
    occupancy: 42,
    imageInterval: 8,
    maxLoopSeconds: 120,
    approvalStatus: "approved",
    tags: ["small", "digital", "government", "transit", "commuters", "students", "high-traffic"],
    displayTemplate: "transit",
  },
  {
    id: "INV-DEMO-INST-001",
    institutionKey: "institution-owner",
    managerKey: "institution-operator",
    name: "Lakehead University Agora Screen",
    format: "digital",
    x: 67.28175,
    y: 40.89,
    address: "955 Oliver Road, Thunder Bay, ON",
    price: 430,
    impressions: 96000,
    traffic: 74000,
    income: 61000,
    audience: "Students, faculty, staff, and campus visitors",
    competitor: "Low",
    occupancy: 46,
    imageInterval: 8,
    maxLoopSeconds: 120,
    approvalStatus: "approved",
    tags: ["medium", "digital", "institutional", "campus", "students", "18-34", "indoor"],
    displayTemplate: "community",
  },
  {
    id: "INV-DEMO-INST-002",
    institutionKey: "institution-owner",
    managerKey: "institution-operator",
    name: "Lakehead Athletics Centre Entrance Display",
    format: "digital",
    x: 67.2875,
    y: 40.902,
    address: "Lakehead University Athletics Centre, Thunder Bay, ON",
    price: 390,
    impressions: 72000,
    traffic: 51000,
    income: 59000,
    audience: "Students, athletes, families, and event attendees",
    competitor: "Medium",
    occupancy: 38,
    imageInterval: 10,
    maxLoopSeconds: 120,
    approvalStatus: "approved",
    tags: ["small", "digital", "institutional", "campus", "sports", "events", "indoor"],
    displayTemplate: "weather",
  },
  {
    id: "INV-DEMO-INST-003",
    institutionKey: "institution-owner",
    managerKey: "institution-owner",
    name: "Lakehead University Transit Shelter",
    format: "transit",
    x: 67.278,
    y: 40.895,
    address: "Lakehead University Main Campus Transit Stop, Thunder Bay, ON",
    price: 360,
    impressions: 84000,
    traffic: 67000,
    income: 57000,
    audience: "Students, faculty, and transit riders",
    competitor: "Low",
    occupancy: 31,
    imageInterval: 8,
    maxLoopSeconds: 120,
    approvalStatus: "approved",
    tags: ["small", "digital", "institutional", "campus", "transit", "students", "outdoor"],
    displayTemplate: "transit",
  },
];

function parseEnv(filePath) {
  if (!existsSync(filePath)) return {};
  return Object.fromEntries(readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^(['"])(.*)\1$/, "$2")];
    }));
}

function parseCredentials(filePath) {
  if (!existsSync(filePath)) {
    throw new Error("DEMO_ACCOUNTS.md was not found. It is a required local-only file and must never be committed.");
  }

  const credentials = new Map();
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    if (!line.trim().startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim().replace(/^`(.*)`$/, "$1"));
    const [id, , email, password] = cells;
    if (id?.startsWith("USR-DEMO-")) credentials.set(id, { email, password });
  }

  for (const account of accounts) {
    const entry = credentials.get(account.id);
    if (!entry?.email || !entry?.password) throw new Error(`Missing local credentials for ${account.id} in DEMO_ACCOUNTS.md.`);
  }
  return credentials;
}

function hashPassword(password) {
  const iterations = 120000;
  const salt = randomBytes(16).toString("hex");
  const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256").toString("hex");
  return `${iterations}:${salt}:${hash}`;
}

async function upsertAccount(client, account, savedByKey) {
  const institutionId = account.institutionKey ? savedByKey.get(account.institutionKey)?.id : null;
  if (account.institutionKey && !institutionId) {
    throw new Error(`Institution ${account.institutionKey} must be seeded before ${account.key}.`);
  }

  const collision = await client.query(
    "SELECT id, email FROM users WHERE id = $1 OR email = $2",
    [account.id, account.email],
  );
  if (collision.rows.some((entry) => entry.id !== account.id || entry.email !== account.email)) {
    throw new Error(`Stable demo identity collision for ${account.id} / ${account.email}.`);
  }

  const result = await client.query(`
    INSERT INTO users
      (id, name, email, password_hash, role, status, institution_id, operator_limit, created_at)
    VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      email = EXCLUDED.email,
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      status = 'active',
      institution_id = EXCLUDED.institution_id,
      operator_limit = EXCLUDED.operator_limit
    RETURNING id, name, email, role, status, institution_id, operator_limit
  `, [
    account.id,
    account.name,
    account.email,
    hashPassword(account.password),
    account.role,
    account.role === "operator" ? institutionId : null,
    account.role === "institutional" ? account.operatorLimit ?? 0 : 0,
    new Date().toISOString(),
  ]);
  return result.rows[0];
}

async function upsertDevice(client, device, savedByKey, now) {
  const institution = savedByKey.get(device.institutionKey);
  const manager = savedByKey.get(device.managerKey);
  if (!institution || institution.role !== "institutional") throw new Error(`Invalid owner for ${device.id}.`);
  if (!manager || (manager.id !== institution.id && manager.institution_id !== institution.id)) {
    throw new Error(`Manager ${device.managerKey} is outside the owning institution for ${device.id}.`);
  }

  await client.query(`
    INSERT INTO inventory
      (id, name, operator, format, x, y, address, price, impressions, traffic, income, audience, competitor, occupancy,
       image_interval, max_loop_seconds, available_from, available_to, approval_status, tags, display_template,
       comments_enabled, institution_id, created_by, created_at, updated_at, owner_organization_id, delivery_mode, product_type, production_lead_days, installation_lead_days)
    VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20::jsonb, $21,
       TRUE, $22, $23, $24, $24, $25, $26, $27, $28, $29)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      operator = EXCLUDED.operator,
      format = EXCLUDED.format,
      x = EXCLUDED.x,
      y = EXCLUDED.y,
      address = EXCLUDED.address,
      price = EXCLUDED.price,
      impressions = EXCLUDED.impressions,
      traffic = EXCLUDED.traffic,
      income = EXCLUDED.income,
      audience = EXCLUDED.audience,
      competitor = EXCLUDED.competitor,
      occupancy = EXCLUDED.occupancy,
      image_interval = EXCLUDED.image_interval,
      max_loop_seconds = EXCLUDED.max_loop_seconds,
      available_from = EXCLUDED.available_from,
      available_to = EXCLUDED.available_to,
      approval_status = EXCLUDED.approval_status,
      tags = EXCLUDED.tags,
      display_template = EXCLUDED.display_template,
      comments_enabled = EXCLUDED.comments_enabled,
      institution_id = EXCLUDED.institution_id,
      created_by = EXCLUDED.created_by,
      updated_at = EXCLUDED.updated_at
      ,owner_organization_id = EXCLUDED.owner_organization_id
      ,delivery_mode = EXCLUDED.delivery_mode
      ,product_type = EXCLUDED.product_type
      ,production_lead_days = EXCLUDED.production_lead_days
      ,installation_lead_days = EXCLUDED.installation_lead_days
  `, [
    device.id,
    device.name,
    institution.name,
    device.format,
    device.x,
    device.y,
    device.address,
    device.price,
    device.impressions,
    device.traffic,
    device.income,
    device.audience,
    device.competitor,
    device.occupancy,
    device.imageInterval,
    device.maxLoopSeconds,
    `${currentYear}-01-01`,
    `${currentYear + 1}-12-31`,
    device.approvalStatus,
    JSON.stringify(device.tags),
    device.displayTemplate,
    institution.id,
    manager.id,
    now,
    `ORG-${institution.id}`,
    device.deliveryMode ?? (device.format === "digital" ? "digital" : "unknown"),
    device.productType ?? device.format,
    device.productionLeadDays ?? 0,
    device.installationLeadDays ?? 0,
  ]);

  if (device.specification) {
    const spec = device.specification;
    await client.query("UPDATE inventory_specifications SET status = 'retired' WHERE inventory_id = $1", [device.id]);
    await client.query(`INSERT INTO inventory_specifications
      (id, inventory_id, version, status, trim_width_mm, trim_height_mm, visible_width_mm, visible_height_mm, bleed_mm, safe_area_mm, scale_ratio, minimum_dpi, colour_space, accepted_file_types, maximum_file_bytes, substrate, finishing, notes, created_by, created_at)
      VALUES ($1,$2,1,'active',$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13,$14,$15,$16,$17,$18)
      ON CONFLICT (inventory_id, version) DO UPDATE SET status='active', trim_width_mm=EXCLUDED.trim_width_mm, trim_height_mm=EXCLUDED.trim_height_mm, visible_width_mm=EXCLUDED.visible_width_mm, visible_height_mm=EXCLUDED.visible_height_mm, bleed_mm=EXCLUDED.bleed_mm, safe_area_mm=EXCLUDED.safe_area_mm, scale_ratio=EXCLUDED.scale_ratio, minimum_dpi=EXCLUDED.minimum_dpi, colour_space=EXCLUDED.colour_space, accepted_file_types=EXCLUDED.accepted_file_types, maximum_file_bytes=EXCLUDED.maximum_file_bytes, substrate=EXCLUDED.substrate, finishing=EXCLUDED.finishing, notes=EXCLUDED.notes`,
      [`SPEC-${device.id}`, device.id, spec.trimWidthMm, spec.trimHeightMm, spec.visibleWidthMm, spec.visibleHeightMm, spec.bleedMm, spec.safeAreaMm, spec.scaleRatio, spec.minimumDpi, spec.colourSpace, JSON.stringify(spec.acceptedFileTypes), spec.maximumFileBytes, spec.substrate, spec.finishing, spec.notes, manager.id, now]);
  }
}

async function main() {
  const credentials = parseCredentials(credentialsPath);
  const seededAccounts = accounts.map((account) => ({ ...account, ...credentials.get(account.id) }));
  const env = { ...parseEnv(envPath), ...process.env };
  const connectionString = env.DATABASE_URL ?? env.POSTGRES_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not configured.");

  const databaseUrl = new URL(connectionString);
  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
  if ((!localHosts.has(databaseUrl.hostname) || env.NODE_ENV === "production") && env.ALLOW_REMOTE_DEMO_DATA !== "1") {
    throw new Error("Refusing to seed demo data outside a local development database. Set ALLOW_REMOTE_DEMO_DATA=1 only when this is intentional.");
  }

  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query("BEGIN");
    await client.query(readFileSync(schemaPath, "utf8"));

    const savedByKey = new Map();
    for (const account of seededAccounts.filter((entry) => entry.role === "institutional")) {
      savedByKey.set(account.key, await upsertAccount(client, account, savedByKey));
    }
    for (const account of seededAccounts.filter((entry) => entry.role !== "institutional")) {
      savedByKey.set(account.key, await upsertAccount(client, account, savedByKey));
    }

    for (const account of seededAccounts) {
      const saved = savedByKey.get(account.key);
      const institution = account.institutionKey ? savedByKey.get(account.institutionKey) : null;
      const organizationId = institution ? `ORG-${institution.id}` : `ORG-${saved.id}`;
      if (!institution) {
        const organizationType = account.key === "advertiser-agency" ? "agency" : account.role === "advertiser" ? "advertiser" : account.role === "institutional" ? "institution" : "media_owner";
        await client.query("INSERT INTO organizations (id,name,type,status,created_at,updated_at) VALUES ($1,$2,$3,'active',NOW()::text,NOW()::text) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,type=EXCLUDED.type,updated_at=EXCLUDED.updated_at", [organizationId, saved.name, organizationType]);
      }
      await client.query("INSERT INTO organization_memberships (organization_id,user_id,membership_role,created_at) VALUES ($1,$2,$3,NOW()::text) ON CONFLICT (organization_id,user_id) DO UPDATE SET membership_role=EXCLUDED.membership_role", [organizationId, saved.id, account.role === "operator" ? "operations" : "owner"]);
    }

    const agency = savedByKey.get("advertiser-agency");
    await client.query("INSERT INTO agency_clients (id,agency_organization_id,name,status,created_at,updated_at) VALUES ('CLI-DEMO-NORTH-SHORE-01',$1,'Harbour Dental Group','active',NOW()::text,NOW()::text) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,status='active',updated_at=EXCLUDED.updated_at", [`ORG-${agency.id}`]);
    await client.query("INSERT INTO brands (id,client_id,name,default_language,created_at,updated_at) VALUES ('BRD-DEMO-HARBOUR-01','CLI-DEMO-NORTH-SHORE-01','Harbour Smiles','en',NOW()::text,NOW()::text) ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name,updated_at=EXCLUDED.updated_at");

    const now = new Date().toISOString();
    for (const device of devices) await upsertDevice(client, device, savedByKey, now);

    await client.query("DELETE FROM sessions WHERE user_id = ANY($1::text[])", [seededAccounts.map((account) => account.id)]);

    const verification = await client.query(`
      SELECT inventory.id, inventory.institution_id, inventory.created_by
      FROM inventory
      WHERE inventory.id = ANY($1::text[])
    `, [devices.map((device) => device.id)]);
    if (verification.rowCount !== devices.length) throw new Error("Not all demo devices were persisted.");

    await client.query("COMMIT");
    console.log(`Created or updated ${seededAccounts.length} demo users and ${devices.length} demo devices.`);
    console.log("Reference: docs/DEMO_USERS_AND_DEVICES.md");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`[seed:demo-data] ${error.message}`);
  process.exit(1);
});

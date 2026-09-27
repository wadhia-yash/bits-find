/**
 * Phase verification — `npm run verify`.
 *
 * Loads src/config and src/services under each of the three phases with the
 * native modules stubbed out, then walks the full closed loop on every one:
 * seed -> report lost -> finder match -> owner accepts -> owner confirms
 * returned. On top of the flow it asserts the phase gates, so a feature that
 * leaks into an earlier phase (or goes missing from a later one) fails here
 * rather than during a review.
 *
 * Dependency-free: TypeScript is transpiled through the compiler that already
 * ships with the project, and every native module is replaced by a stub.
 */
const fs = require('fs');
const path = require('path');
const Module = require('module');

const ROOT = path.join(__dirname, '..');
const ts = require(path.join(ROOT, 'node_modules', 'typescript'));

/* ------------------------------------------------------------------ stubs */

let PHASE = 3;
let FIREBASE_CONFIGURED = false;
const asyncCells = new Map();

const asyncStorageStub = {
  __esModule: true,
  default: {
    async getItem(k) { return asyncCells.has(k) ? asyncCells.get(k) : null; },
    async setItem(k, v) { asyncCells.set(k, v); },
    async removeItem(k) { asyncCells.delete(k); },
    async multiRemove(ks) { ks.forEach((k) => asyncCells.delete(k)); },
  },
};

function constantsStub() {
  const extra = { phase: PHASE };
  if (FIREBASE_CONFIGURED) {
    extra.firebase = {
      apiKey: 'k', authDomain: 'a', projectId: 'p',
      storageBucket: 's', messagingSenderId: 'm', appId: 'i',
    };
  }
  return {
    __esModule: true,
    default: { expoConfig: { extra }, executionEnvironment: 'bare' },
    ExecutionEnvironment: { StoreClient: 'storeClient', Standalone: 'standalone', Bare: 'bare' },
  };
}

const noop = () => {};
const firebaseAppStub = {
  __esModule: true,
  getApps: () => [], getApp: () => ({}), initializeApp: () => ({}),
};
const firebaseAuthStub = {
  __esModule: true,
  getAuth: () => ({}), initializeAuth: () => ({}),
  createUserWithEmailAndPassword: noop, onAuthStateChanged: noop,
  sendEmailVerification: noop, sendPasswordResetEmail: noop,
  signInWithEmailAndPassword: noop, signOut: noop, updateProfile: noop,
};
const firestoreStub = {
  __esModule: true,
  getFirestore: () => ({}), collection: noop, collectionGroup: noop, doc: noop,
  addDoc: noop, getDoc: noop, getDocs: noop, limit: noop, orderBy: noop,
  query: noop, setDoc: noop, updateDoc: noop, where: noop, serverTimestamp: noop,
};
const storageStub = {
  __esModule: true,
  getStorage: () => ({}), ref: noop, uploadBytes: noop, getDownloadURL: noop,
};

const STUBS = {
  '@react-native-async-storage/async-storage': () => asyncStorageStub,
  'expo-constants': constantsStub,
  'firebase/app': () => firebaseAppStub,
  'firebase/auth': () => firebaseAuthStub,
  'firebase/firestore': () => firestoreStub,
  'firebase/storage': () => storageStub,
  'expo-image-manipulator': () => ({ __esModule: true, ImageManipulator: {}, SaveFormat: { JPEG: 'jpeg' } }),
  'expo-notifications': () => { throw new Error('expo-notifications unavailable in test'); },
};

/* --------------------------------------------------------- module loading */

const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (STUBS[request]) return `\u0000stub:${request}`;
  return originalResolve.call(this, request, ...rest);
};

const originalLoad = Module._load;
Module._load = function (request, ...rest) {
  if (STUBS[request]) return STUBS[request]();
  return originalLoad.call(this, request, ...rest);
};

require.extensions['.ts'] = require.extensions['.tsx'] = function (mod, filename) {
  const src = fs.readFileSync(filename, 'utf8');
  const out = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      jsx: ts.JsxEmit.React,
    },
    fileName: filename,
  }).outputText;
  mod._compile(out, filename);
};

const SRC = path.resolve(ROOT, 'src');
function resetModules() {
  for (const key of Object.keys(require.cache)) {
    if (path.resolve(key).startsWith(SRC)) delete require.cache[key];
  }
}
function load(rel) {
  return require(path.join(ROOT, rel));
}
function freshLoad(rel) {
  resetModules();
  return load(rel);
}

/* ------------------------------------------------------------------ asserts */

let failures = 0;
function check(label, condition, detail) {
  if (condition) {
    console.log(`   ok   ${label}`);
  } else {
    console.error(`   FAIL ${label}${detail ? ` — ${detail}` : ''}`);
    failures++;
  }
}

/* --------------------------------------------------- flag usage in source */

/**
 * A mistyped flag — `features.photo` for `features.photos` — is `undefined`,
 * which reads as false and silently hides the feature in every phase. Nothing
 * at runtime notices, so it is checked here against the declared feature set.
 */
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

function verifyFlagUsage() {
  console.log('\n=== Feature flag usage ===');
  resetModules();
  PHASE = 3;
  const { features } = load('src/config/phase.ts');
  const declared = new Set(Object.keys(features));

  const used = new Map();
  for (const file of walk(SRC)) {
    if (path.resolve(file) === path.resolve(SRC, 'config', 'phase.ts')) continue;
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(/\bfeatures\.([A-Za-z0-9_]+)/g)) {
      if (!used.has(m[1])) used.set(m[1], []);
      used.get(m[1]).push(path.relative(ROOT, file));
    }
  }

  const unknown = [...used.keys()].filter((k) => !declared.has(k));
  check(
    'every features.X in src is declared',
    unknown.length === 0,
    unknown.map((k) => `${k} (${used.get(k)[0]})`).join(', '),
  );

  const unused = [...declared].filter((k) => !used.has(k));
  check(
    'every declared flag is used somewhere',
    unused.length === 0,
    unused.join(', '),
  );

  console.log(`   ${used.size} flags referenced across ${walk(SRC).length} source files`);
}

/* ------------------------------------------------------- feature matrix */

/**
 * The contract docs/PHASE_PLAN.md promises, restated as data. Anything that
 * moves between phases has to be changed here too, on purpose.
 */
const MATRIX = {
  1: {
    persistence: 'memory', cloudBackend: false, accounts: false, passwordReset: false,
    campusChoice: false, demoAccounts: true, advancedFilters: false, statusFilters: false,
    pullToRefresh: false, photos: false, contactModes: false, sensitiveItemWarning: false,
    adminHandover: false, adminCollectionTracking: false, contactUnlock: false,
    cancelRequest: false, campusAlerts: false, pushNotifications: false, contactConsent: false,
    notificationPrefs: false, demoReset: false, expirySweep: false, polishedUi: false,
  },
  2: {
    persistence: 'device', cloudBackend: true, accounts: true, passwordReset: false,
    campusChoice: false, demoAccounts: true, advancedFilters: true, statusFilters: true,
    pullToRefresh: true, photos: true, contactModes: true, sensitiveItemWarning: true,
    adminHandover: true, adminCollectionTracking: false, contactUnlock: true,
    cancelRequest: true, campusAlerts: true, pushNotifications: false, contactConsent: true,
    notificationPrefs: false, demoReset: true, expirySweep: false, polishedUi: true,
  },
  3: {
    persistence: 'device', cloudBackend: true, accounts: true, passwordReset: true,
    campusChoice: true, demoAccounts: true, advancedFilters: true, statusFilters: true,
    pullToRefresh: true, photos: true, contactModes: true, sensitiveItemWarning: true,
    adminHandover: true, adminCollectionTracking: true, contactUnlock: true,
    cancelRequest: true, campusAlerts: true, pushNotifications: true, contactConsent: true,
    notificationPrefs: true, demoReset: true, expirySweep: true, polishedUi: true,
  },
};

function verifyMatrix(phase, features) {
  const expected = MATRIX[phase];
  const keys = new Set([...Object.keys(expected), ...Object.keys(features)]);
  const wrong = [...keys].filter((k) => expected[k] !== features[k]);
  check(
    'feature matrix matches docs/PHASE_PLAN.md',
    wrong.length === 0,
    wrong.map((k) => `${k}=${features[k]} (want ${expected[k]})`).join(', '),
  );
}

/* ------------------------------------------------------------------- flow */

async function runPhase(phase) {
  PHASE = phase;
  FIREBASE_CONFIGURED = false;
  asyncCells.clear();

  console.log(`\n=== Phase ${phase} ===`);

  resetModules();
  const cfg = load('src/config/phase.ts');
  const backend = load('src/services/backend.ts');
  const db = load('src/services/db.ts');
  const notify = load('src/services/notify.ts');

  check('phase resolves', cfg.PHASE === phase, `got ${cfg.PHASE}`);
  verifyMatrix(phase, cfg.features);
  check('local backend in use', backend.isFirebase === false);

  await backend.prepare();

  const ishita = await backend.auth.signInDemo('u_ishita');
  check('demo sign-in works', ishita && ishita.campusId === 'pilani');

  const feed = await backend.items.byCampus('pilani');
  check('seeded Pilani feed is non-empty', feed.length > 0, `${feed.length} items`);

  const goaLeak = feed.filter((i) => i.campusId !== 'pilani');
  check('feed is campus-scoped', goaLeak.length === 0);

  // --- owner reports a lost item
  const created = await backend.items.create({
    campusId: 'pilani',
    ownerId: ishita.uid,
    ownerName: ishita.name,
    title: 'Phase test bottle',
    description: 'Steel bottle with a dented cap and a blue sticker.',
    category: 'Bottle',
    lastSeenZone: 'Library',
    lostAt: new Date().toISOString(),
    contactMode: 'IN_APP',
  });
  check('lost request created as OPEN', created.status === 'OPEN');

  const preview = notify.buildAlertPreview(created);
  check('alert preview is privacy-safe', notify.previewIsPrivacySafe(preview));

  await backend.alerts.create({
    campusId: 'pilani', itemId: created.id, title: preview.title, body: preview.body,
  });
  const alerts = await backend.alerts.byCampus('pilani');
  if (cfg.features.campusAlerts) {
    check('campus alerts recorded', alerts.some((a) => a.itemId === created.id));
  } else {
    check('campus alerts suppressed', alerts.length === 0, `${alerts.length} alerts`);
  }

  const push = await notify.sendCampusAlert(created);
  if (cfg.features.pushNotifications) {
    check('push path reached', push !== null);
  } else {
    check('push suppressed', push === null);
  }

  // --- finder responds
  const aarav = await backend.auth.signInDemo('u_aarav');
  const mode = cfg.features.adminHandover ? 'ADMIN' : 'DIRECT';
  const match = await backend.matches.create({
    itemId: created.id,
    finderId: aarav.uid,
    finderName: aarav.name,
    matchText: 'Blue sticker on the base, found by the reading table.',
    handoverMode: mode,
    adminDropoffStatus: mode === 'ADMIN' ? 'SUBMITTED' : 'NOT_APPLICABLE',
  });
  await backend.handovers.create({
    itemId: created.id, matchId: match.id, finderId: aarav.uid, mode,
    status: mode === 'ADMIN' ? 'SUBMITTED' : 'PENDING',
  });
  await backend.items.update(created.id, ishita.uid, { status: 'CLAIM_PENDING' });
  check('match is PENDING', match.status === 'PENDING');

  // --- owner accepts, then confirms the return
  await backend.matches.update(created.id, match.id, { status: 'ACCEPTED' });
  await backend.matches.update(created.id, match.id, {
    status: 'COMPLETED', completedAt: new Date().toISOString(),
  });
  await backend.items.update(created.id, ishita.uid, { status: 'RETURNED' });

  const closed = await backend.items.byId(created.id, 'pilani');
  check('closed loop ends at RETURNED', closed.status === 'RETURNED');

  const foreign = await backend.items.byId(created.id, 'goa');
  check('cross-campus read denied', foreign === undefined);

  // --- ownership rule
  let ownershipHeld = false;
  try {
    await backend.items.update(created.id, aarav.uid, { status: 'OPEN' });
  } catch {
    ownershipHeld = true;
  }
  check('only the owner can edit', ownershipHeld);

  // --- phase gates on auth + tooling
  check('accounts gate', backend.auth.supportsAccounts === false);
  check(
    'password reset gate',
    backend.auth.supportsPasswordReset === false,
  );
  check(
    `demo reset ${cfg.features.demoReset ? 'available' : 'hidden'}`,
    backend.demoData.supported === cfg.features.demoReset,
  );

  // --- resetting demo data must leave the demo accounts usable
  if (cfg.features.demoReset) {
    await backend.demoData.reset();
    let signedBackIn = null;
    try {
      signedBackIn = await backend.auth.signInDemo('u_ishita');
    } catch {
      signedBackIn = null;
    }
    check(
      'demo accounts survive a reset',
      !!signedBackIn,
      'reset cleared the seed and nothing put it back',
    );
    check(
      'reset restores the seeded feed',
      (await backend.items.byCampus('pilani')).length > 0,
    );
  }

  // --- expiry sweep, which only Phase 3 runs
  const stale = await db.itemsRepo.create({
    campusId: 'pilani', ownerId: ishita.uid, ownerName: ishita.name,
    title: 'Stale request', description: 'Should expire after fourteen days.',
    category: 'Other', lastSeenZone: 'Library',
    lostAt: new Date().toISOString(), contactMode: 'IN_APP',
  });
  await db.itemsRepo.update(stale.id, ishita.uid, {
    expiresAt: new Date(Date.now() - 86400000).toISOString(),
  });
  await backend.prepare();
  const sweptItem = await backend.items.byId(stale.id, 'pilani');
  if (cfg.features.expirySweep) {
    check('stale request expired', sweptItem.status === 'EXPIRED', sweptItem.status);
  } else {
    check('no expiry sweep before Phase 3', sweptItem.status === 'OPEN', sweptItem.status);
  }

  // --- persistence: does a cold start keep the data?
  const before = (await backend.items.byCampus('pilani')).length;
  const backend2 = freshLoad('src/services/backend.ts');
  await backend2.prepare();
  const after = (await backend2.items.byCampus('pilani')).length;
  if (cfg.features.persistence === 'memory') {
    check('memory store resets on relaunch', after < before, `${before} -> ${after}`);
  } else {
    check('device store survives relaunch', after === before, `${before} -> ${after}`);
  }
}

/* ------------------------------------------------------- cloud-on sanity */

async function runCloudGate() {
  console.log('\n=== Firebase config present ===');
  FIREBASE_CONFIGURED = true;
  for (const phase of [1, 2, 3]) {
    PHASE = phase;
    asyncCells.clear();
    resetModules();
    const cfg = load('src/config/phase.ts');
    const backend = load('src/services/backend.ts');
    const expected = phase !== 1;
    check(
      `phase ${phase} ${expected ? 'uses' : 'ignores'} Firebase`,
      backend.isFirebase === expected,
      `isFirebase=${backend.isFirebase}`,
    );
    check(
      `phase ${phase} accounts = ${expected}`,
      backend.auth.supportsAccounts === expected,
    );
    check(
      `phase ${phase} password reset = ${phase === 3}`,
      backend.auth.supportsPasswordReset === (phase === 3),
    );
    check(
      `phase ${phase} demo reset hidden on Firebase`,
      backend.demoData.supported === false || phase === 1,
    );
  }
}

/** A missing or nonsensical phase number must land on the capstone build. */
function runFallbacks() {
  console.log('\n=== Phase fallbacks ===');
  for (const bad of [undefined, 'nine', 0, 4]) {
    PHASE = bad;
    resetModules();
    const cfg = load('src/config/phase.ts');
    check(`extra.phase = ${JSON.stringify(bad)} -> Phase 3`, cfg.PHASE === 3, `got ${cfg.PHASE}`);
  }
  PHASE = 3;
}

(async () => {
  for (const phase of [1, 2, 3]) await runPhase(phase);
  await runCloudGate();
  runFallbacks();
  verifyFlagUsage();
  console.log(failures === 0 ? '\nAll phase checks passed.' : `\n${failures} failure(s).`);
  process.exit(failures === 0 ? 0 : 1);
})().catch((e) => {
  console.error('\nHARNESS ERROR:', e);
  process.exit(1);
});

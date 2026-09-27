#!/usr/bin/env node
/**
 * Switches the build between the three delivery phases by rewriting
 * `expo.extra.phase` in app.json.
 *
 *   npm run phase -- 1     Initial POC     (mock data, no backend)
 *   npm run phase -- 2     Advanced POC    (backend + database, polished UI)
 *   npm run phase -- 3     Capstone        (everything)
 *   npm run phase          prints the phase currently configured
 *
 * Deliberately dependency-free and shell-agnostic so it behaves the same in
 * PowerShell, cmd and bash. Restart Metro after switching — app.json is read
 * once at startup.
 */

const fs = require('fs');
const path = require('path');

const APP_JSON = path.join(__dirname, '..', 'app.json');

const NAMES = {
  1: 'Initial POC — core flow on mock data, no backend',
  2: 'Advanced POC — polished UI, real backend and database',
  3: 'Capstone — full product: auth, push, expiry, validations',
};

function read() {
  return JSON.parse(fs.readFileSync(APP_JSON, 'utf8'));
}

function main() {
  const arg = process.argv[2];
  const config = read();
  const current = config.expo.extra && config.expo.extra.phase;

  if (arg === undefined) {
    const phase = current || 3;
    console.log(`Phase ${phase} — ${NAMES[phase]}`);
    console.log('\nSwitch with: npm run phase -- 1 | 2 | 3');
    return;
  }

  const next = Number(arg);
  if (![1, 2, 3].includes(next)) {
    console.error(`"${arg}" is not a phase. Use 1, 2 or 3.`);
    process.exit(1);
  }

  config.expo.extra = { ...(config.expo.extra || {}), phase: next };
  fs.writeFileSync(APP_JSON, `${JSON.stringify(config, null, 2)}\n`, 'utf8');

  console.log(`app.json now builds Phase ${next} — ${NAMES[next]}`);
  console.log('Restart the dev server (npm start) for it to take effect.');
}

main();

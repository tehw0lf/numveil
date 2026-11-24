// Fails when an entry of a package-lock.json lacks `resolved` or `integrity`.
// Usage: node tools/check-lockfile-integrity.mjs [lockfile ...]
// Without arguments the root lockfile and the one of apps/numveil are checked.
import { readFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const defaults = ['package-lock.json', 'apps/numveil/package-lock.json'].map(
  (file) => resolve(root, file),
);
const files = process.argv.length > 2 ? process.argv.slice(2) : defaults;
const maxListed = 50;
const nodeModulesSegment = /(^|\/)node_modules\//;
const hint =
  'Regenerate the lockfile together with node_modules, never the lockfile alone (see "Regenerating the lockfile" in README.md).';

let failed = false;

for (const file of files) {
  const label = relative(process.cwd(), file) || file;
  let lock;
  try {
    lock = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    console.error(`${label}: cannot read or parse: ${error.message}`);
    failed = true;
    continue;
  }
  if (
    typeof lock?.packages !== 'object' ||
    lock.packages === null ||
    Array.isArray(lock.packages)
  ) {
    console.error(`${label}: no "packages" object`);
    failed = true;
    continue;
  }

  const offenders = [];
  for (const [key, entry] of Object.entries(lock.packages)) {
    // Registry entries are the keys with a `node_modules/` segment, also those
    // nested under a workspace or `file:` folder. Entries that carry no tarball
    // are exempt: the root entry, links and bundled dependencies, and the
    // entries of the workspace and `file:` folders themselves, which are keyed
    // by their folder path and have no `node_modules/` segment.
    if (
      key === '' ||
      !nodeModulesSegment.test(key) ||
      entry?.link === true ||
      entry?.inBundle === true
    ) {
      continue;
    }
    const missing = ['resolved', 'integrity'].filter(
      (field) => !entry?.[field],
    );
    if (missing.length > 0) {
      offenders.push(`${key} (missing ${missing.join(', ')})`);
    }
  }

  if (offenders.length > 0) {
    failed = true;
    console.error(
      `${label}: ${offenders.length} entries lack resolved or integrity:`,
    );
    for (const line of offenders.slice(0, maxListed)) {
      console.error(`  ${line}`);
    }
    if (offenders.length > maxListed) {
      console.error(`  ... and ${offenders.length - maxListed} more`);
    }
    console.error(hint);
  } else {
    console.log(`${label}: ok (${Object.keys(lock.packages).length} entries)`);
  }
}

process.exit(failed ? 1 : 0);

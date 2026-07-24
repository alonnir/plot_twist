#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'version.json');
const v = JSON.parse(fs.readFileSync(file, 'utf8'));

// bump patch (reset on minor/major bumps done manually)
const [major, minor, patch] = v.version.split('.').map(Number);
v.version = `${major}.${minor}.${patch + 1}`;
v.build = (v.build || 0) + 1;
v.built = new Date().toISOString();

fs.writeFileSync(file, JSON.stringify(v, null, 2) + '\n');
console.log(`▲ Version bumped to ${v.version} (build #${v.build}) — ${v.built}`);

/* make-account.js — print an accounts.json entry for a district.
   Usage:  node make-account.js <districtId> <password> ["District Name"] [ipPrefix,ipPrefix]
   Example: node make-account.js austin-isd 's3cret!' "Austin ISD" 129.116.,140.168.
   Append the printed object to accounts.json (a JSON array). Never commit real
   accounts.json — see .gitignore. */
'use strict';
const bcrypt = require('bcryptjs');
const [, , id, password, name, ips] = process.argv;
if (!id || !password) { console.error('Usage: node make-account.js <districtId> <password> ["Name"] [ipPrefix,ipPrefix]'); process.exit(1); }
const entry = { id, name: name || id, hash: bcrypt.hashSync(password, 12) };
if (ips) entry.ipAllow = ips.split(',').map(s => s.trim()).filter(Boolean);
console.log(JSON.stringify(entry, null, 2));
console.error('\n^ add this object to the JSON array in accounts.json');

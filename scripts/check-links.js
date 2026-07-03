// Verify every relative href/src in the built HTML resolves to a file on disk.
const fs=require('fs'),path=require('path');
const ROOT=__dirname+'/..';
function walk(d){let o=[];for(const f of fs.readdirSync(d)){const p=path.join(d,f);if(f==='.git'||f==='node_modules')continue;const s=fs.statSync(p);if(s.isDirectory())o=o.concat(walk(p));else if(f.endsWith('.html'))o.push(p);}return o;}
let missing=0,checked=0;
for(const file of walk(ROOT)){
  const html=fs.readFileSync(file,'utf8').replace(/<script[\s\S]*?<\/script>/gi,'');
  const re=/(?:href|src)="([^"]+)"/g;let m;
  while((m=re.exec(html))){
    let u=m[1];
    if(/^(https?:|mailto:|#|data:)/.test(u))continue;
    u=u.split('#')[0].split('?')[0];if(!u)continue;
    const target=path.resolve(path.dirname(file),u);
    checked++;
    if(!fs.existsSync(target)){missing++;console.log('MISSING',path.relative(ROOT,file),'->',u);}
  }
}
console.log(`\nChecked ${checked} local links; ${missing} missing.`);
process.exit(missing>0?1:0);

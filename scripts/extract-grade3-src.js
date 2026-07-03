// One-off: derive grade35/src/dc-grade3.json from the hand-built Grade 3 locale
// so bake.js can process all six activities uniformly (and merge grade3's
// translation overlays). Reproduces the exact English content; only adds the
// src-shaped wrapper.
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const fn=new Function('window',fs.readFileSync(path.join(ROOT,'grade35/locales/dc-grade3.js'),'utf8')+'\nreturn window.BREAKOUT;');
const B=fn({});
const U=B.UI, en=U.en;
const src={
  id:'dc-grade3', grade:3, confetti:B.confetti,
  chrome:{
    eyebrow:{en:en['header.eyebrow'],es:U.es['header.eyebrow'],vi:U.vi['header.eyebrow'],ar:U.ar['header.eyebrow'],hi:U.hi['header.eyebrow'],ur:U.ur['header.eyebrow'],zh:U.zh['header.eyebrow']},
    h1:en['header.h1'], sub:en['header.sub'],
    briefLabel:en['brief.label'], briefH:en['brief.h'], briefP:en['brief.p'],
    footerText:en['footer.text'], winStamp:en['win.stamp'], winH:en['win.h'], winP:en['win.p']
  },
  clues:B.CONTENT.en.clues, locks:B.CONTENT.en.locks
};
fs.writeFileSync(path.join(ROOT,'grade35/src/dc-grade3.json'),JSON.stringify(src,null,1)+'\n');
console.log('wrote grade35/src/dc-grade3.json');

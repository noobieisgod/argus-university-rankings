import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

export async function checkRelease(directory,expectedManifestHash){
  const bytes=await fs.readFile(path.join(directory,'release-manifest.json'));
  const hash=buffer=>createHash('sha256').update(buffer).digest('hex');
  if(expectedManifestHash)assert.equal(hash(bytes),expectedManifestHash,'Unapproved release manifest');
  const manifest=JSON.parse(bytes);
  assert.ok([1,2].includes(manifest.schemaVersion),'Unknown release schema');
  const pageCount=manifest.schemaVersion===1?245:249;
  assert.equal(manifest.basePath,'/argus-university-rankings/');assert.equal(manifest.pages,pageCount);assert.equal(manifest.photos,237);
  assert.equal(Object.keys(manifest.files).filter(f=>f.endsWith('/index.html')||f==='index.html').length,pageCount);
  assert.equal(Object.keys(manifest.files).filter(f=>/^assets\/[^/]+\.jpg$/.test(f)).length,237);
  const all=[];
  async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){
    if(e.name==='.git'){assert.equal(path.resolve(dir),path.resolve(directory),'Nested Git metadata in release');continue;}
    const file=path.join(dir,e.name);assert.ok(!e.isSymbolicLink(),'Symlink in release');
    if(e.isDirectory())await walk(file);else all.push(path.relative(directory,file).split(path.sep).join('/'));
  }}
  await walk(directory);
  assert.deepEqual(all.sort(),[...Object.keys(manifest.files),'release-manifest.json'].sort(),'Unlisted or missing release files');
  const pages=new Map();
  for(const [file,checksum]of Object.entries(manifest.files)){
    assert.ok(!file.includes('\\')&&!file.startsWith('/')&&!file.split('/').some(p=>p==='..'||p==='.'||!p),'Unsafe release path');
    assert.ok(file==='.nojekyll'||file==='sitemap.xml'&&manifest.schemaVersion===2||file==='provenance.json'||file==='photo-provenance.json'||file==='index.html'||/^(?:schools\/[^/]+|rankings\/(?:gus|stem|business|law|medical|prestige|outcomes|student-experience|learning-environment)|methodology|compare)\/index\.html$/.test(file)||/^assets\/[^/]+\.(?:jpg|css|svg|mjs)$/.test(file),'Excluded release path: '+file);
    const content=await fs.readFile(path.join(directory,file));assert.equal(hash(content),checksum,'Changed release file: '+file);
    if(file.endsWith('.jpg'))assert.equal(content.subarray(0,2).toString('hex'),'ffd8','Invalid JPEG');
    if(file.endsWith('.html')){
      const html=content.toString('utf8');
      assert.ok(html.startsWith('<!doctype html><html lang="en"')&&html.includes('</html>'),'Invalid generated document');
      assert.ok(!/"(?:wsjSalary|wsjCareerPreparation|rawObservations|dataSha256)"\s*:|[A-Z]:[\\/]Users[\\/]|-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(html),'Excluded payload in HTML');
      pages.set(file==='index.html'?'/':file.replace(/index\.html$/,''),html);
    }
  }
  const ids=new Set();
  const credits=JSON.parse(await fs.readFile(path.join(directory,'photo-provenance.json'),'utf8'));
  assert.equal(credits.length,237);
  for(const credit of credits){assert.ok(credit.source&&credit.photographer&&credit.license&&credit.licenseUrl&&credit.changes&&credit.conditions);assert.ok(!ids.has(credit.id));ids.add(credit.id);assert.equal(credit.sha256,manifest.files[`assets/${credit.id}.jpg`]);}
  assert.equal([...pages.keys()].filter(p=>p.startsWith('schools/')).length,237);
  if(manifest.schemaVersion===2){
    const xml=await fs.readFile(path.join(directory,'sitemap.xml'),'utf8');
    const expected=new Set([...pages.keys()].filter(p=>p!=='compare/').map(p=>'https://noobieisgod.github.io/argus-university-rankings/'+(p==='/'?'':p)));
    const urls=[...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
    assert.equal(urls.length,248);assert.deepEqual(new Set(urls),expected);
    for(const [route,html]of pages){
      const canonical='https://noobieisgod.github.io/argus-university-rankings/'+(route==='/'?'':route);
      assert.ok(html.includes(`<link rel="canonical" href="${canonical}">`),'Wrong canonical');
      assert.equal(html.includes('content="noindex,follow"'),route==='compare/');
    }
  }
  let links=0;
  for(const html of pages.values())for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
    const value=match[1].replaceAll('&amp;','&');if(!value.startsWith('/'))continue;
    assert.ok(value.startsWith('/argus-university-rankings/'),'Unprefixed internal link');
    const url=new URL(value,'https://example.invalid'),local=decodeURIComponent(url.pathname.slice('/argus-university-rankings/'.length));links++;
    if(local.startsWith('assets/'))assert.ok(manifest.files[local],'Missing linked asset');
    else {const page=pages.get(local||'/');assert.ok(page,'Missing route: '+local);if(url.hash)assert.ok(page.includes(`id="${url.hash.slice(1)}"`),'Missing fragment');}
  }
  return {pages:pageCount,photos:237,links,manifestSha256:hash(bytes)};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await checkRelease(path.resolve(process.argv[2]),process.argv[3])));

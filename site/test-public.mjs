import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {basePath,publicationHtml,unmount} from './paths.mjs';
import {compareCards,sortKey} from './assets/sort.mjs';
import {filterByLocation} from './assets/location-filter.mjs';
import {addSchool,matchingSchools} from './assets/compare.mjs';
import {startAnalytics,scheduleAnalytics} from './assets/site.mjs';
import {publicationConfig} from './seo.mjs';

const root=path.dirname(fileURLToPath(import.meta.url));
async function walk(dir){const files=[];for(const e of await fs.readdir(dir,{withFileTypes:true})){
  if(e.name==='.git')continue;
  const name=path.join(dir,e.name);assert.ok(!e.isSymbolicLink(),'Unexpected symlink');
  if(e.isDirectory())files.push(...await walk(name));else files.push(name);
}return files;}
for(const file of await walk(root))if(file.endsWith('.mjs'))execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
assert.equal(basePath('/ARGUS/'),'/ARGUS');
for(const invalid of ['ARGUS','//ARGUS','/../ARGUS','/ARGUS?x','/ARGUS\\x'])assert.throws(()=>basePath(invalid));
assert.equal(unmount('/ARGUS/schools/example/','/ARGUS'),'/schools/example/');
assert.equal(unmount('/ARGUS-other/','/ARGUS'),null);
assert.equal(publicationHtml('<a href="/compare/">Compare</a>','/ARGUS'),'<a href="/ARGUS/compare/">Compare</a>');
assert.throws(()=>publicationHtml('<pre> x\n y</pre>','',true));
const cards=[{dataset:{schoolId:'a',city:'Example',state:'CA',score:'42'}},{dataset:{schoolId:'b',city:'Elsewhere',state:'NY',score:''}}];
assert.equal(compareCards(cards[0],cards[1],'score'),-1);
assert.equal(sortKey('unexpected'),'score');
assert.equal(filterByLocation(cards,{city:'Example',state:'CA'}),1);
assert.equal(filterByLocation(cards,{city:'Example',state:'CA'},'b'),0);
assert.deepEqual(addSchool(['a','b','c'],'d'),['a','b','c']);
assert.deepEqual(addSchool(['a'],'a'),['a']);
assert.equal(matchingSchools([{dataset:{search:'Example University California'}}],'example california').length,1);
for(const bad of ['http://example.com','https://example.com/path','https://user@example.com','https://example.com?x'])assert.throws(()=>publicationConfig({siteOrigin:bad}));
assert.throws(()=>publicationConfig({cloudflareToken:'a'.repeat(32)}));
assert.throws(()=>publicationConfig({siteOrigin:'https://example.com',cloudflareToken:'bad'}));
const analytics={dataset:{siteOrigin:'https://example.com',siteBase:'/ARGUS/',cloudflareToken:'a'.repeat(32)}};
const inserted=[];
const doc={querySelector:selector=>selector==='script[data-cloudflare-token]'?analytics:inserted[0],createElement:()=>({dataset:{}}),body:{append:script=>inserted.push(script)}};
for(const loc of [{origin:'http://localhost',pathname:'/ARGUS/'},{origin:'https://example.com',pathname:'/ARGUS-other/'}])assert.equal(startAnalytics(doc,loc),false);
assert.equal(startAnalytics(doc,{origin:'https://example.com',pathname:'/ARGUS/rankings/gus/'}),true);
assert.equal(startAnalytics(doc,{origin:'https://example.com',pathname:'/ARGUS/'}),false);
assert.equal(inserted.length,1);assert.deepEqual(JSON.parse(inserted[0].dataset.cfBeacon),{token:'a'.repeat(32),spa:false});
assert.equal(inserted[0].src,'https://static.cloudflareinsights.com/beacon.min.js');
inserted.length=0;let loaded;
scheduleAnalytics({...doc,readyState:'interactive'},{origin:'https://example.com',pathname:'/ARGUS/'},{addEventListener:(event,handler,options)=>{assert.equal(event,'load');assert.deepEqual(options,{once:true});loaded=handler;}});
assert.equal(inserted.length,0);loaded();assert.equal(inserted.length,1);
inserted.length=0;scheduleAnalytics({...doc,readyState:'complete'},{origin:'https://example.com',pathname:'/ARGUS/'},{addEventListener:()=>assert.fail('Load already completed')});assert.equal(inserted.length,1);
if(process.argv.includes('--repository')){
  const repository=path.dirname(root);
  const files=execFileSync('git',['ls-files'],{cwd:repository,encoding:'utf8'}).trim().split('\n');
  for(const file of files)assert.ok(!/(^|\/)(?:work|data|research|photo-research|outputs|dist|node_modules)(\/|$)|\.(?:xlsx?|html?|pdf|zip|csv|tsv|pem|key)$|(^|\/)(?:schools|methodology|sources|history|handoff|admissions-updates)\.json$|(^|\/)\.env(?:\.|$)/i.test(file),'Excluded repository file: '+file);
}
console.log('PASS: public source syntax, synthetic interaction fixtures and project-path helpers. Private ranking inputs are not required.');

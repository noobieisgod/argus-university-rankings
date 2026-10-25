import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {basePath as normalizeBasePath,publicationHtml} from './paths.mjs';
import {minimalSchool} from './publication.mjs';
import {homePage,rankingPage,schoolPage,methodologyPage,comparisonPage,rankings,categoryRoutes,schoolUrl,numeric} from './templates.mjs';
import {publicationConfig,seoHtml,sitemap} from './seo.mjs';

export const root=path.dirname(fileURLToPath(import.meta.url));
export const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function loadData(){
  const config=JSON.parse(await fs.readFile(path.join(root,'config.json'),'utf8'));
  const handoff=JSON.parse(await fs.readFile(path.join(root,'handoff.json'),'utf8'));
  const data={};
  for(const key of ['schools','methodology','sources','history']){
    const bytes=await fs.readFile(path.join(root,config.dataDirectory,key+'.json'));
    assert.equal(sha(bytes),handoff.dataSha256[key],`Unverified ${key}.json change: rerun read-only verify-handoff.py first.`);
    data[key]=JSON.parse(bytes);
    assert.deepEqual(data[key].master,handoff.master,'Mixed export versions');
    assert.equal(data[key].schemaVersion,handoff.schemaVersion);
  }
  assert.equal(data.schools.schools.length,handoff.counts.schools);
  assert.equal(new Set(data.schools.schools.map(s=>s.id)).size,handoff.counts.schools);
  const images=JSON.parse(await fs.readFile(path.join(root,'images.json'),'utf8'));
  for(const asset of Object.values(images))assert.ok(Number.isSafeInteger(asset.width)&&asset.width>0&&Number.isSafeInteger(asset.height)&&asset.height>0,'Invalid local image dimensions');
  const locations=JSON.parse(await fs.readFile(path.join(root,'locations.json'),'utf8'));
  const all=data.schools.schools;
  const admissionsUpdates=JSON.parse(await fs.readFile(path.join(root,'admissions-updates.json'),'utf8'));
  for(const [id,fields]of Object.entries(admissionsUpdates.schools)){
    assert.ok(all.some(s=>s.id===id));
    for(const [key,field]of Object.entries(fields)){assert.ok(['sat','gpa'].includes(key)&&field.scoring===false);assert.ok(admissionsUpdates.sources.some(source=>source.id===field.sourceId));}
  }
  for(const source of admissionsUpdates.sources){assert.ok(!data.sources.sources.some(s=>s.id===source.id));assert.equal(new URL(source.url).protocol,'https:');}
  data.sources={...data.sources,sources:[...data.sources.sources,...admissionsUpdates.sources]};
  assert.equal(Object.keys(locations).length,all.length,'Incomplete campus location coverage');
  for(const s of all){const location=locations[s.id];assert.ok(location?.city?.trim()&&/^[A-Z]{2}$/.test(location.state),`Invalid location: ${s.id}`);assert.equal(new URL(location.source).protocol,'https:');}
  assert.ok(config.maximumOverallRank===null||Number.isInteger(config.maximumOverallRank)&&config.maximumOverallRank>0,'Invalid Overall rank cutoff');
  const selected=all.filter(s=>config.maximumOverallRank===null||s.overall.status==='ranked'&&numeric(s.overall.rank)&&s.overall.rank<=config.maximumOverallRank).sort((a,b)=>(b.overall.status==='ranked')-(a.overall.status==='ranked')||(a.overall.rank??Infinity)-(b.overall.rank??Infinity)||(b.overall.score??-1)-(a.overall.score??-1)||a.officialName.localeCompare(b.officialName)||a.id.localeCompare(b.id)).map(s=>s.id);
  assert.equal(new Set(selected).size,selected.length,'Duplicate selected school IDs');
  const schools=selected.map(id=>{const s=all.find(s=>s.id===id);assert.ok(s,`Unknown school ${id}`);return {...s,location:locations[id],admissionsProfile:{...s.admissionsProfile,...admissionsUpdates.schools[id]}};});
  assert.equal(new Set(schools.map(s=>schoolUrl(s,images))).size,schools.length,'Duplicate school route');
  for(const s of all)for(const r of [s.overall,...Object.values(s.specialties)]){
    assert.equal(r.status==='ranked',numeric(r.rank)&&numeric(r.score),`Invalid ranked/NR state: ${s.id}`);
  }
  return {...data,images,schools,allSchools:all,counts:handoff.counts,handoff,config};
}

export async function build({basePath='',output=path.join(root,'dist'),compact=false,minimal=false,siteOrigin='',cloudflareToken='',googleSiteVerification=''}={}){
  assert.equal(typeof minimal,'boolean','Invalid minimal-publication mode');
  basePath=normalizeBasePath(basePath);
  const seo=publicationConfig({basePath,siteOrigin,cloudflareToken,googleSiteVerification});
  output=path.resolve(output);
  assert.ok(output!==root&&output!==path.dirname(root),'Output must be a dedicated build directory');
  const data=await loadData();
  if(minimal){data.schools=data.schools.map(minimalSchool);data.allSchools=data.schools;}
  const {schools,images,counts,methodology,sources,handoff}=data;
  const pages=new Map([['/',homePage(schools,images,counts,data.allSchools)],['/methodology/',methodologyPage(methodology,images,schools,counts,minimal)],['/compare/',comparisonPage(schools,images)]]);
  for(const r of rankings)pages.set(`/rankings/${r.key}/`,rankingPage(r.key,schools,images,counts));
  for(const [key,route]of Object.entries(categoryRoutes))pages.set(`/rankings/${route}/`,rankingPage('gus',schools,images,counts,key+'Score'));
  for(const s of schools)pages.set(schoolUrl(s,images),schoolPage(s,images,sources.sources,methodology));
  for(const [url,html]of pages)pages.set(url,publicationHtml(seoHtml(html,url,data,seo),basePath,compact));
  for(const[url,html]of pages){const target=path.join(output,url,'index.html');await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,html+'\n');}
  await fs.mkdir(path.join(output,'assets'),{recursive:true});
  if(seo.siteOrigin)await fs.writeFile(path.join(output,'sitemap.xml'),sitemap(pages.keys(),seo));
  for(const file of ['styles.css','favicon.svg','sort.mjs','compare.mjs','site.mjs','location-filter.mjs'])await fs.copyFile(path.join(root,'assets',file),path.join(output,'assets',file));
  for(const s of schools)if(images[s.id])await fs.copyFile(path.join(root,'..','images',images[s.id].file),path.join(output,'assets',s.id+'.jpg'));
  await fs.writeFile(path.join(output,'provenance.json'),JSON.stringify(minimal?{schemaVersion:handoff.schemaVersion,schools:schools.length,pages:pages.size,publicationProfile:'minimal'}:{schemaVersion:handoff.schemaVersion,master:handoff.master,dataSha256:handoff.dataSha256,maximumOverallRank:data.config.maximumOverallRank,includedSchoolIds:schools.map(s=>s.id),previewSchoolIds:schools.map(s=>s.id),counts},null,2)+'\n');
  console.log(`Built ${pages.size} pages from verified schema v${handoff.schemaVersion} JSON. No workbook access.`);
  return {pages,data,output};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  assert.ok(['full','minimal'].includes(process.env.ARGUS_PUBLICATION_PROFILE??'full'),'Unknown publication profile');
  await build({basePath:process.env.ARGUS_BASE_PATH??'',output:process.env.ARGUS_OUTPUT_DIRECTORY??path.join(root,'dist'),compact:process.env.ARGUS_COMPACT_HTML==='1',minimal:process.env.ARGUS_PUBLICATION_PROFILE==='minimal',siteOrigin:process.env.ARGUS_SITE_ORIGIN??'',cloudflareToken:process.env.ARGUS_CLOUDFLARE_TOKEN??'',googleSiteVerification:process.env.ARGUS_GOOGLE_SITE_VERIFICATION??''});
}

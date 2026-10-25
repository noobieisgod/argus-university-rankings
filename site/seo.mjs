import assert from 'node:assert/strict';
import {basePath,escape} from './paths.mjs';
import {rankings,categoryRoutes,categoryTitles,schoolUrl,categoryLeader,ranked,result} from './templates.mjs';

export function publicationConfig({siteOrigin='',basePath:prefix='',cloudflareToken='',googleSiteVerification=''}={}){
  if(siteOrigin){
    const url=new URL(siteOrigin);
    assert.ok(url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash&&url.pathname==='/','Site origin must be an HTTPS origin');
    siteOrigin=url.origin;
  }
  assert.ok(!cloudflareToken||/^[a-f0-9]{32}$/i.test(cloudflareToken),'Invalid Cloudflare public site token');
  assert.ok(!googleSiteVerification||/^[A-Za-z0-9_-]{10,200}$/.test(googleSiteVerification),'Invalid Google verification identifier');
  assert.ok(!cloudflareToken||siteOrigin,'Analytics requires an explicit production origin');
  return {siteOrigin,basePath:basePath(prefix),cloudflareToken,googleSiteVerification};
}

export function pageMetadata(route,data){
  const school=data.schools.find(s=>schoolUrl(s,data.images)===route);
  const ranking=rankings.find(r=>route===`/rankings/${r.key}/`);
  const category=Object.keys(categoryRoutes).find(key=>route===`/rankings/${categoryRoutes[key]}/`);
  let title,description,photo=data.schools[0];
  if(school){
    title=`${school.officialName}: Rankings & Admissions`;
    description=`Explore ${school.officialName} in ${school.location.city}, ${school.location.state}: ARGUS rankings, admissions statistics, campus photography and sources.`;
    photo=school;
  }else if(ranking){
    title=`2027 ${ranking.key==='gus'?'U.S. University Overall Rankings':ranking.directoryTitle}`;
    description=`Explore the 2027 ARGUS ${ranking.directoryTitle.toLowerCase()}. ${ranking.description} Compare institutions and review the methodology and sources.`;
    photo=[...data.schools].filter(s=>ranked(result(s,ranking.key))).sort((a,b)=>result(b,ranking.key).score-result(a,ranking.key).score)[0]??photo;
  }else if(category){
    title=`2027 University ${categoryTitles[category]} Rankings`;
    description=`Compare 2027 ARGUS ${categoryTitles[category].toLowerCase()} rankings across U.S. universities, with published category ranks, Overall standing and campus locations.`;
    photo=categoryLeader(data.schools,category)??photo;
  }else if(route==='/methodology/'){
    title='University Ranking Methodology & Sources';
    description='Understand ARGUS university ranking weights, eligibility, ties, missing-data rules, admissions sources, photo credits and privacy information.';
  }else if(route==='/compare/'){
    title='Compare Universities: Rankings & Admissions';
    description='Compare up to three ARGUS universities by Overall and specialty ranks, admissions statistics and campus location.';
  }else{
    assert.equal(route,'/','Unknown SEO route');
    title='2027 U.S. University Rankings';
    description='Explore ARGUS rankings for 237 U.S. universities. Compare Overall, STEM, business, law, medical and category rankings with transparent methodology.';
  }
  return {title:title+' | ARGUS',description,photoId:photo.id,robots:route==='/compare/'?'noindex,follow':'index,follow'};
}

export function seoHtml(html,route,data,config){
  const meta=pageMetadata(route,data),asset=data.images[meta.photoId];
  html=html.replace(/<title>[^<]*<\/title>/,`<title>${escape(meta.title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${escape(meta.description)}">`);
  let tags=`<meta name="robots" content="${meta.robots}">`;
  if(config.siteOrigin){
    const canonical=config.siteOrigin+config.basePath+route;
    const photo=config.siteOrigin+config.basePath+`/assets/${meta.photoId}.jpg`;
    tags+=`<link rel="canonical" href="${escape(canonical)}"><meta property="og:type" content="website"><meta property="og:site_name" content="ARGUS"><meta property="og:locale" content="en_US"><meta property="og:url" content="${escape(canonical)}"><meta property="og:title" content="${escape(meta.title)}"><meta property="og:description" content="${escape(meta.description)}"><meta property="og:image" content="${escape(photo)}"><meta property="og:image:alt" content="${escape(asset.alt)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(meta.title)}"><meta name="twitter:description" content="${escape(meta.description)}"><meta name="twitter:image" content="${escape(photo)}"><meta name="twitter:image:alt" content="${escape(asset.alt)}">`;
  }
  if(route==='/'&&config.googleSiteVerification)tags+=`<meta name="google-site-verification" content="${escape(config.googleSiteVerification)}">`;
  if(config.cloudflareToken)html=html.replace('src="/assets/site.mjs"',`src="/assets/site.mjs" data-site-origin="${escape(config.siteOrigin)}" data-site-base="${escape(config.basePath+'/')}" data-cloudflare-token="${escape(config.cloudflareToken)}"`);
  return html.replace('</head>',tags+'</head>');
}

export function sitemap(routes,config){
  assert.ok(config.siteOrigin,'Sitemap requires an explicit production origin');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+[...routes].filter(route=>route!=='/compare/').sort().map(route=>`<url><loc>${escape(config.siteOrigin+config.basePath+route)}</loc></url>`).join('\n')+'\n</urlset>\n';
}

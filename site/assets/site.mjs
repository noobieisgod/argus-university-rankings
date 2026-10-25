export function startAnalytics(doc,loc){
  const config=doc.querySelector('script[data-cloudflare-token]');
  if(!config||loc.origin!==config.dataset.siteOrigin||!loc.pathname.startsWith(config.dataset.siteBase)||!/^[a-f0-9]{32}$/i.test(config.dataset.cloudflareToken)||doc.querySelector('script[data-argus-beacon]'))return false;
  const script=doc.createElement('script');
  script.type='module';script.src='https://static.cloudflareinsights.com/beacon.min.js';
  script.dataset.cfBeacon=JSON.stringify({token:config.dataset.cloudflareToken,spa:false});
  script.dataset.argusBeacon='';doc.body.append(script);return true;
}

if(typeof document!=='undefined'){
const header=document.querySelector('.site-header');
if(header){
  const measure=()=>document.documentElement.style.setProperty('--header-height',`${getComputedStyle(header).position==='sticky'?Math.ceil(header.getBoundingClientRect().height):0}px`);
  measure();new ResizeObserver(measure).observe(header);
  for(const link of header.querySelectorAll('.main-nav a'))if(new URL(link.href).pathname===location.pathname)link.setAttribute('aria-current','page');
}
startAnalytics(document,location);
}

export function startAnalytics(doc,loc){
  const config=doc.querySelector('script[data-cloudflare-token]');
  if(!config||loc.origin!==config.dataset.siteOrigin||!loc.pathname.startsWith(config.dataset.siteBase)||!/^[a-f0-9]{32}$/i.test(config.dataset.cloudflareToken)||doc.querySelector('script[data-argus-beacon]'))return false;
  const script=doc.createElement('script');
  script.type='module';script.src='https://static.cloudflareinsights.com/beacon.min.js';
  script.dataset.cfBeacon=JSON.stringify({token:config.dataset.cloudflareToken,spa:false});
  script.dataset.argusBeacon='';doc.body.append(script);return true;
}

export function scheduleAnalytics(doc,loc,events){
  if(doc.readyState==='complete')return startAnalytics(doc,loc);
  events.addEventListener('load',()=>startAnalytics(doc,loc),{once:true});
}

export function updateHeaderHeight(root,entry){
  if(!root.classList.contains('sticky-header'))return;
  const value=Math.ceil(entry.borderBoxSize?.[0]?.blockSize??entry.target.getBoundingClientRect().height)+'px';
  if(root.style.getPropertyValue('--header-height')!==value)root.style.setProperty('--header-height',value);
}

if(typeof document!=='undefined'){
const header=document.querySelector('.site-header');
if(header){
  if(document.documentElement.classList.contains('sticky-header'))new ResizeObserver(entries=>updateHeaderHeight(document.documentElement,entries[0])).observe(header);
  for(const link of header.querySelectorAll('.main-nav a'))if(new URL(link.href).pathname===location.pathname)link.setAttribute('aria-current','page');
}
scheduleAnalytics(document,location,window);
}

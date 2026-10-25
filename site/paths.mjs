import assert from 'node:assert/strict';

export const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function basePath(value=''){
  assert.equal(typeof value,'string','Base path must be a string');
  if(value===''||value==='/')return '';
  const normalized=value.replace(/\/$/,'');
  assert.ok(/^\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(normalized),'Invalid base path');
  return normalized;
}

export function publicationHtml(html,prefix='',compact=false){
  prefix=basePath(prefix);
  if(prefix)html=html.replace(/\b(href|src)="(\/(?!\/)[^"]*)"/g,(_,key,url)=>`${key}="${prefix}${url}"`);
  if(compact){
    assert.ok(!/<(?:pre|textarea|style)\b/i.test(html),'Whitespace-sensitive markup needs a dedicated compactor');
    assert.ok(!/<script\b(?![^>]*\bsrc=)/i.test(html),'Inline scripts need a dedicated compactor');
    html=html.replace(/\r?\n/g,' ');
  }
  return html;
}

export function unmount(pathname,prefix=''){
  prefix=basePath(prefix);
  if(!prefix)return pathname;
  if(pathname===prefix)return '/';
  return pathname.startsWith(prefix+'/')?pathname.slice(prefix.length):null;
}

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {basePath as normalizeBasePath,unmount} from './paths.mjs';

const root=path.resolve(process.env.ARGUS_OUTPUT_DIRECTORY??path.join(path.dirname(fileURLToPath(import.meta.url)),'dist'));
const basePath=normalizeBasePath(process.env.ARGUS_BASE_PATH??'');
const port=Number(process.env.PORT??4173);
await fs.access(path.join(root,'index.html'));
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.json':'application/json; charset=utf-8','.xml':'application/xml; charset=utf-8','.mjs':'text/javascript; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
  try{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'}).end();return;}
    const url=new URL(req.url,'http://127.0.0.1'),name=unmount(decodeURIComponent(url.pathname),basePath);
    if(name===null){res.writeHead(404).end('Page not found.');return;}
    if(basePath&&url.pathname===basePath){res.writeHead(308,{Location:basePath+'/'}).end();return;}
    const target=path.resolve(root,'.'+name);
    if(!target.startsWith(root+path.sep)&&target!==root){res.writeHead(403).end('Forbidden');return;}
    let filename=target;
    if((await fs.stat(filename)).isDirectory())filename=path.join(filename,'index.html');
    const body=await fs.readFile(filename);
    res.writeHead(200,{'Content-Type':types[path.extname(filename)]??'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
    res.end(req.method==='HEAD'?undefined:body);
  }catch(error){res.writeHead(error instanceof URIError?400:404,{'Content-Type':'text/plain; charset=utf-8'}).end('Page not found.');}
});
server.listen(port,'127.0.0.1',()=>console.log(`ARGUS local preview: http://127.0.0.1:${port}${basePath}/`));

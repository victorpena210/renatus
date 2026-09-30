/** Local-only preview with real scanner routing, no form storage or delivery.
 * Run npm run build first. This is not a production web server.
 */
import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import scan from '../netlify/functions/site-snapshot.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist');
const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.ico':'image/x-icon','.xml':'application/xml','.txt':'text/plain; charset=utf-8'};
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,`http://localhost:${port}`);
  if(url.pathname==='/.netlify/functions/site-snapshot'){
   const chunks=[];let bytes=0;for await(const c of req){bytes+=c.length;if(bytes>4096){res.writeHead(413);res.end();return;}chunks.push(c);}
   const response=await scan(new Request(url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})}));res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{'Content-Type':'text/plain'});res.end('Local preview only: forms require Netlify. No request has been stored or delivered.');return;}
  let filename=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(!filename.startsWith(root+path.sep)&&filename!==root){res.writeHead(403);res.end();return;}
  if(url.pathname==='/')filename=path.join(root,'index.html');
  try{await stat(filename);}catch{if(!path.extname(filename))filename+='.html';}
  const data=await readFile(filename);res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:data);
 }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found. Run npm run build before previewing.');}
}).listen(port,'127.0.0.1',()=>console.log(`Renatus local preview: http://localhost:${port} (form delivery intentionally disabled)`));

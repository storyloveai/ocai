import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
const dist = resolve('dist');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
createServer(async (req,res) => {
 try {
  const url = new URL(req.url,'http://localhost:4173');
  if (url.pathname.startsWith('/api/')) {
   const name=url.pathname.slice(5);
   if(!/^[a-z-]+$/.test(name)) {res.writeHead(404);return res.end();}
   const chunks=[];for await(const chunk of req)chunks.push(chunk);
   const handler=await import('../api/'+name+'.mjs');
   const fn=handler[req.method];
   const response=fn?await fn(new Request(url,{method:req.method,headers:req.headers,...(chunks.length?{body:Buffer.concat(chunks)}:{})})):Response.json({error:'不支持此操作。'},{status:405});
   res.writeHead(response.status,Object.fromEntries(response.headers));
   if(response.body)for await(const chunk of response.body)res.write(chunk);
   return res.end();
  }
  const pathname=url.pathname==='/'?'/index.html':url.pathname;
  const path=resolve(dist,'.'+decodeURIComponent(pathname));
  if(!path.startsWith(dist+'/')) {res.writeHead(403);return res.end();}
  res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream'});res.end(await readFile(path));
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(4173,'0.0.0.0',()=>console.log('StoryLove development server http://localhost:4173'));

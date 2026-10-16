import http from 'node:http';
import {timingSafeEqual} from 'node:crypto';
import {createRequire} from 'node:module';
const token=process.env.MOZLIX_API_TOKEN||'';
if(!/^[a-f0-9]{64}$/.test(token)){console.error('MOZLIX_API_TOKEN must be 64 lowercase hex characters.');process.exit(1);}
const require=createRequire(import.meta.url);
// In the image, this file is /app/gateway/server.mjs and upstream is /app/src.
const createApp=require('../src/app.js');
const apiPort=Number(process.env.INTERNAL_API_PORT||3000);
const gatewayPort=Number(process.env.GATEWAY_PORT||3130);
if(![apiPort,gatewayPort].every(p=>Number.isInteger(p)&&p>=1024&&p<=65535)||apiPort===gatewayPort)throw Error('Invalid listener ports');
const upstream=createApp().listen(apiPort,'127.0.0.1');
const expected=Buffer.from('Bearer '+token);
const gateway=http.createServer({maxHeaderSize:16384},(req,res)=>{
 const actual=Buffer.from(req.headers.authorization||'');
 if(actual.length!==expected.length||!timingSafeEqual(actual,expected)){res.writeHead(401,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end('{"success":false,"error":"Unauthorized"}');return;}
 if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
 if(!req.url.startsWith('/api/')){res.writeHead(404);res.end();return;}
 const headers={...req.headers,host:'127.0.0.1:'+apiPort};delete headers.authorization;
 const proxy=http.request({hostname:'127.0.0.1',port:apiPort,path:req.url,method:req.method,headers},response=>{
  res.writeHead(response.statusCode,{...response.headers,'cache-control':'no-store'});response.pipe(res);
 });
 proxy.setTimeout(105000,()=>proxy.destroy(Error('Upstream timeout')));
 proxy.on('error',()=>{if(!res.headersSent)res.writeHead(502,{'Content-Type':'application/json'});if(!res.writableEnded)res.end('{"success":false,"error":"Backend unavailable"}');});
 req.on('aborted',()=>proxy.destroy());res.on('close',()=>{if(!res.writableEnded)proxy.destroy();});
 req.pipe(proxy);
});
gateway.requestTimeout=120000;gateway.headersTimeout=15000;
gateway.listen(gatewayPort,'0.0.0.0',()=>console.log('MOZLIX local API gateway ready.'));
for(const event of ['SIGTERM','SIGINT'])process.on(event,()=>{gateway.close();upstream.close();setTimeout(()=>process.exit(0),2000).unref();});

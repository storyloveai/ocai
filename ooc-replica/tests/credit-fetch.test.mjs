import test from 'node:test';
import assert from 'node:assert/strict';
import {observeCreditResponse} from '../dist/assets/credit-fetch.js';
const ndjson=events=>new Response(events.map(JSON.stringify).join('\n')+'\n',{headers:{'Content-Type':'application/x-ndjson'}});
const fixture=()=>{const charges=[],states=[];return {charges,states,payment:{current:()=>true,complete:(charged=true)=>charges.push(charged)},notify:s=>states.push(s)};};
test('game transport reports receipt-backed completion and released reservations separately',async()=>{
 for(const status of ['settled','released']){
  const f=fixture(),response=observeCreditResponse(ndjson([{type:'partial',output:{reply:'hello'}},{type:'done',billing:{status}}]),f.payment,f.notify);
  assert.match(await response.text(),/hello/);assert.deepEqual(f.charges,[status==='settled']);assert.deepEqual(f.states,[status]);
 }
});
test('missing receipts, provider errors and truncated streams never claim a charge or erase retry state',async()=>{
 for(const [events,state]of [[[{type:'done'}],'unconfirmed'],[[{type:'error',code:'model_unavailable'}],'failed'],[[{type:'partial',output:{reply:'partial'}}],'interrupted']]){
  const f=fixture();await observeCreditResponse(ndjson(events),f.payment,f.notify).text();assert.deepEqual(f.charges,[]);assert.deepEqual(f.states,[state]);
 }
});
test('an account change while awaiting a stream chunk prevents its content and receipt from leaking',async()=>{
 let current=true,controller;const f=fixture();f.payment.current=()=>current;
 const input=new Response(new ReadableStream({start(c){controller=c;}}),{headers:{'Content-Type':'application/x-ndjson'}});
 const text=observeCreditResponse(input,f.payment,f.notify).text();
 await new Promise(r=>setImmediate(r));current=false;
 controller.enqueue(new TextEncoder().encode('{"type":"done","output":{"reply":"private"},"billing":{"status":"settled"}}\n'));
 await assert.rejects(text,{code:'ACCOUNT_CHANGED'});assert.deepEqual(f.charges,[]);
});

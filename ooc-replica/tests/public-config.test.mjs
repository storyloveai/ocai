import test from 'node:test';
import assert from 'node:assert/strict';
import {loadPublicConfig} from '../dist/assets/public-config.js';

test('concurrent account and chat clients share a config request, while failures can retry',async()=>{
 let calls=0,fail=true;
 const fetchImpl=async()=>{calls++;if(fail)throw Error('offline');return {ok:true,json:async()=>({configured:true})};};
 await assert.rejects(Promise.all([loadPublicConfig(fetchImpl),loadPublicConfig(fetchImpl)]),/offline/);
 assert.equal(calls,1);fail=false;
 const [account,chat]=await Promise.all([loadPublicConfig(fetchImpl),loadPublicConfig(fetchImpl)]);
 assert.equal(calls,2);assert.equal(account,chat);assert.equal(chat.configured,true);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePrivateKey} from '../server/firebase-admin.js';
import {createPlatform} from '../server/payments.js';

test('service account PEM supports multiline, escaped newlines and JSON-quoted environment values',()=>{
 const pem='-----BEGIN PRIVATE KEY-----\nfixture\n-----END PRIVATE KEY-----';
 for(const value of [pem,' '+pem+' ',pem.replaceAll('\n','\\n'),pem.replaceAll('\n','\r\n'),pem.replaceAll('\n','\\r\\n'),JSON.stringify(pem),JSON.stringify(pem.replaceAll('\n','\\n'))]) assert.equal(normalizePrivateKey(value),pem);
});
test('credential failures are unavailable service, while expired or revoked tokens require sign-in',async()=>{
 const env={FIREBASE_PROJECT_ID:'fixture',FIREBASE_CLIENT_EMAIL:'fixture@example.com',FIREBASE_PRIVATE_KEY:'fixture',FIREBASE_API_KEY:'fixture',FIREBASE_APP_ID:'fixture',FIREBASE_AUTH_DOMAIN:'fixture.firebaseapp.com'};
 const logs=[],original=console.warn;console.warn=message=>logs.push(message);
 try{
  for(const [stage,code,status] of [['initialization','app/invalid-credential',503],['verification','auth/invalid-credential',503],['verification','auth/insufficient-permission',503],['verification','auth/id-token-expired',401],['verification','auth/id-token-revoked',401]]){
   const failure=()=>{throw Object.assign(Error('SECRET_DETAILS'),{code});};
   const platform=createPlatform({env,services:stage==='initialization'?failure:()=>({auth:{verifyIdToken:failure}})});
   const response=await platform.wallet(new Request('https://fixture.example/api/wallet',{headers:{Authorization:'Bearer SECRET_TOKEN'}}));
   assert.equal(response.status,status);assert.doesNotMatch(await response.text(),/SECRET/);
  }
  assert.doesNotMatch(logs.join(''),/SECRET/);assert.ok(logs.every(x=>JSON.parse(x).event==='firebase_auth_failed'));
 }finally{console.warn=original;}
});

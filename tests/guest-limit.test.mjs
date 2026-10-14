import test from 'node:test';
import assert from 'node:assert/strict';
import {createGuestLimiter} from '../server/guest-limit.mjs';
test('guest windows reset and separate trusted hosting IPs',()=>{let time=0;const check=createGuestLimiter({now:()=>time,limit:2,maxKeys:2});const req=ip=>new Request('https://example.com',{headers:{'x-vercel-forwarded-for':ip}});assert.equal(check(req('a')),true);assert.equal(check(req('a')),true);assert.equal(check(req('a')),false);assert.equal(check(req('b')),true);assert.equal(check(req('c')),false);time=60000;assert.equal(check(req('a')),true);});

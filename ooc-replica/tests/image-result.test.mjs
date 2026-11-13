import test from 'node:test';
import assert from 'node:assert/strict';
import {validateImageResult} from '../server/image-result.js';
import {coverImage} from './fixtures/cover-image.mjs';
test('PNG settlement requires a decodable bounded payload, not just a successful HTTP response',()=>{
 assert.deepEqual(validateImageResult(coverImage),{width:1,height:1});
 const bytes=Buffer.from(coverImage,'base64');bytes[bytes.length-5]^=1;
 for(const input of ['aW52YWxpZA==',coverImage.slice(0,-4),bytes.toString('base64'),coverImage+'AAAA','A'.repeat(4*1024*1024)])assert.throws(()=>validateImageResult(input));
});

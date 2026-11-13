import {inflateSync} from 'node:zlib';
const table=Array.from({length:256},(_,n)=>{for(let i=0;i<8;i++)n=(n&1)?0xedb88320^(n>>>1):n>>>1;return n>>>0;});
const crc32=bytes=>{let crc=0xffffffff;for(const b of bytes)crc=table[(crc^b)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;};
// A provider HTTP 200 is not enough to settle credits: reject corrupt PNGs,
// mismatched lengths/checksums and compressed bombs before making a receipt.
export function validateImageResult(base64) {
  const bad=()=>{throw Error('Invalid PNG result');};
  if(typeof base64!=='string'||base64.length>4*1024*1024-20000||!base64.length||base64.length%4||!/^[a-zA-Z0-9+/]+={0,2}$/.test(base64))bad();
  const png=Buffer.from(base64,'base64');
  if(png.toString('base64')!==base64||!png.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))bad();
  let header,end=false,palette=false,idatClosed=false,offset=8;const data=[];
  while(offset<png.length){
    if(offset+12>png.length)bad();const size=png.readUInt32BE(offset),next=offset+12+size;
    if(next>png.length)bad();const name=png.toString('ascii',offset+4,offset+8),bytes=png.subarray(offset+8,offset+8+size);
    if(crc32(png.subarray(offset+4,offset+8+size))!==png.readUInt32BE(offset+8+size))bad();
    if(!header&&name!=='IHDR')bad();
    if(name==='IHDR'){
      if(header||size!==13)bad();header=bytes;
    }else if(name==='IDAT'){
      if(idatClosed)bad();data.push(bytes);
    }else if(name==='IEND'){
      if(size||next!==png.length)bad();end=true;
    }else{
      if(data.length)idatClosed=true;
      if(name==='PLTE'){if(palette||data.length||!size||size%3||size>768)bad();palette=true;}
      else if(name[0]===name[0].toUpperCase())bad();
    }
    offset=next;
  }
  if(!header||!end||!data.length)bad();
  const width=header.readUInt32BE(0),height=header.readUInt32BE(4),depth=header[8],color=header[9],interlace=header[12];
  const depths={0:[1,2,4,8,16],2:[8,16],3:[1,2,4,8],4:[8,16],6:[8,16]},samples={0:1,2:3,3:1,4:2,6:4};
  if(!width||!height||width>4096||height>4096||!depths[color]?.includes(depth)||header[10]||header[11]||interlace>1||(color===3&&!palette))bad();
  const passes=interlace?[[0,0,8,8],[4,0,8,8],[0,4,4,8],[2,0,4,4],[0,2,2,4],[1,0,2,2],[0,1,1,2]]:[[0,0,1,1]];
  const rows=[];let expected=0;
  for(const [x,y,dx,dy]of passes){const w=Math.max(0,Math.ceil((width-x)/dx)),h=Math.max(0,Math.ceil((height-y)/dy));if(!w||!h)continue;const stride=1+Math.ceil(w*samples[color]*depth/8);rows.push({h,stride});expected+=h*stride;}
  if(expected>32*1024*1024)bad();
  const pixels=inflateSync(Buffer.concat(data),{maxOutputLength:32*1024*1024});
  if(pixels.length!==expected)bad();let cursor=0;
  for(const {h,stride}of rows)for(let row=0;row<h;row++){if(pixels[cursor]>4)bad();cursor+=stride;}
  return {width,height};
}

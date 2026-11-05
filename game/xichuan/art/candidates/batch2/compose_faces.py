from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter,ImageChops
import json,hashlib,shutil
repo=Path(__file__).resolve().parents[5];art=repo/'game/xichuan/art';dest=art/'candidates/batch2';raw=dest/'raw-generated';raw.mkdir(exist_ok=True);maskdir=dest/'face-masks';maskdir.mkdir(exist_ok=True)
polys={
'zhiyao':[[(390,238),(407,217),(446,207),(469,231),(477,265),(459,289),(409,297),(391,274)],[(495,208),(531,187),(572,188),(599,211),(603,239),(589,269),(551,281),(512,268)],[(409,291),(455,283),(471,312),(451,330),(413,319)],[(549,282),(583,277),(594,302),(568,322),(545,310)],[(451,311),(518,304),(552,327),(547,360),(516,379),(469,363)]],
'shencheng':[[(417,242),(442,231),(482,233),(506,250),(500,280),(472,296),(429,291)],[(552,222),(577,206),(614,203),(636,220),(635,249),(610,278),(573,286),(553,263)],[(427,291),(474,283),(490,311),(467,331),(431,320)],[(576,281),(617,270),(626,302),(592,322)],[(487,319),(542,314),(576,335),(569,370),(533,389),(493,366)]],
'jibai':[[(382,244),(410,227),(454,227),(482,249),(480,283),(455,310),(409,316),(383,286)],[(503,220),(532,201),(575,201),(601,219),(605,250),(581,280),(541,291),(510,270)],[(397,309),(442,301),(460,330),(433,349),(402,335)],[(550,289),(586,280),(600,309),(572,332)],[(454,333),(511,323),(551,344),(545,380),(509,401),(467,378)]]}
records=[]
for c,shapes in polys.items():
 ref=Image.open(art/'sprites'/c/'normal.webp').convert('RGBA');support=Image.new('L',ref.size);d=ImageDraw.Draw(support)
 for pts in shapes:d.polygon(pts,fill=255)
 # Feather inward; the hard support ensures no changes outside the documented facial feature regions.
 inset=support.filter(ImageFilter.MinFilter(9));mask=ImageChops.multiply(inset.filter(ImageFilter.GaussianBlur(3)),support);mask.save(maskdir/(c+'.png'))
 for p in sorted(dest.glob(f'sprite-{c}-*.png')):
  original=raw/p.name
  if not original.exists():shutil.copyfile(p,original)
  generated=Image.open(original).convert('RGBA');assert generated.size==ref.size
  result=Image.composite(generated.convert('RGB'),ref.convert('RGB'),mask).convert('RGBA');result.putalpha(ref.getchannel('A'))
  diff=ImageChops.difference(ref,result).convert('RGB');outside=Image.composite(diff,Image.new('RGB',ref.size),ImageChops.invert(support))
  assert outside.getbbox() is None
  assert ImageChops.difference(ref.getchannel('A'),result.getchannel('A')).getbbox() is None
  result.save(p)
  records.append({'file':p.name,'reference':f'game/xichuan/art/sprites/{c}/normal.webp','mask':f'face-masks/{c}.png','method':'generated facial expression composited locally onto adopted sprite; inward feather; original alpha restored','outsideFaceMaskIdentical':True,'alphaIdentical':True,'canvasIdentical':True,'referenceSHA256':hashlib.sha256((art/'sprites'/c/'normal.webp').read_bytes()).hexdigest(),'rawGeneratedSHA256':hashlib.sha256(original.read_bytes()).hexdigest(),'finalSHA256':hashlib.sha256(p.read_bytes()).hexdigest()})
(dest/'face-compositing.json').write_text(json.dumps({'userAuthorized':True,'records':records},ensure_ascii=False,indent=2))
print('Composited',len(records),'sprites; outside-face and alpha exact equality passed')

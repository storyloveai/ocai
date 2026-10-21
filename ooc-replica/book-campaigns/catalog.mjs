// Authored rule campaigns. All dialogue below is new writing; no novel text is reproduced.
const p=text=>[{text}];
const add=(name,by)=>({add:name,by});
const set=(name,to=true)=>({set:name,to});
const ge=(v,val)=>({v,op:'>=',val});
const yes=v=>({v,op:'==',val:true});
const all=(...conds)=>({all:conds});
const option=(label,out,effects,extra={})=>({label,out:p(out),effects,...extra});
const scene=(title,place,cast,intro,choices,extra={})=>({title,place,cast:cast.split(',').map(id=>({id})),intro:p(intro),choices,...extra});
const num=(label,init=0,max=12)=>({type:'num',init,min:0,max,label,show:true});
const flag=label=>({type:'bool',init:false,label});
const rel=(id,by=1)=>add('rel.'+id+'.trust',by);

export const bookMetadata=[
 {id:'mortal-path',title:'凡人修仙传 · 谷外微尘',subtitle:'原创玩家支线 · 卷一',genre:'Oriental Fantasy',author:'StoryDate · 名著互动',type:'story',original:false,plays:'八章规则战役 · 修行与代价',image:'/assets/mortal-path-cover.svg',description:'你是新入黄枫谷的沈微尘。灵根平常，月例微薄，一张能预支灵力的借息契却让你看见捷径。药田断供、试炼失约与撤离名册连在一起：你可以求快，也可以守住同伴，但没有一条路不付代价。',href:'/story/mortal-path'},
 {id:'monte-cristo',title:'基督山伯爵 · 余烬与潮汐',subtitle:'原创见证人视角 · 卷一',genre:'History',author:'StoryDate · 名著互动',type:'story',original:false,plays:'八章规则战役 · 证据与复仇',image:'/assets/monte-cristo-cover.svg',description:'一封从未入档的信，把档案修复员诺埃尔带到基督山伯爵面前。马赛的旧案与巴黎的财富暗流彼此印证。当证据足以摧毁一个人，你还要查清谁会和他一起倒下。',href:'/story/monte-cristo'}
];

function shell(meta,player,cast,resources,notes){
 const vars={...resources,'flag.sidelined':flag('暂被排除'),'flag.safe':flag('保住同伴'),'flag.used':flag('利用同伴'),'flag.released':flag('主动放下'),'flag.proof':flag('交叉核验完成'),'flag.route':flag('替代路径可用'),'flag.milestone':flag('完成本卷关键程序'),uncanny:num('越界预言',0,10)};
 const chars={};
 for(const [id,name,age,persona,romance=false]of cast){
  chars[id]={name,age,persona,romance,main:'trust',dims:{trust:{label:'信任',min:0,max:8}},heat:{line:4,rude:[1,2],threat:[2,3]},react:{small:['话可以慢慢说，眼前的事却有期限。'],ask:['先核对我们已经知道的，再谈下一步。'],love:[romance?'这句话，我要看你以后怎么做。':'先把眼前的事情办妥。']}};
  vars['rel.'+id+'.trust']=num(name+' · 信任',0,8);vars['heat.'+id]=num(name+' · 场面紧张',0,8);vars['heat.'+id].show=false;
 }
 return {spec:'storydate.campaign/0.3',id:meta.id,build:'books-v1',title:meta.title,volume:meta.subtitle,player:{name:player,age:27},description:meta.description,adaptation:notes,rights:{quotes:'零原文摘录；全部场景、对白与玩家身份由项目新写',original_characters:cast.filter(c=>!['han','dantes','mercedes','villefort','danglars'].includes(c[0])).map(c=>c[1])},side_prompt:'这一段路上，只够认真做一件事。其余机会会错过。',vars,chars,dims:{trust:{label:'信任'}},echoes:{},debts:{advance:{title:'预支的代价',lock:'functional',function:'捷径必须在第六章结算，不能靠换章节消失。'}},chapters:[],nodes:{},endings:[],future_terms:[],commit_rules:[],flash:[],witness:[],sources:[]};
}
function chapter(camp,i,title,intro,main,sides){
 const chapter='c'+i;camp.chapters.push({id:chapter,title,intro:p(intro),offer:3});
 for(const [kind,rows] of [['side',sides],['main',main]])rows.forEach((n,index)=>{
  n.id=chapter+'_'+(kind==='main'?'m':'s')+(index+1);n.chapter=chapter;n.kind=kind;n.lock=kind==='main'?'functional':'free';n.order=index+1;n.free_scene=3;n.art={scene:'pending',layers:[]};
  n.choices=n.choices.map((c,j)=>({id:'a'+(j+1),type:'strategy',...c}));
  if(kind==='side')n.salience=10-index;
  camp.nodes[n.id]=n;
 });
}
function echo(camp,id,nodeId,choiceIndex,later,text){camp.echoes[id]=text;const choice=camp.nodes[nodeId].choices[choiceIndex];choice.echo=[...(choice.echo||[]),id];const node=camp.nodes[later];node.callbacks=[...(node.callbacks||[]),{pays:id,text}];}
function finish(camp,resource,threshold,win,mid){
 camp.endings=[{id:'path',title:'走到这里',fragments:[{id:'achieved',when:all(ge(resource,threshold),yes('flag.proof'),yes('flag.milestone')),text:win},{id:'released',when:yes('flag.released'),text:mid},{id:'unfinished',text:'事情没有在这一卷被彻底解决。你留下可核对的记录，带着尚未回答的问题继续走；没有到手的成果，不会被算作成功。'}]},{id:'companion',title:'与你同行的人',fragments:[{id:'betrayed',when:yes('flag.used'),text:'你借同伴的名字打开了门。门后再见面时，对方先问清你准备拿什么交换，才肯坐下。'},{id:'kept',when:yes('flag.safe'),text:'同伴还记得那次你为一个名字留下位置。临别时，行李旁多了一份没有署名的补给。'},{id:'apart',text:'你们各自离开。没有足够的共同经历替一段关系作结。'}]}];
 const partner=Object.keys(camp.chars).find(k=>camp.chars[k].romance);
 camp.endings.push({id:'bond',title:'下一次见面',fragments:[{id:'distant',when:yes('flag.used'),text:'受过的伤害没有被几句好话抹去。你们先保留各自的边界。'},{id:'close',when:all(ge('rel.'+partner+'.trust',5),yes('flag.safe')),text:'许多次彼此愿意的照应，让下次见面变得自然。你们约了一个具体的日子，仍给彼此保留改变安排的自由。'},{id:'open',text:'此刻的交情还不足以替未来许诺。故事保留下一次认真认识彼此的机会。'}]});
 for(const kind of ['protect','loyalty'])camp.commit_rules.push({char:partner,kind,broken:yes('flag.used'),kept:yes('flag.safe'),at_end:true,kept_effects:[rel(partner,1)],broken_effects:[rel(partner,-2)],kept_text:'答应的事有了行动作证。',broken_text:'当时许下的承诺，被后来一次选择抵消了。'});
 return camp;
}

function mortal(){
 const c=shell(bookMetadata[0],'沈微尘',[
  ['tao','陶岑',58,'原创黄枫谷外务执事。先核账后谈情面，不是无偿发任务的人；想保住辖下药田，也怕替弟子担责。'],
  ['lu','陆晞',25,'原创医修。说话简短，讲清药效与代价，不替玩家作决定。想找回失踪的药材账，不以治疗换取亲密。',true],
  ['ye','叶行舟',29,'原创散修中间人。擅长估价与撤退，愿冒风险但绝不接受空口担保。'],
  ['han','韩立',27,'原著人物的支线客串。谨慎务实，守住自身秘密，不炫耀机缘，不为陌生人无条件出头；不披露掌天瓶或未来经历。'],
  ['qiao','乔素',34,'原创药田管事。熟知工役的名字，反感把人当可替换的耗材，希望撤离名册能把杂役也算进去。']
 ],{qi:num('积蓄灵力',2),stones:num('灵石',5),health:num('经脉状况',8,10),exposure:num('行踪暴露',0,10),care:num('照应他人',0,10)},'采用《凡人修仙传》的宗门修行背景，构建黄枫谷外围原创支线；不是全书缩写或原著章节复现。韩立仅客串，玩家不继承其秘宝。年龄为本互动时间线设定。');
 chapter(c,1,'山门与薄册','山门里没有庆贺新人的钟声。陶岑把月例册翻到末页，纸上只剩一个空格。',[
  scene('名字写在哪一栏','山门外务堂','tao,qiao','陶岑把两块木牌推过来：药田的工期稳定，夜巡的月例高一倍。乔素看着名单上的伤病标记，没有催你选。',[
   option('接药田工役，先熟悉谷中规矩','乔素留出一条田垄，提醒你账上写的药龄也可能是假的。',[add('qi',1),rel('qiao')]),
   option('报名夜巡，多领两枚灵石','木牌背面有一道旧裂痕。陶岑让你记住换岗的暗号。',[add('stones',2),add('exposure',1)]),
   option('花两枚灵石换一张外出执照','执照只保你能出谷，谷外的事须自己担。',[add('stones',-2),set('flag.route')],{req:ge('stones',2),hint:'需要两枚灵石；其他工役仍可选择。'})]),
  scene('比月例先到的契书','谷口茶棚','ye','叶行舟递来一张借息契：先得三分灵力，第六个月归还。纸边没有血印，落款处却空着一个担保人的名字。',[
   option('以自己名义借息，不牵连同伴','契纸贴着腕骨发热，预支的灵力并不属于白得。',[add('qi',3),add('exposure',1)],{debt:['advance']}),
   option('付一枚灵石查契主，暂不签','叶行舟收起笔，承认这比急着按手印费工夫。',[add('stones',-1),rel('ye'),set('flag.proof')],{req:ge('stones',1),hint:'查契需一枚灵石。'}),
   option('拒绝借息，照常吐纳','纸上空着的名字被叶行舟用手掌遮住。今晚你只得到自己练出的那一点。',[add('qi',1),add('health',1)])])
 ],[
  scene('最后一盏药灯','药棚','lu','陆晞正给灯芯剪焦头。她缺一双稳的手，却先问你明早有没有必须赴的约。',[option('留半晚帮她分药','药包按实用重新排过；你的吐纳时间少了。',[rel('lu'),add('care',1)]),option('如实说要修炼，只送一趟药','她点头，把最轻的篮子留给你。',[add('qi',1)])]),
  scene('碎石换路','山路','ye','山路塌下一段。叶行舟可以带你走私径，也肯告诉你明码标价。',[option('花一枚灵石认路','你记下水声与岔口，执照外又多一条可走的路。',[add('stones',-1),set('flag.route')],{req:ge('stones',1),hint:'认路需一枚灵石。'}),option('留下来帮杂役搬石','道路慢慢通了，乔素会从工役簿上知道是谁留下。',[add('care',1),rel('qiao')])]),
  scene('旧蒲团','静室','han','韩立把一只旧蒲团让到门侧。室内位置有限，他并没有邀请人闲谈身世。',[option('请教如何安排轮值与修炼','他只谈可执行的时辰，不谈自己的功法。',[add('qi',1),rel('han')]),option('不问私事，先修补门闩','门外风声小了一些。这份安静没有附带人情债。',[add('health',1),rel('han')])])
 ]);
 chapter(c,2,'坊市的两种价','坊市里每一件东西都有两个价：标牌上的价，以及卖家希望你以后替他做的事。',[
  scene('残缺的聚气页','旧书摊','ye,han','一页聚气诀缺了收功段。摊主说缺页无关紧要，韩立却没有把手里的灵石递过去。',[
   option('花两枚灵石买完整抄本','完整的收功次序保住经脉，灵力的增长很慢却可重复。',[add('stones',-2),add('qi',2),rel('han')],{req:ge('stones',2),hint:'完整抄本需要两枚灵石。'}),
   option('不买残页，把月例留给后续','摊主收了笑。你的钱还在，今晚也不会多出一门功法。',[add('health',1)]),
   option('依残页试练，承担缺段风险','灵力确实涌上来，收功时却在腕脉留下刺痛。',[add('qi',2),add('health',-2),add('exposure',1)])]),
  scene('谁的名字做担保','背街账房','ye,lu','契主只肯接受两个条件：押自己的行踪，或者押一位医修的名声。陆晞不在借契的那天，却被写上了候选名单。',[
   option('只交自己的出入记录','契主知道你的路，却拿不到陆晞的名字。',[add('exposure',2),rel('lu'),set('flag.safe')]),
   option('划去名单，花两枚灵石撤掉担保附页','那张附页在灯上烧完，账还得由借契的人来还。',[add('stones',-2),rel('ye')],{req:ge('stones',2),hint:'撤附页需两枚灵石，不抵借息本账。'}),
   option('未经同意用陆晞的名声换材料','账房当即给了材料，陆晞看你的眼神却停在落款。',[add('qi',2),set('flag.used'),rel('lu',-2)])])
 ],[
  scene('被磨掉的药印','药铺','qiao','药铺退回一筐草药，说谷中印记与账册不同。',[option('逐株核印，留下证据','磨印在同一侧，像有人集中处理过。',[set('flag.proof'),rel('qiao')]),option('先补药款让工役回家','暂时无人追责，线索也随退货封走。',[add('stones',-1),add('care',1)],{req:ge('stones',1),hint:'垫款需一枚灵石。'})]),
  scene('雨檐下的汤','坊市雨檐','lu','陆晞把热汤放在你够得到的地方，自己仍留在另一头核药方。',[option('问她是否愿意同行，再谈路线','她先把危险地段圈出，才答应下次一起去。',[rel('lu'),add('care',1)]),option('谢过热汤，回静室养伤','她替汤碗扣好盖子，没有把你的离开当作拒绝。',[add('health',2)])]),
  scene('一枚不找零的灵石','灵石铺','ye','一枚灵石有两道裂纹，铺子仍按整石计价。',[option('当面议价，接受少赚','你拿回碎石，今后也知道该看哪条纹。',[add('stones',1),rel('ye')]),option('绕开这笔买卖，顺路认出口','你没有获利，多认了一条不经过账房的路。',[set('flag.route')])])
 ]);
 chapter(c,3,'药田无雨','灌溉阵不再吸水，田里却有人连夜抹平脚印。没有人愿意在宗门来人前签下责任。',[
  scene('灵泉该流向谁','枯水药田','qiao,lu','阵盘里只够存一夜灵力。幼苗和临时病棚各接着一条水槽，另一条将干到天亮。',[
   option('给病棚供水，接受一部分药苗损耗','乔素把损耗写在自己名下，病棚里终于有人能喝上清水。',[add('care',2),rel('qiao'),add('qi',-1)]),
   option('保药苗，亲手送有限的饮水进病棚','药苗保住了，送水的人整夜没能休息。',[add('qi',1),add('health',-1),rel('lu')]),
   option('耗两枚灵石撑开双路阵','两条细流都接上，阵盘的裂口仍需以后补。',[add('stones',-2),add('care',1),add('qi',1)],{req:ge('stones',2),hint:'双路供水需两枚灵石。'})]),
  scene('陶岑的空白供词','外务堂','tao,qiao','陶岑递来一张没有写责任人的供词。填上杂役的名字，药田可以立刻复工；留下空白，就要等完整核验。',[
   option('拿磨印记录要求延后结案','记录被收进卷宗，补水的损耗也必须如实记账。',[rel('tao'),set('flag.proof')],{req:yes('flag.proof'),hint:'需要此前核验过药印或契书。'}),
   option('不指认无证之人，承担停工损失','陶岑没有说赞许，只把停工的损耗移到你能看见的栏里。',[add('stones',-1),add('care',2)]),
   option('先签下杂役责任换复工资源','阵法恢复了供应，被填上名字的人却再没来领月例。',[add('stones',2),set('flag.used'),rel('qiao',-2)])])
 ],[
  scene('夜里还亮的药房','药房','lu','陆晞数过剩下的药，只够治疗一批人。',[option('替她跑腿配药','她终于有时间处理经脉伤势。',[add('health',1),rel('lu')]),option('把自己的份额让给重伤工役','药柜少了一份，你的名字却被留在探望簿上。',[add('care',2),add('health',-1)])]),
  scene('没交上去的账页','药田仓库','qiao','仓底发现一页与正账不同的收货记录。',[option('留两份抄件分别封存','即便正账后来不见，日期仍有地方可对。',[set('flag.proof'),rel('qiao')]),option('只记路线，避免带走物证暴露','纸留在原处，通仓的水道记在心里。',[set('flag.route'),add('exposure',-1)])]),
  scene('不借来的修为','僻静石台','han','韩立收功后只问了一句：你今日练的，能不能明日再练一次？',[option('修补收功次序','增长慢下来，经脉先缓过一口气。',[add('health',2),rel('han')]),option('按自己的时辰积蓄灵力','石台下露水干时，灵力比昨夜多了一点。',[add('qi',2)])])
 ]);
 chapter(c,4,'试炼里的回声','雨林不提供公平的考题。昨日还可辨认的路标，今早已泡在积水里。',[
  scene('三个人的撤退线','试炼林口','lu,ye','叶行舟只备了两枚急返符。陆晞看过返符的距离，明确说自己不接受被当作诱饵。',[
   option('先确认三人徒步退路再入林','你们走得较慢，夜里仍能认出回去的水声。',[set('flag.route'),rel('lu'),add('health',1)]),
   option('用两枚灵石补第三枚返符','三人各留一枚，谁也不必等别人替自己安排撤退。',[add('stones',-2),set('flag.safe')],{req:ge('stones',2),hint:'第三枚返符需两枚灵石。'}),
   option('自己留下断后符，承担徒步撤退','叶行舟确认你听懂风险，才把符交到陆晞手里。',[add('health',-2),rel('lu',2),add('care',1)])]),
  scene('雾里的旧阵眼','雨林石隙','lu,ye','阵眼里有可取的凝气砂，也有被压住的旧撤离标记。取尽砂，标记将随石缝塌掉。',[
   option('只取一份，留下路标','砂袋轻了，退路却仍由所有人看得见。',[add('qi',2),add('care',1)]),
   option('按已确认的退路取全份','你们能带走更多，却必须承担绕路与行踪暴露。',[add('qi',3),add('exposure',2)],{req:yes('flag.route'),hint:'需要先掌握可复用的退路。'}),
   option('放弃凝气砂，先接回走散的工役','陆晞把尚温的水囊递给那人，砂袋原样留在雨里。',[set('flag.safe'),add('care',2),rel('lu')])])
 ],[
  scene('断枝上的布条','试炼边界','qiao','一块工役衣料挂在断枝上，地面没有血迹。',[option('沿安全范围查找，留下接应','你没有追进未探明的雾区，接应的人等到一声回应。',[add('care',1),rel('qiao')]),option('记录位置后回报管事','援手来得更慢，但位置没有在口传中变掉。',[set('flag.proof')])]),
  scene('干燥的半截衣袖','雨棚','lu','陆晞将干燥的一侧让给你，自己仍专注整理药针。',[option('先问她是否需要换班','她把药针收好，接受了这次照应。',[rel('lu',2)]),option('留一包干药给她，独自养息','棚中没有勉强延长的交谈。',[add('health',2)])]),
  scene('没有脚印的路','溪边','ye','溪水能抹去脚印，也会冲掉储物袋上的松绳。',[option('花时间固好物资走水路','东西少受损，练功的半夜用在了赶路上。',[add('exposure',-2),add('qi',-1)]),option('走近道，接受被人看见','你提前到达集合处，火光也照见了你背的砂袋。',[add('qi',1),add('exposure',1)])])
 ]);
 chapter(c,5,'来收账的人','契主没有当众追债。他只是先叫出了一个本不该知道的名字。',[
  scene('借息契的反面','茶棚后间','ye,tao','借息契要的并非更多灵石，而是一份药田出入册。陶岑说册子不能外流，叶行舟提醒你：拖延也会留下痕迹。',[
   option('以两枚灵石买结算缓冲，不交名单','期限推迟，名字仍留在谷中。',[add('stones',-2),rel('tao'),add('exposure',-1)],{req:ge('stones',2),hint:'缓冲需要两枚灵石，第六章仍须结账。'}),
   option('主动递交自己的借契记录，申请监督结算','你失去几分自由，也获得一份可复查的收据。',[set('flag.proof'),add('exposure',2)]),
   option('交出出入册换取修炼资材','对方付得很快，名册上每个名字却从此有了谷外去处。',[add('qi',2),add('stones',1),set('flag.used')])]),
  scene('陆晞要听的真话','医舍门外','lu','陆晞把门留着，却没像往常一样备第二碗汤。她问的是往后能否自己决定，不是你替她算过多少好处。',[
   option('交还关于她的记录，承认由她决定','她收起记录，愿意再核对一次同行的条件。',[rel('lu',2),add('care',1)]),
   option('只谈下一段路的明确分工','你们把行程写清。关系没有立刻修复，合作仍有边界。',[rel('lu'),set('flag.route')]),
   option('用她的位置换契主的撤离名额','名额到了手，她没有在你的行囊里留下药。',[add('exposure',-2),set('flag.used'),rel('lu',-2)])])
 ],[
  scene('被折过的册角','外务档房','tao','名册上的一页被反复翻过，页角有陌生的药味。',[option('核查副本，不替任何人定罪','两份记录的日期终于接上。',[set('flag.proof'),rel('tao')]),option('用一晚抄工换月例','你没有追查，却攒下下一程可用的灵石。',[add('stones',2)])]),
  scene('青石阶上的演练','后山','han','韩立只示范一次如何中止施术，然后等你自己试。',[option('练中止，不追求冲关','腕脉的刺痛渐渐减弱。',[add('health',2),rel('han')]),option('在可控范围内积蓄','多得的灵力是练出的，不会替你抵消契账。',[add('qi',2)])]),
  scene('还有谁没上名册','工役院','qiao','乔素把另一张名单摊开，上面都是平时负责抬水的人。',[option('替他们整理可核验的工役凭证','身份终于能被拿到台面上核对。',[add('care',2),rel('qiao')]),option('先探查可步行的撤离线','没有名额也不等于只能坐等。',[set('flag.route'),add('exposure',1)])])
 ]);
 chapter(c,6,'撤离名册','急令来到时，纸上的身份比行囊里的功法更早决定一个人能站在哪里。',[
  scene('先把旧账算清','外务交割台','tao,ye','借息契就在桌上。未借过的人只需核清记录；借过的人须退回预支的三分灵力，或用一段可复查的护送任务替代。',[
   option('退还三分预支灵力，领清账收据','收据写清借还，今后没有人能再用这一笔催你。',[add('qi',-3),set('flag.proof')],{when:{v:'debt.advance',op:'==',val:'open'},req:ge('qi',3),hint:'需三分灵力；不足可改为护送或监督结算。',resolve:[['advance','cancel']]}),
   option('承担护送任务，用行程替代契息','合同写明护送对象与终点，旧账改成可完成的事情。',[add('health',-1),add('care',1)],{resolve:[['advance','transform']]}),
   option('交由外务堂监督追溯，主动留后','追溯不替你省事，却让账不再只由契主解释。',[add('exposure',2),rel('tao')],{resolve:[['advance','reroute']]})],{}),
  scene('船位与步行的人','撤离渡口','lu,qiao','最后一批船位按正式弟子发放。乔素身后的杂役没有席位，陆晞已经备好伤药，等你给出一个能执行的安排。',[
   option('让出便利，按已探明路线护送工役','你们离开得晚，至少知道每一段路由谁照看。',[set('flag.safe'),add('health',-1),add('care',2)],{req:yes('flag.route'),hint:'需要已经确认的陆路。'}),
   option('留在渡口轮班，等下一批转运','等候很难熬，名单上仍然保留了每个人的名字。',[set('flag.safe'),add('qi',-1),rel('qiao')]),
   option('独自上船，保留自己的资源','船离岸时，岸上的人数还未点完。你保住了行囊，没有保住所有承诺。',[add('stones',1),add('care',-1)])])
 ],[
  scene('绳结上的药包','渡口仓棚','lu','药包只剩两组，陆晞要先确定它们会被谁带走。',[option('明确由她自行保管并决定用量','她将备用绳交给你，不再需要反复确认这件事。',[rel('lu',2)]),option('购买一组给转运伤员','一笔清楚的花费少了一场争抢。',[add('stones',-1),add('care',2)],{req:ge('stones',1),hint:'补药需一枚灵石。'})]),
  scene('雨里的摆渡价','临时码头','ye','叶行舟能加租一只小船，船主只收现付。',[option('付一枚灵石，留下同行人的位置','没有人再需要拿名字去抵船资。',[add('stones',-1),set('flag.safe')],{req:ge('stones',1),hint:'小船需一枚灵石。'}),option('帮船主修桨换步行指引','你得到一张简图，多花的时间必须由自己承担。',[set('flag.route'),add('health',-1)])]),
  scene('没装满的储物袋','旧院','han','韩立的行囊比旁人的轻。他指出你袋口的结不适合急行，没问里面有多少东西。',[option('舍掉累赘，保住经脉恢复的时辰','袋子轻下来，夜里总算能安稳收功。',[add('health',2)]),option('留一份物资给后行者','袋子留下空处，物资却有了明确的接手人。',[add('care',1),rel('han')])])
 ]);
 chapter(c,7,'能不能再走一步','临时静室没有替人护法的大阵。想冲关的人，必须先承认自己缺的究竟是什么。',[
  scene('先问经脉，不问吉兆','临时静室','lu,han','陆晞核对你的气息，韩立只看收功是否稳当。这里没有谁替你许诺一定成功。',[
   option('准备冲关：灵力八、灵石四、经脉四','材料逐项摆开，连退出次序也先写在纸上。',[set('flag.proof')],{req:all(ge('qi',8),ge('stones',4),ge('health',4)),hint:'需要灵力≥8、灵石≥4、经脉≥4。'}),
   option('暂缓冲关，先治经脉','门外的风停了一阵。延期是主动的安排，不是被判出局。',[add('health',2),set('flag.released')]),
   option('专心补足灵力，接受时间成本','你放弃追赶别人的进度，只记录自己的一个周天。',[add('qi',2),add('exposure',1)])]),
  scene('关口之前的开销','石室阵台','lu','阵台可以再开一次。陆晞退到你能看见的位置，等你亲自确认是否继续。',[
   option('按核验条件完成这一轮积累','四枚灵石化作阵光，经脉守住收功次序。你只完成本卷的修炼里程，不会凭一次选择成为高阶修士。',[add('stones',-4),add('qi',2),add('health',-2),set('flag.milestone')],{req:all(ge('qi',8),ge('stones',4),ge('health',4)),hint:'灵力≥8、灵石≥4、经脉≥4，实际消耗四枚灵石。'}),
   option('不开阵，把材料留给下一程','阵台上的灯被一盏盏熄下。剩下的东西仍归你安排。',[set('flag.released'),add('health',1)]),
   option('将一枚灵石换作共同疗伤的药费','陆晞把药分成明确的份数，不将帮助误作一纸关系契约。',[add('stones',-1),rel('lu'),add('care',1)],{req:ge('stones',1),hint:'药费需一枚灵石。'})])
 ],[
  scene('未寄出的回信','临时住舍','qiao','乔素想把幸存工役的去处分送回各家，纸上还有空格。',[option('核清姓名与去向','每个送信地址后都有人确认过。',[add('care',1),set('flag.proof')]),option('帮她做一晚工，赚取材料','收入有限，却不用再借未来的修为。',[add('stones',2)])]),
  scene('灯下的间距','静室门口','lu','陆晞问你是否还需要她守在门外。她没有把守夜当作理所当然。',[option('邀请她留下，并明确可以随时离开','她将灯移近一点，仍留着门边的位置。',[rel('lu',2)]),option('请她休息，独自按次序调息','门轻轻合上，信任不必靠占满每一个夜晚证明。',[add('health',1),add('qi',1)])]),
  scene('绕远的一袋灵石','转运货栈','ye','叶行舟给你一份有风险的短途搬运差事，报酬写得明白。',[option('接下差事，按约赚取两枚灵石','钱到手，行踪也留下新的记录。',[add('stones',2),add('exposure',1)]),option('不接急活，稳住现有气息','你没有多一笔收入，脉象却不再随脚步乱跳。',[add('health',1),add('qi',1)])])
 ]);
 chapter(c,8,'各自的长路','谷中旧册已经合上。此后去哪里，终于不再只是等别人写下一个名字。',[
  scene('去处写给谁看','分路客栈','tao,ye','陶岑要一份交割记录，叶行舟问你是否愿意继续同行。二人要的不是同一种承诺。',[
   option('交出可核验的交割记录，留下来往方式','以后有人再查这一笔，能够找到当时的日期与经手人。',[set('flag.proof'),rel('tao')]),
   option('独行，保留有限行踪','你付清明面的路费，没有把余生一并卖出去。',[add('exposure',-2),set('flag.released')]),
   option('与伙伴约定下一程分工','约定写清目的地，也写清谁有权改变主意。',[set('flag.safe'),rel('ye')])]),
  scene('临走前的一盏灯','客栈门外','lu,qiao','陆晞收起药箱，乔素核完最后一笔路费。门外的路没有替你标明哪一种人生更值得。',[
   option('照约接回同伴，再一起出发','你做的是一件可以核对的小事：按时来，点清人，才启程。',[set('flag.safe'),rel('lu')]),
   option('留足路费，和她们郑重道别','你们交换去处，没有把分路说成背叛。',[set('flag.released'),add('care',1)]),
   option('先走自己的路，把交割留给别人','你的行囊没有变重。门内的人重新分配了那份未完的工作。',[add('qi',1),rel('qiao',-1)])])
 ],[
  scene('账本最后一行','客栈账房','tao','账本末尾仍有一笔未写用途的零钱。',[option('退回公共药费','数字归位，后来的人不用替这一笔猜测。',[add('care',1),set('flag.proof')]),option('按工役约定领取自己的工钱','应得的工钱不需要以感激来替代。',[add('stones',1)])]),
  scene('渡口告别','河岸','han','韩立已经准备离开，只留出一句话的时间。',[option('感谢提醒，不问他去哪里','他点了一下头，路仍由各人自己走。',[rel('han'),add('health',1)]),option('只交换下一处公开坊市的消息','消息有限，却确实能用。',[set('flag.route')])]),
  scene('没有契印的纸','客栈窗边','lu','陆晞将一张空白信纸留在桌边，这次没有任何担保栏。',[option('写下可以兑现的近期约定','她问清日期，才把纸折好。',[rel('lu',2)]),option('不许长远诺言，只留下真实去向','知道如何找到彼此，已经比空话更实在。',[add('care',1),rel('lu')])])
 ]);
 const callbacks=[['borrow','c1_m2',0,'c6_m1','腕骨上的契热又泛起来。早先借来的三分灵力，终于要有一笔说得清的去向。'],['decline','c1_m2',2,'c3_m1','没有借息催着走，你能把今夜的修为先拿来维持一条水槽。'],['ownname','c2_m2',0,'c5_m2','陆晞记得你当时只交了自己的出入记录，这次愿意先把门留着。'],['usedname','c2_m2',2,'c5_m2','陆晞先确认名单还会不会再出现自己的名字，才愿意听你谈下一程。'],['water','c3_m1',0,'c6_m2','病棚里喝过清水的人认出了你，撤离队伍因此多了一双主动帮忙的手。'],['blame','c3_m2',2,'c6_m2','被填上责任的工役缺了一人。乔素点名时，在那个空格停得格外久。'],['route','c4_m1',0,'c6_m2','先前按水声确认的退路，此刻终于能画给整支队伍看。'],['sand','c4_m2',0,'c7_m1','当时只装半袋的凝气砂仍在。你少得的那一半，换成了一段完整退路。'],['honest','c5_m2',0,'c8_m2','陆晞记得你把记录交还的那晚。她这次先说自己的打算，再问你的意见。'],['escort','c6_m1',1,'c8_m1','护送记录上有每一个接手人的签名，借息旧账终于不再含混。'],['wait','c6_m2',1,'c8_m2','你等过下一批转运。那群人的去向，如今终于可以一起写进交割册。'],['delay','c7_m1',1,'c8_m1','经脉缓过来以后，你才发现当时选择延期，也替未来保留了路。']];
 callbacks.forEach(args=>echo(c,...args));
 c.sources=[{url:'https://www.qidian.com/book/107580/',what:'原著与作者来源；本卷为新写支线，非原文复刻'}];
 return finish(c,'qi',10,'你守住了收功次序，也把借息与交割的来龙去脉留在了纸上。修为有了可重复的积累，长生仍远，下一程不必再靠一张说不清的契书。','你把冲关日期往后移，先带着完整的经脉离开。没有人替你把延期写成失败；下一轮积累仍由你亲自开始。');
}

function monte(){
 const c=shell(bookMetadata[1],'诺埃尔·瓦莱特',[
  ['dantes','爱德蒙·唐泰斯',46,'基督山伯爵。举止克制，擅长用事实与等待施压。复仇是他自己的计划，不会被一句劝说抹去；对无辜代价会动摇。不向刚认识的玩家吐露全盘布局。'],
  ['leona','莉奥娜·杜瓦尔',28,'原创海事保险核验员。用来源、日期和签名判断可信度，有自己的调查线；谈感情也不放弃独立判断。',true],
  ['mercedes','梅尔塞苔丝',45,'原著人物。关心活着的人，不是替伯爵认错或替玩家证明道德的工具；不会为推进剧情交出所有私信。'],
  ['villefort','维尔福',60,'检察官。善于把话变成程序上的优势，先问证据如何取得；害怕被核验的旧案关联。'],
  ['danglars','唐格拉尔',58,'银行家。计算损失与信用，愿意牺牲不影响自己账目的关系；不会随口承认罪行。']
 ],{evidence:num('可核验证据',0),funds:num('调查经费',6),exposure:num('身份暴露',0,10),mercy:num('无辜者照护',0,10),time:num('调查余裕',8)},'以大仲马原著为基础，自创档案修复员与核验员视角；本互动采用1842年的改编时间线，调整人物年龄与事件衔接。不是逐章复述原著；原著人物保留独立目标，证据程序为剧情规则而非现实法律教程。');
 chapter(c,1,'一封迟到的信','马赛的海风掀起修复室里的薄纸。一封从未编目的告密信，背面的胶痕比正面的字更清楚。',[
  scene('信从哪里来','马赛修复室','leona','莉奥娜带来一封旧信和一张不匹配的入藏单。她愿意查，但拒绝把“像真迹”写成结论。',[
   option('花经费比对纸张与入藏记录','两份记录之间的日期差被单独注明，信不再只是可疑的故事。',[add('funds',-1),add('evidence',2),set('flag.proof'),rel('leona')],{req:ge('funds',1),hint:'基础核验需一份经费。'}),
   option('先找当年的经手人，保留信件原状','你多花了时间，得到一个愿意谈交接日期的地址。',[add('evidence',1),add('time',-1)]),
   option('把信的存在放给小报试水','有人很快来问价。关注来得比核验更早。',[add('exposure',2),add('funds',1)])]),
  scene('一个未署名的委托','港边旅馆','dantes','来客只自称伯爵。他能支付追查旧案的费用，却不肯先告诉你希望哪一个人付出代价。',[
   option('接受预支，要求保留独立核验权','伯爵付款，也记住了你坚持写进委托的那一行。',[add('funds',3),rel('dantes')],{debt:['advance']}),
   option('不收预支，只交换公开线索','他递来的地址比钱少，下一步也不由他包办。',[add('evidence',1)]),
   option('说明不能替任何人制造结论','伯爵收回支票，把委托改成了可逐项核对的调查。',[set('flag.proof'),rel('leona')])])
 ],[
  scene('码头的旧抄簿','海事柜台','leona','抄簿上的船名改过一次，底下的墨色仍透出来。',[option('查同日其他船的交接记录','孤立的改字有了能比对的时间背景。',[add('evidence',1)]),option('帮核验员补晚班换查阅时段','你赚下一份经费，也少了一晚空闲。',[add('funds',1),add('time',-1),rel('leona')])]),
  scene('旅馆的第二把钥匙','旅馆前厅','dantes','伯爵让人备下另一把钥匙，没有要求你立刻住进去。',[option('说明会自行保管原件','钥匙仍在桌上，边界已经说清。',[rel('dantes')]),option('先检查房间的出入簿','你发现哪些人可能知道自己来过。',[add('exposure',-1),add('evidence',1)])]),
  scene('窗边未凉的咖啡','港边咖啡馆','leona','莉奥娜把两杯咖啡分开，先谈她那份不愿交出的调查笔记。',[option('尊重她保留笔记的决定','她留下可公开的日期，私人的内容仍归她。',[rel('leona',2)]),option('用空闲核对自己的摘录','你没有追问，摘录里少了一处抄错的名字。',[add('evidence',1)])])
 ]);
 chapter(c,2,'石墙里的缺页','伊夫岛的记录不讲述冤屈，只记录入押、病况与移交。最重要的一行，恰好缺了纸。',[
  scene('档案缺口','伊夫岛档房','leona','缺页前后的编号连续，线缝却是后来重新缀过的。莉奥娜提醒你：能证明取走过纸，还不能证明纸上写了什么。',[
   option('付费复核移交簿，补来源链','移交人的名字有了第二处出处。',[add('funds',-1),add('evidence',2),set('flag.proof')],{req:ge('funds',1),hint:'复制与复核需一份经费。'}),
   option('等候公开查阅，保留完整手续','查阅慢了一个轮次，你仍能说明每份副本从哪里来。',[add('time',-2),add('evidence',1)]),
   option('偷偷带走残页，承担证据争议','残页到手，别人追问来源时，你将难以把整条链摊开。',[add('evidence',1),add('exposure',2)])]),
  scene('旧名字与新身份','渡船甲板','dantes','伯爵看见一个旧编号时，手指在栏杆上收紧。他没有回答自己是否认识囚犯，只问你准备怎样处置这个名字。',[
   option('只问可证实的经过，不逼他自认身份','他给出一个可查的时间，仍保留不愿说的那部分。',[rel('dantes'),add('evidence',1)]),
   option('用调查结果换他一份明确授权','授权限定费用与查阅范围，没有给任何人捏造材料的权利。',[add('funds',1),set('flag.proof')]),
   option('以公开其身份相威胁','你拿到下一笔钱，也让每次见面都多了一道防备。',[add('funds',2),add('exposure',2),rel('dantes',-2)])])
 ],[
  scene('石阶上的迟到者','伊夫岛渡口','leona','一名退休看守的证词只能在下一班船前记录。',[option('留下核实证词，不预填答案','证词有限，边界也写得清楚。',[add('evidence',1),add('time',-1)]),option('安排付费复访，不催促老人','你买到的是时间，不是一个指定答案。',[add('funds',-1),add('mercy',1)],{req:ge('funds',1),hint:'复访交通需一份经费。'})]),
  scene('名单外的养老金','港务处','mercedes','梅尔塞苔丝来为旧相识核实补助，不愿这笔帮助被写进伯爵的宣传。',[option('替她保留匿名，只查公开凭证','她接受协助，仍保管自己的信件。',[rel('mercedes'),add('mercy',1)]),option('不介入私事，核对同日名册','你得到可用的日期，没有得到她的私密往事。',[add('evidence',1)])]),
  scene('一封可退回的信','临时住处','leona','莉奥娜问调查进展能否寄回马赛，她仍有自己的委托要交代。',[option('一起删去不应公开的姓名','她愿意继续合作，因为合作不要求交出别人的隐私。',[rel('leona',2)]),option('说明尚未确定，晚一日再寄','多一天不保证真相，却避免了一次仓促下结论。',[add('time',-1),set('flag.proof')])])
 ]);
 chapter(c,3,'意大利的化名','不同身份在不同城市留下字迹。你要判断的不是一个人能变成多少人，而是哪一处签名能够互相印证。',[
  scene('两张不同的名片','罗马旅馆','dantes,leona','两张名片使用不同姓名，却指向同一个付款人。伯爵允许查账，不允许你把推测写成公开身份。',[
   option('核对付款记录，只记录可确认的关联','你们得出一条范围有限但可用的结论。',[add('evidence',2),rel('leona')]),
   option('使用伯爵的介绍，缩短调查等待','介绍函有效，也把你与他的联系写进他人记忆。',[add('time',2),add('exposure',1),rel('dantes')]),
   option('拒绝使用未核验的化名关系','线索暂停，至少没有将一次相似字迹当作定论。',[add('exposure',-1),set('flag.proof')])]),
  scene('宴席外的条件','旅馆回廊','leona','巴黎邀请函可以带两人。莉奥娜要求自己以核验员身份进入，拒绝充当一个用来放松警惕的伴侣。',[
   option('同意独立身份，一起核定问话范围','两份邀请写上各自的职责，你们都能自行离席。',[rel('leona',2),set('flag.safe')]),
   option('自己入场，她在外保管副本','她接受分工，并把联系的时间说得十分明确。',[set('flag.route'),add('exposure',1)]),
   option('擅自将她写成亲密伴侣换便利','邀请函送来得很快，她却先划掉了你替她写的身份。',[add('time',1),set('flag.used'),rel('leona',-2)])])
 ],[
  scene('剧院的背面座位','罗马剧院','dantes','包厢能看见所有人，也会让所有人记住谁坐在那里。',[option('留在普通席观察公开往来','你得到有限的关系线索，身份更容易藏住。',[add('evidence',1),add('exposure',-1)]),option('接受包厢，让伯爵引见','交接更快，与你相关的传言也更快。',[add('time',1),add('exposure',1)])]),
  scene('误抄的姓氏','旅馆书桌','leona','一处姓氏差一个字母，恰好能指向两位不同的人。',[option('重查原件，撤下那条推断','更正让证据少了夸张，却更经得住追问。',[set('flag.proof'),add('evidence',1)]),option('请她独立复核，不暗示答案','她带回相同的疑点，合作有了真正的第二双眼。',[rel('leona',2)])]),
  scene('还没寄出的钱','邮局柜台','mercedes','梅尔塞苔丝托你核实一笔匿名援款是否会牵连收款人。',[option('核清收款后果再寄','帮助没有成为下一轮要挟的凭据。',[add('mercy',2)]),option('退回未明用途的款项','钱没有送出，含混的责任也没有被转嫁。',[add('funds',1),rel('mercedes')])])
 ]);
 chapter(c,4,'巴黎的门槛','巴黎的客厅里，人们不先问消息真假，只先判断说消息的人值不值得得罪。',[
  scene('唐格拉尔的晚餐','银行家客厅','danglars,leona','唐格拉尔愿意开放一部分账目，交换条件是让你在晚餐上替他的信用说一句话。',[
   option('购买正式抄件，不替信用背书','你付出了经费，拿到可说明出处的一组数字。',[add('funds',-2),add('evidence',2)],{req:ge('funds',2),hint:'正式抄件需两份经费。'}),
   option('只查公开担保，不作额外承诺','可查的范围窄了，签名仍能和港务记录比对。',[add('evidence',1),add('time',-1)]),
   option('接受他的招待，换取快速接触','门开得更快，你的话也被客厅里的人记了下来。',[add('time',2),add('exposure',2),rel('danglars')])]),
  scene('维尔福先问手续','检察官书房','villefort','维尔福没有碰信，先问它经过多少双手。来源模糊会让你在说到内容前就被挡回门外。',[
   option('出示已核验的来源链，请他回应日期','他必须对具体日期作出解释，不能只评价传言。',[add('evidence',2),add('exposure',1)],{req:yes('flag.proof'),hint:'需要已有的来源链核验。'}),
   option('不交原件，申请书面答复','答复要等，原件仍由你保管。',[add('time',-2),add('evidence',1)]),
   option('谎称掌握他并未留下的自白','他要求立即出示。你得不到承认，反而暴露了虚张声势。',[add('exposure',2),add('evidence',-1),rel('villefort',-1)])])
 ],[
  scene('仆役更衣间的账','巴黎宅邸后厅','leona','大人物的宴席散了，工钱仍压在服务账上。',[option('先匿名核工资凭证，不拿工人做诱饵','一条账目有了独立出处。',[add('evidence',1),add('mercy',1)]),option('替工人垫付欠薪再追账','钱少了一份，至少无人因这场调查挨饿。',[add('funds',-1),add('mercy',2)],{req:ge('funds',1),hint:'垫款需一份经费。'})]),
  scene('梅尔塞苔丝不愿交出的信','会客室','mercedes','她愿意谈过去，却不肯把写给家人的信交给一个调查者。',[option('接受口述并注明范围','她继续说，但私信仍归她。',[rel('mercedes',2),add('mercy',1)]),option('只查公开行程，结束私事问话','你没有多一封信，也没有再逼她替别人证明痛苦。',[add('evidence',1)])]),
  scene('安静的一支舞','宴厅侧门','leona','莉奥娜离开舞池到侧门透气，问你谈完工作后是否还想留下。',[option('问她愿不愿意一起走一段','她选择了时间和路线，这段同行没有工作交换条件。',[rel('leona',2)]),option('把副本交接清楚，让她先休息','夜晚没有被强留，工作也没有被含混带走。',[add('time',1),rel('leona')])])
 ]);
 chapter(c,5,'三条证据链','纸上的字、账上的钱、活人的证词终于接近彼此。它们必须互相支持，而不是互相抄写。',[
  scene('信、账与口述','档案借阅室','leona','莉奥娜把三组材料分开。若三个人都只听过同一个传言，便不是三份独立的证据。',[
   option('花时间完成交叉核验','冲突的日期被标出，可使用的部分因此更清楚。',[add('evidence',2),add('time',-2),set('flag.proof')]),
   option('付费请独立抄手核对账目','另一位经手人留下核对痕迹，不能替你决定如何使用。',[add('funds',-2),add('evidence',2),set('flag.proof')],{req:ge('funds',2),hint:'独立复核需两份经费。'}),
   option('保留目前材料，拒绝夸大数量','你没有得到更多证据，也没有把同源信息说成独立证明。',[rel('leona'),add('mercy',1)])]),
  scene('公开之前的抄件','伯爵书房','dantes,leona','伯爵想把其中一页先送到银行家手里，让恐惧替他完成余下的工作。莉奥娜要求留存完整版本。',[
   option('交完整副本，注明未核实部分','伯爵看见了足以行动的内容，也看见不能越过的空格。',[set('flag.proof'),rel('dantes'),rel('leona')]),
   option('暂缓散发，先把无辜者的名字遮去','你少了一次抢先，给旁人留了一份不被卷入的可能。',[add('mercy',2),add('time',-1)]),
   option('只交有利片段，换取更多资助','钱如期到手，完整性却在你的选择里被削薄。',[add('funds',2),add('exposure',1),rel('leona',-1)])])
 ],[
  scene('被改写的钟点','旧信抄录台','leona','一处钟点被后来的墨覆盖，尚不能看清底下的数字。',[option('记录不确定，不猜底字','没有答案的位置也进入了核验记录。',[set('flag.proof'),add('evidence',1)]),option('用一份经费做光下对照','可见痕迹多了一层，仍只记录能确认的部分。',[add('funds',-1),add('evidence',2)],{req:ge('funds',1),hint:'对照需一份经费。'})]),
  scene('银行门口的队伍','银行外','danglars','取款的人群还不知内情，门内的人已经准备转移责任。',[option('只提醒自己的证人保留凭据','你没有许诺兑付，也没有替谣言制造另一个版本。',[add('mercy',1),add('evidence',1)]),option('查公开票据流向','你知道了哪些数字能与旧案日期相接。',[add('evidence',2),add('exposure',1)])]),
  scene('修复室的空椅','借住修复室','leona','莉奥娜为你留了工作位，却将私人笔记另锁在抽屉。',[option('不碰抽屉，一起核当天进度','她无需为守住私人空间另费一番解释。',[rel('leona',2)]),option('让出整晚安静，自己去跑经费','你挣下一份收入，今晚没有额外交谈。',[add('funds',2),add('time',-1)])])
 ]);
 chapter(c,6,'谁会一起倒下','复仇不止发生在目标的书房。失去工资的家人、被点名的抄手，也会从同一扇门被推出来。',[
  scene('先清委托的旧账','伯爵书房','dantes','预支经费的委托到了结算期。你须交出完整记录、退回未挣得的款项，或把工作改成可公开说明的复核。',[
   option('交完整记录，保留核验与疑点','委托结清，伯爵不能把没有写过的结论算到你的名下。',[set('flag.proof'),rel('dantes')],{resolve:[['advance','transform']]}),
   option('退还三份经费，退出后续施压','账目结清，你不再为他继续推进私下要挟。',[add('funds',-3),add('mercy',1)],{req:ge('funds',3),hint:'退还需要三份经费。',resolve:[['advance','cancel']]}),
   option('改为公开复核，接受暴露身份','委托的责任转到可查的程序里，你也不能再躲在匿名之后。',[add('exposure',2),add('evidence',1)],{resolve:[['advance','reroute']]})]),
  scene('梅尔塞苔丝的边界','安静会客室','mercedes,dantes','梅尔塞苔丝没有替任何罪行求开脱。她要求你们说清：计划里哪些人从未参与过那件旧案。',[
   option('划掉无涉旧案者的姓名，安排独立去处','伯爵沉默很久，最终把一页名单从计划中抽出。',[add('mercy',3),set('flag.safe'),rel('mercedes')]),
   option('坚持只追已核实的责任，推迟余下行动','调查继续，不能核实的那部分暂时不被当作筹码。',[add('evidence',1),add('time',-1),set('flag.safe')]),
   option('利用家属去向迫使目标就范','对方很快有了反应，与你合作的人也清楚看见了手段。',[add('evidence',1),set('flag.used'),rel('mercedes',-2),rel('leona',-2)])])
 ],[
  scene('不能署名的证人','安全住处','leona','证人愿意澄清日期，却担心一家人的生计。',[option('付费安排暂住，明确不购买证词','帮助与证词分开记，证人仍能说不知道。',[add('funds',-1),add('mercy',2)],{req:ge('funds',1),hint:'暂住需一份经费。'}),option('缩小公开范围，先保存原记录','证词未被立刻用来造势，证人知道退出的办法。',[set('flag.safe'),add('time',-1)])]),
  scene('停下来的车','巴黎侧街','mercedes','她的马车已备好，只问你能否将一份不涉及家属的抄件送到。',[option('亲自送达并留回执','交接清楚，私人的去向仍不被写进公开名单。',[add('mercy',1),rel('mercedes')]),option('安排可信投递，自己继续查账','你花了路费，也保住了接下来的一段查阅时辰。',[add('funds',-1),add('time',1)],{req:ge('funds',1),hint:'投递需一份经费。'})]),
  scene('把话说到纸外','河岸','leona','莉奥娜问你：如果有一天核验结果不利于伯爵，你是否还愿意保留它？',[option('把决定写进双方都能保留的记录','这份承诺首先能被对照，其次才值得被相信。',[rel('leona',2),set('flag.proof')]),option('承认自己仍犹豫，不要求她替你担保','她没有替你作答，也没有立刻离开。',[rel('leona'),add('mercy',1)])])
 ]);
 chapter(c,7,'让证据说话','足够响亮的指控并不等于足够可靠的记录。今天之后，别人也能拿你的材料反过来核验你。',[
  scene('公开抄本的封条','独立记录所','leona,villefort','封条将记录原件、副本与交接人。维尔福仍会质疑来源；这一次，答案不能只靠伯爵的威望。',[
   option('提交完整证据链，接受逐项质疑','每份来源与未明处一并入档，旧案终于不再只存在于传言里。',[add('evidence',2),add('exposure',2),set('flag.milestone')],{req:all(ge('evidence',8),yes('flag.proof')),hint:'需要证据≥8，且完成过来源核验。'}),
   option('先存档已核实部分，继续补缺','你公开的范围较小，尚不够下完整结论。',[add('evidence',1),add('time',-1)]),
   option('暂缓公开，将原件交独立保管','记录不会随着你的离开消失，复仇的速度却慢下来。',[set('flag.released'),add('mercy',1)])]),
  scene('伯爵想要的最后一步','巴黎书房','dantes','伯爵看过封条上的名单，问你是否还会帮助他追到名单以外。他没有将这一次决定交给命运。',[
   option('只协助追究已证实的旧案责任','他接受的是有边界的协助，不是被一句话改写的一生。',[set('flag.proof'),add('mercy',1),rel('dantes')]),
   option('退出私刑，把证据留在可查处','你们没有就此和解，工作仍有可被接手的终点。',[set('flag.released'),add('mercy',2)]),
   option('继续用无辜者的处境施压','计划得以加速，有人却从此不再接受你的解释。',[set('flag.used'),add('evidence',1),rel('leona',-2)])])
 ],[
  scene('印前校样','印刷所','leona','校样中一处形容比证据走得更远。',[option('删掉无法证明的定性','文字少了一分煽动，多了一分可以核对的准确。',[add('evidence',1),set('flag.proof')]),option('暂不刊印，交独立存档','没有读者立刻鼓掌，记录仍然完整。',[add('mercy',1),add('time',-1)])]),
  scene('最后一份经费','修复室','danglars','一份高额的修复工作来自银行家名下，条件是本周别再接访。',[option('拒绝附带沉默的工作','你的经费没有变多，可查阅的时间仍归自己。',[add('time',1)]),option('只接无条件的普通工单','收入有限，条件写清后才开工。',[add('funds',1),add('time',-1)])]),
  scene('傍晚仍有人敲门','安全住处','mercedes','来访者只想知道自己的名字会不会出现在明天的公开材料上。',[option('让当事人看清公开范围','他们不必等报纸替自己回答。',[add('mercy',2),set('flag.safe')]),option('与核验员复查涉及家属的段落','删改有据，不是选择性遮掩责任。',[rel('leona'),add('evidence',1)])])
 ]);
 chapter(c,8,'等待与希望','港口照常迎来新船。旧案不会让世界停下，你留下的材料和欠下的话却都还在。',[
  scene('留下哪一种记录','马赛档案室','leona,dantes','卷宗可以封存、公开或继续补录。伯爵没有再替你准备一张写好结论的纸。',[
   option('公开可核实的完整版本，附上疑点','读者能看见证据，也能看见没有答案的位置。',[set('flag.proof'),add('evidence',1)]),
   option('先封存，安排长期独立保管','你不以一次轰动收尾，记录却有了下一位可追问的保管人。',[set('flag.released'),add('mercy',1)]),
   option('只把有利片段交给委托人','这一次选择也被记录下来，不能因为结卷就消失。',[add('funds',1),add('evidence',-2),rel('leona',-1)])]),
  scene('海风吹干的墨','码头长椅','leona,mercedes','莉奥娜把自己的笔记收好，梅尔塞苔丝来领一份不再需要隐去名字的回执。没有人要求你把余生也写成同一份委托。',[
   option('先送达答应的回执，再谈下一程','每一份交接都有对得上的名字。你们才开始谈工作以外的去处。',[set('flag.safe'),rel('leona')]),
   option('与她们道别，暂时结束调查生活','你没有许诺永不离开，只认真说明了这次离开的原因。',[set('flag.released'),add('mercy',1)]),
   option('接受新的委托，继续独自查证','新卷宗尚未打开。旧卷的成果与代价都留在原处。',[add('evidence',1),add('time',1)])])
 ],[
  scene('给后来者的索引','档案室','leona','新的修复员不认识旧案中任何一个人，只能依照你留下的索引查阅。',[option('补清所有出处与改动','记录终于能够离开写下它的人独立存在。',[add('evidence',1),set('flag.proof')]),option('先完成普通工单，再交接','你领到正常工钱，没有把谋生说成背叛理想。',[add('funds',1)])]),
  scene('没有支票的来访','旅馆门外','dantes','伯爵这次没有带支票，只问你是否还有未交割的文件。',[option('逐项交割，不索要私人承认','一份委托终于有了清楚的尽头。',[rel('dantes'),set('flag.proof')]),option('请他记住仍在等待安置的人','你不替那些人索取感激，只报出需要兑现的安排。',[add('mercy',1),set('flag.safe')])]),
  scene('窗台上的第二只杯子','修复室','leona','莉奥娜说她下午没有调查安排，窗台恰好空着另一只杯子。',[option('问能否一起喝完这杯，再各自安排明天','她将杯子挪近，明天仍留给各自决定。',[rel('leona',2)]),option('留下真实地址，不急着许未来','一段关系有了可以继续的办法，而不是被强行写成结局。',[rel('leona'),add('mercy',1)])])
 ]);
 [ ['paper','c1_m1',0,'c4_m2','早先核对过的纸张与入藏记录，此刻能回答维尔福关于来源的第一个问题。'],['retainer','c1_m2',0,'c6_m1','伯爵当时预付的那笔钱仍在委托簿上。结算必须写明，而不能由下一次付款掩过去。'],['records','c2_m1',0,'c5_m1','伊夫岛的移交簿与信件日期相接，一条线不再只靠一张残纸。'],['threat','c2_m2',2,'c7_m2','伯爵记得你曾以身份要挟。他愿听具体边界，却不愿再听空口保证。'],['independent','c3_m2',0,'c6_s3','莉奥娜一直以自己的核验员身份工作。她带来的异议因此不是一句陪衬。'],['used','c3_m2',2,'c6_m2','你曾擅自替莉奥娜安排身份。梅尔塞苔丝这次格外坚持：每个名字都要由本人决定。'],['formal','c4_m1',0,'c7_m1','正式抄件的交接记录还在，质疑可以逐项回应，而不必借伯爵的名声压过去。'],['letters','c4_s2',0,'c8_m2','梅尔塞苔丝记得你没有索走那封私信。她今天仍愿意亲自来领回执。'],['crosscheck','c5_m1',0,'c7_m1','那次花时间逐项对照的矛盾已写入附注，没有被修饰成一条过分整齐的故事。'],['redact','c5_m2',1,'c8_m1','先前从抄件上遮去的无涉姓名，如今也不在公开索引里。'],['spare','c6_m2',0,'c8_m2','从计划中撤下的那一页名单有了去处。有人得以不带着别人的旧罪继续生活。'],['stop','c7_m2',1,'c8_m1','你退出的那一步没有让原件消失。独立保管的回执仍能接上这份卷宗。'] ].forEach(args=>echo(c,...args));
 c.sources=[{url:'https://www.gutenberg.org/ebooks/1184',what:'大仲马原著英文公版底本（美国）；本项目中文场景为新写改编，未使用现代中文译本'}];
 return finish(c,'evidence',10,'旧案留下了一条可核对的证据链。伯爵的行动不能再替代所有人的判断，你也不必靠他的财富解释每一张纸从何而来。','你让复仇的速度慢下来，把原件与未解之处交给能独立核验的人。放下私下施压，不等于宣布旧案从未发生。');
}

function questionsAndConsequences(c){
 const mortal=c.id==='mortal-path',partner=mortal?'lu':'leona',cost=mortal?'health':'time',money=mortal?'stones':'funds',care=mortal?'care':'mercy';
 const questions=mortal?[
  ['c1_m2','ye','借来的修为，到期拿什么还？','按能兑现的数还，不拿别人作保。','自己的|自己|不牵连|不拿别人','c3_m2'],
  ['c3_m1','lu','两条水槽，你准备怎样分？','先说能救哪些人，再把代价算清。','救|病|先人|两边','c5_m2'],
  ['c5_m2','lu','下一段路，我能不能自己选？','去留由你，我不替你签名。','由你|自己|不替|尊重','c7_m1'],
  ['c7_m1','han','若这次条件不够，你还要硬冲吗？','可以延期，先确认经脉与材料。','延期|不硬|先确认|等|不急','c8_m1']
 ]:[
  ['c1_m2','dantes','若出钱的人要的不是全部真相呢？','委托不能规定调查结论。','不能|独立|全部|真相|核验','c3_m1'],
  ['c3_m2','leona','我进这场宴席，以谁的身份？','以你自己的核验员身份。','自己|核验员|独立|本人','c5_m1'],
  ['c5_m1','leona','三个人转述同一个传言，算几条证据？','仍是同一个来源，需要独立核实。','一个|同源|一条|独立|核实','c7_m1'],
  ['c7_m2','dantes','若无辜的人挡在复仇路上，你会怎么办？','先移开无辜者，再谈责任。','无辜|先移|保护|不牵连|停','c8_m2']
 ];
 questions.forEach(([id,who,q,reply,match,later],i)=>{
  const eid='answer'+i;c.echoes[eid]='先前的问题留有回响。';c.nodes[id].ask={who,q,fallback:'uncertain',answers:[{id:'bounded',means:'明确边界，承担自己能确认的责任',match,out:p(reply),effects:[rel(who)],echo:[eid]},{id:'force',means:'不计代价、强迫他人或放弃核验',match:'不管|必须听我|牺牲|随便编|不核实|不重要',out:p('对方没有立即同意，先把这句话记了下来。'),effects:[rel(who,-1),add('exposure',1)]},{id:'uncertain',means:'犹豫、转移话题、未知或未作答',out:p('对方留出时间，没有把沉默当作答应。'),effects:[]}]};
  c.nodes[later].callbacks=[...(c.nodes[later].callbacks||[]),{pays:eid,text:mortal?'你先前说过要把代价算清。这一次，对方等着看具体的安排。':'对方还记得你先前对核验与边界的回答，眼前这份材料正好需要兑现。'}];
 });
 c.nodes.x_exposure={id:'x_exposure',chapter:'c4',kind:'interrupt',lock:'functional',order:0,title:mortal?'追查来到住处':'调查者也被调查',place:mortal?'临时落脚处':'巴黎临时住处',cast:[{id:partner}],intro:p(mortal?'跟踪的痕迹已无法忽略。陆晞提醒你，继续用原来的落脚处，会把同行者也带进行踪记录。':'有人开始向旅馆询问你的出入。莉奥娜把副本封起，要求先改变联络方式。'),when:ge('exposure',7),free_scene:2,art:{scene:'pending',layers:[]},choices:[{id:'move',type:'strategy',...option(mortal?'支付两枚灵石换落脚处':'支付两份经费换安全住处','位置更换，旧的行踪链暂时断开；已经被人知道的事不会因此抹去。',[add(money,-2),add('exposure',-5)],{req:ge(money,2),hint:'需要两份可用资金。'})},{id:'walk',type:'strategy',...option(mortal?'放弃近路，徒步转移':'暂停一轮查阅，自己安排转移','你付出时间与体力，总算没有让同伴替你承担暴露的后果。',[add(cost,-1),add('exposure',-3),rel(partner)])}]};
 const settle=c.nodes.c6_m1;
 settle.choices.forEach(x=>{x.when={v:'debt.advance',op:'==',val:'open'};});
 settle.choices.push({id:'clear',type:'strategy',label:'核对从未预支的记录，正常交割',out:p('没有借过的那笔款项不会凭空出现。你只为自己确实接手的事项签名。'),effects:[set('flag.proof')],when:{v:'debt.advance',op:'==',val:'none'}});
 delete c.vars['flag.sidelined'];
 if(!mortal){c.nodes.c6_s3.when=yes('flag.route');c.nodes.c7_m1.choices[0].req.all.push(ge('time',1));c.nodes.c7_m1.choices[0].hint+=' 另需调查余裕≥1；耗尽时可先存档或暂缓。';}
 for(const [id,char]of Object.entries(c.chars)){
  c.endings.push({id:'rel_'+id,title:char.name+'记得的你',fragments:[{id:'trusted',when:ge('rel.'+id+'.trust',4),text:char.name+'愿意继续把明确的消息交给你，但仍保留自己的判断。'},{id:'reserved',text:char.name+'与你保持礼貌距离。有限的来往还不足以替彼此担保。'}]});
 }
 c.endings.push({id:'cost',title:'留下的代价',fragments:[{id:'exposed',when:ge('exposure',7),text:'你的名字已经被许多人记住。下一次开始调查或修行，不能再假定自己只是无人留意的过客。'},{id:'care',when:ge(care,7),text:'那些被认真照顾过的人有了各自的去处。它没有替你换来一切，却让旧事不再只有功劳与胜负。'},{id:'private',text:'你保留了一部分自己的生活。故事暂时停在这里，尚未付出的代价不会被提前算作已经承担。'}]});
 if(!mortal)c.endings.find(g=>g.id==='cost').fragments.unshift({id:'late',when:{v:'time',op:'<=',val:0},text:'你用尽了本卷的调查余裕。来不及完成的程序须留待以后，已经保存的原件仍然有效。'});
 // Every otherwise unacknowledged major flag gets a concrete callback in the next chapter.
 for(const n of Object.values(c.nodes))for(const [i,ch]of n.choices.entries()){
  if(n.kind==='interrupt'||n.chapter==='c8'||ch.echo?.length||ch.resolve?.length||!ch.effects.some(e=>e.set?.startsWith('flag.')))continue;
  const next='c'+(Number(n.chapter.slice(1))+1)+'_m1',eid=n.id+'_'+ch.id;
  c.echoes[eid]=ch.label;ch.echo=[eid];c.nodes[next].callbacks=[...(c.nodes[next].callbacks||[]),{pays:eid,text:'上一次，你选择了“'+ch.label+'”。这件事已留在经手人的记录里，接下来谈条件时，不能假定它没有发生。'}];
 }
 return c;
}
export const campaigns=Object.fromEntries([mortal(),monte()].map(c=>[c.id,questionsAndConsequences(c)]));

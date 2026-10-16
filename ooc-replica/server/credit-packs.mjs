export const creditPacks=[
 {credits:200,amount:199,currency:'usd',label:'初次启程',env:'STRIPE_PRICE_200',sandboxPrice:'price_1UPzrFPIQul5mfy0iwXH9uK2'},
 {credits:2500,amount:1999,currency:'usd',label:'更多可能',env:'STRIPE_PRICE_2500',sandboxPrice:'price_1UPzrLPIQul5mfy05ObsbLvj'},
 {credits:5000,amount:2999,currency:'usd',label:'长篇相伴',env:'STRIPE_PRICE_5000',sandboxPrice:'price_1UPzrRPIQul5mfy0pB3wcA0l'}
];
export const packs=Object.fromEntries(creditPacks.map(p=>[p.credits,p]));
export const stripeMode=env=>/^(?:sk|rk)_test_/.test((env.STRIPE_SECRET_KEY||'').trim())?'test':'live';
export const priceId=(p,env)=>env[p.env]||(stripeMode(env)==='test'?p.sandboxPrice:null);

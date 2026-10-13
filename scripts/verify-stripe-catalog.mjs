// Run explicitly in the trusted Netlify build. No payment creation or secret output.
import {creditPacks,priceId,stripeMode} from '../data/credit-packs.mjs';
if(stripeMode(process.env)!=='test'){console.error('STRIPE_PROBE requires sandbox key');process.exit(1);}
for(const p of creditPacks){
 const id=priceId(p,process.env);
 const r=await fetch('https://api.stripe.com/v1/prices/'+id,{headers:{Authorization:'Bearer '+process.env.STRIPE_SECRET_KEY.trim(),'Stripe-Version':'2026-08-26.dahlia'},signal:AbortSignal.timeout(12000)});
 if(!r.ok){console.error(JSON.stringify({event:'stripe_catalog_probe',credits:p.credits,ok:false,status:r.status}));process.exit(1);}
 const price=await r.json();const ok=price.active&&price.livemode===false&&price.type==='one_time'&&price.unit_amount===p.amount&&price.currency===p.currency;
 console.log(JSON.stringify({event:'stripe_catalog_probe',credits:p.credits,price_id:id,ok,amount:price.unit_amount,currency:price.currency,livemode:price.livemode}));if(!ok)process.exit(1);
}
console.log('STRIPE_CATALOG_PROBE 3/3 passed');

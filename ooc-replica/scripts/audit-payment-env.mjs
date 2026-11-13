// Lists configuration presence only. Never decrypt, print or save variable values.
import {pathToFileURL} from 'node:url';
export function auditNames(keys,{target='production'}={}){
 if(!['production','preview'].includes(target))throw Error('Unsupported audit target');
 const names=new Set(keys);
 const groups=[['FIREBASE_API_KEY'],['FIREBASE_AUTH_DOMAIN'],['FIREBASE_PROJECT_ID'],['FIREBASE_APP_ID'],['FIREBASE_CLIENT_EMAIL'],['FIREBASE_PRIVATE_KEY'],['APP_URL'],...(target==='preview'?[['STRIPE_SECRET_KEY'],['STRIPE_WEBHOOK_SECRET'],['CREDIT_BILLING_MODE']]:[['STRIPE_LIVE_SECRET_KEY','STRIPE_SECRET_KEY'],['STRIPE_LIVE_WEBHOOK_SECRET','STRIPE_WEBHOOK_SECRET'],['STRIPE_LIVE_ENABLED']]),['STRIPE_PRICE_200'],['STRIPE_PRICE_2500'],['STRIPE_PRICE_5000']];
 return groups.map(alternatives=>({names:alternatives,present:alternatives.some(name=>names.has(name))}));
}
export async function auditVercel({token,project='storydate-zhou',teamId,target='production',branch=null,fetchImpl=fetch}){
 if(!['production','preview'].includes(target))throw Error('Unsupported audit target');
 if(!token)throw Error('VERCEL_TOKEN is required to verify variable names.');
 const url=new URL(`https://api.vercel.com/v10/projects/${encodeURIComponent(project)}/env`);
 url.searchParams.set('target',target);url.searchParams.set('decrypt','false');if(teamId)url.searchParams.set('teamId',teamId);
 const response=await fetchImpl(url,{headers:{Authorization:`Bearer ${token}`}});
 if(!response.ok)throw Error(`Vercel variable-name audit failed (HTTP ${response.status}).`);
 const data=await response.json();if(!Array.isArray(data.envs))throw Error('Vercel returned no variable-name list.');
 return {project,target,branch,checks:auditNames(data.envs.filter(item=>(Array.isArray(item.target)?item.target.includes(target):item.target===target)&&(!item.gitBranch||item.gitBranch===branch)).map(item=>item.key),{target}),note:'Names and target scope only. Does not verify values, test/live credential validity, authorized domains, webhooks or successful sign-in. Branch-specific values for another branch do not count.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 try{const args=process.argv.slice(2);if(args.some(a=>!['--target=','--branch='].some(p=>a.startsWith(p))))throw Error('Unknown audit option');const result=await auditVercel({token:process.env.VERCEL_TOKEN,project:process.env.VERCEL_PROJECT_ID||'storydate-zhou',teamId:process.env.VERCEL_TEAM_ID,target:args.find(a=>a.startsWith('--target='))?.slice(9)||'production',branch:args.find(a=>a.startsWith('--branch='))?.slice(9)||null});console.log(JSON.stringify(result,null,2));if(result.checks.some(check=>!check.present))process.exitCode=1;}
 catch(error){console.error(error.message);process.exitCode=2;}
}

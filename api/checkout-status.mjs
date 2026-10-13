import {platform} from '../server/platform.mjs';
export const GET=req=>platform.checkoutStatus(req);

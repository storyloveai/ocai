import {platform} from '../../server/platform.mjs';
export const config={path:'/api/checkout-status'};
export default req=>platform.checkoutStatus(req);

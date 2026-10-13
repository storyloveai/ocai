import {analytics} from '../../server/analytics.mjs';
export const config={path:'/api/events',rateLimit:{windowLimit:60,windowSize:60,aggregateBy:['ip','domain'],action:'rate_limit'}};
export default analytics;

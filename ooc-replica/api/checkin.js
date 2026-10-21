import { paymentHandler } from '../server/payment-handler.js';
export const config = { api: { bodyParser: false } };
export default paymentHandler('checkin');

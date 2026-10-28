
import { ORDERSTATE, ORDERTYPE, type Order } from "./types.js";

export const AUTH_URL = 'https://127.0.0.1:1031/api/get';

export const host = 'https://d326ndd7qg08xl.cloudfront.net/';
//export const host = 'https://13.235.102.236:1029/'
//export const host = 'http://127.0.0.1:1025/';

export const tg_1_id: string = 'charts';
export const tg_2_id: string = 'optionchains';
export const tg_3_id: string = 'positions';

export const order_template = {
    product: 'NRML',
    state: ORDERSTATE.NEW,
    modify: false,
    ordertype: ORDERTYPE.MARKET,
    quantity: 1
} as Order;    

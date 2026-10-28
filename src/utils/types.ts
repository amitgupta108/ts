import type { Bar, PriceScaleId } from "openalgo-charts"
export interface AppProfile {
    simStartTime: number,
    lookbackstart: number,
    lookbackend: number,
    fExpiry: string,
    oExpiries: string[],
    stockCode: string,
    mode: string,
    appid: string
}

export interface Quote {
    symbol: string,
    ltp: number,
    ltt: number,
    key: string,
    exchange: string
}

export interface OHLC extends Bar {
    type?: string;
}

export interface Request {
    symbol: string;
    fExpiry?: string;
    stockCode: string;
}

export interface HistoryRequest extends Request {
    startTime: number;
    endTime: number;
    interval: string;
}

export interface ChartRequest {
    symbol: string;
    priceScaleId: PriceScaleId;
    visible: boolean;
    paneIndex: number;
}

export const ROWTYPE = {
    OPTIONCHAIN: 'optionchain',
    ORDERWINDOW: 'orderwindow',
    ORDERDISPLAY: 'orderdisplay'
} as const;

export type ROWTYPE = typeof ROWTYPE[keyof typeof ROWTYPE];


export const OPTIONTYPE = {
    CALL: 'CE',
    PUT: 'PE'
} as const;

export type OptionType = typeof OPTIONTYPE[keyof typeof OPTIONTYPE];

export interface Scrip {
    expiry: string,
    strike: string,
    right: OptionType,
    stockCode: string,
    name?: string,
}

export interface ExQuote extends Quote {
    scrip: Scrip
}

export const ORDERACTION = {
    BUY: 'B',
    SELL: 'S'
} as const;

export type ORDERACTION = typeof ORDERACTION[keyof typeof ORDERACTION];

export const ORDERTYPE = {
    MARKET: 'MARKET',
    LIMIT: 'LIMIT'
} as const;

export type ORDERTYPE = typeof ORDERTYPE[keyof typeof ORDERTYPE];

export const ORDERSTATE = {
    NEW: 'new',
    OPENED: 'opened',
    CANCELLED: 'cancelled',
    COMPLETED: 'completed',
    SUBMITTED: 'submitted',
    REJECTED: 'rejected',
    PARTIAL: 'partial',
} as const;

export type ORDERSTATE = typeof ORDERSTATE[keyof typeof ORDERSTATE];

export interface Order {
    appid: string,
    stockCode: string,
    strategy: string,
    product: string;
    symbol: string;
    action: ORDERACTION;
    quantity: number;
    filled_q?: number;
    pricedAt?: number;
    orderid: string;
    ordertype: ORDERTYPE;
    pricetype: ORDERTYPE
    price: number;
    state: ORDERSTATE;
    modify?: boolean;
    submittime?: number,
    executiontime?: number
}

export interface OpenPosition {
    quantity: number;
    pnl: number;
    avgprice: number;
}

export interface BookedPosition {
    quantity: number;
    buyv: number;
    sellv: number;
}
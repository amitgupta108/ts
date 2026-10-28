import type { Quote, Scrip, OHLC, OptionType, ExQuote } from "../utils/types.js";

const sTVtime = (datetime: string) => Math.round(Date.parse(datetime) / 1000);

class EventService extends EventTarget {
    public lastfq?: Quote;
    symbol_map = new Map<string, Scrip>();

    constructor() {
        super();
    }

    eventDispatch(eventName: string, data: any): void {
        if (eventName === 'quote')
            this.emitQuote(data);
        else if (eventName === 'history')
            this.emitHistory(data);
        else if (eventName === 'order')
            this.emitOrder(data);
        else if (eventName === 'orderbook')
            this.emitOrderbook(data);
        else if (eventName === 'heartbeat')
            this.emitHeartbeat(data);
    }

    emitOrder(order: any) {
        this.dispatchEvent(new CustomEvent('order', { detail: order }));
    }

    emitOrderbook(orders: any[]) {
        this.dispatchEvent(new CustomEvent('orderbook', { detail: orders }));
    }

    emitQuote(q: Quote) {

        if (!q || !q.symbol)
            return

        const s: Scrip = this.getScrip(q.symbol);
        (q as ExQuote).scrip = s;

        this.dispatchEvent(new CustomEvent('quote', { detail: q }));
        if (q.key === "futures") {
            //latency_label.textContent = Date.now() - q.ltt;
            this.lastfq = q;
            if (q.exchange.toLowerCase().startsWith("mcx"))
                super.dispatchEvent(new CustomEvent('quote', { detail: q }));
        }
    }

    emitHistory(data: any) {
        const qs = this.initialSeriesData(data.qA);
        this.dispatchEvent(new CustomEvent(`${data.symbol}_history`, { detail: { symbol: data.symbol, qs: qs } }));
    }

    emitHeartbeat(data: any) {
        this.dispatchEvent(new CustomEvent('heartbeat', { detail: data }));
    }

    initialSeriesData(qA: any[]): OHLC[] {

        return qA?.filter((e) => {
            return !(e.datetime.includes('9:00') || e.datetime.includes('9:05') || e.datetime.includes('9:10'))
        }).map((e) => {
            e.time = sTVtime(e.datetime);
            return e as OHLC;
        });
    }

    getScrip(symbol: string): Scrip {
        let s = this.symbol_map.get(symbol);
        if (s === undefined) {
            const idx = symbol?.search(/[0-9]/);
            s = {
                stockCode: idx === -1 ? symbol : symbol?.slice(0, idx),
                right: symbol?.slice(-2) as OptionType,
                expiry: symbol?.slice(idx, idx + 7),
                strike: symbol?.slice(idx + 7, -2),
            };
            s.name = s.expiry.slice(0, 3) + ' ' + s.strike + s.right.slice(0, 1);
            this.symbol_map.set(symbol, s);
        }
        return s as Scrip;
    }
}

export const Eventer = new EventService();
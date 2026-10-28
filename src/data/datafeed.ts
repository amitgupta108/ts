import type { DataFeed, BarsRequest, BarSubscriptionOptions, LiveBarMeta, UnsubscribeFn } from "openalgo-charts";
import type { OHLC } from "../utils/types.js"
import { Eventer } from "../services/eventservice.js";

export class TPDataFeed implements DataFeed {

    history_map = new Map<string, OHLC[]>();
    init() {
        Eventer.addEventListener('history', (e: any) => {
            const d = e.detail;
            this.history_map.set(d.symbol, d.qs);
        });
    }

    async getBars(r: BarsRequest): Promise<OHLC[]> {
        return Promise.resolve(this.history_map.get(r.symbol) ?? []);
    }
    subscribeBars(req: BarsRequest, onBar: (bar: OHLC, meta?: LiveBarMeta | undefined) => void, opts?: BarSubscriptionOptions | undefined): UnsubscribeFn {
        throw new Error("Method not implemented.");
    }
    unsubscribeBars(subscriber: any): void {
        throw new Error("Method not implemented.");
    }
    subscribeRealtime(symbol: string, callback: (bar: OHLC) => void): void {
        throw new Error("Method not implemented.");
    }
    unsubscribeRealtime(subscriber: any): void {
        throw new Error("Method not implemented.");
    }
}
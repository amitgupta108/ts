import { blackScholesImpliedVolatility, blackScholesDelta } from "@vollib/vollib";
import type { ExQuote } from "./types";

export class OptionGreeks {
    static ir: number = 0.065;
    static expiryTimestampCache = new Map();

    static addIVNDelta(q: ExQuote, ultp?: number): number {

        let delta: number = 0;
        if (q !== undefined && ultp !== undefined) {
            const flag = q.symbol.endsWith("CE") ? "c" : "p";
            const yearsToExpiry = this.getYearsToExpiry(q);
            if (yearsToExpiry < 0)
                throw new Error("invalid input");

            try {
                let iv = blackScholesImpliedVolatility(
                    q.ltp, ultp, Number(q.scrip.strike), yearsToExpiry, this.ir, flag
                );
                delta = blackScholesDelta(
                    flag, ultp, Number(q.scrip.strike), yearsToExpiry, this.ir, iv
                );

            } catch (error) {
                console.log("Error occurred while calculating IV and Delta: " + JSON.stringify(error));
                return flag === 'c' ? 1 : -1;
            }
        }
        return Math.round(delta * 10000) / 100;
    }

    static getYearsToExpiry(q: ExQuote): number {
        let expiryTime = this.expiryTimestampCache.get(q.scrip.expiry);
        if (expiryTime === undefined) {
            const [d, m, y] = [q.scrip.expiry.slice(0, 2), q.scrip.expiry.slice(2, 5), q.scrip.expiry.slice(5)];
            const e = `${d}-${m}-20${y}`;
            const time = q.exchange === "mcx_fo" ? ", 23:30" : ", 15:40";
            expiryTime = new Date(e.concat(time)).getTime();
            this.expiryTimestampCache.set(q.scrip.expiry, expiryTime);
        }
        return (expiryTime - q.ltt) / 31536000000; // 31536000000 = 1000*60*60*24*365;
    }
}
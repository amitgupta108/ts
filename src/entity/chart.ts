
import { createChart, darkTheme } from 'openalgo-charts';
import type { Chart, SeriesApi, PriceScaleId } from 'openalgo-charts';
import { EMA } from 'openalgo-charts/indicators';
import type { Quote, OHLC, ChartRequest } from "../utils/types.js";
import { Strategy } from "../comp/strategy.js";
import { Eventer } from "../services/eventservice.js";

const nTVtime = (unixtime: number) => Math.round(unixtime / 1000);

class ChartInstance {
    chart: Chart
    series: Map<string, SeriesApi> = new Map;

    constructor(panel: HTMLDivElement) {

        this.chart = createChart(panel, {
            theme: darkTheme, branding: false, canvas: { scales: { fontSize: 12 } },
            navigation: { panEnabled: true, zoomEnabled: true, defaultVisibleBars: 80 }
        });

        this.chart.timeScale.setRightOffset(10);
        this.chart.timeScale.fitContent(60);

        Eventer.addEventListener('quote', (event: any) => {
            const q = event.detail as Quote;
            if (this.series.has(q.symbol))
                this.handleQuote(q);
        });
    }

    load(requests: ChartRequest[], reuse: boolean = true) {

        if (reuse) {
            const series = Array.from(this.series.values()) ?? [];
            this.series.clear();
            for (let i = 0; i < requests.length; i++) {
                if (i < series.length) {
                    series[i]?.setData([]);
                    this.series.set(requests[i]!.symbol, series[i]!);
                }
                else {
                    const s = this.chart.addSeries('candlestick', {
                        priceScaleId: requests[i]!.priceScaleId as PriceScaleId ?? 'right',
                        paneIndex: requests[i]!.paneIndex as number ?? 0
                    });
                    this.series.set(requests[i]!.symbol, s);
                }
            }
        } else {
            for (let i = 0; i < requests.length; i++) {
                const s = this.chart.addSeries('candlestick', {
                    priceScaleId: requests[i]!.priceScaleId as PriceScaleId ?? 'right',
                    paneIndex: requests[i]!.paneIndex as number ?? 0
                });
                this.series.set(requests[i]!.symbol, s);
            }
        }
    }

    handleQuote(q: Quote) {

        const series = this.series.get(q.symbol);
        if (!series) return;

        const curCandle = series.getData().at(-1) as OHLC | undefined;
        series.update(this.getCandle(q, curCandle));
    }

    getCandle(q: Quote, curCandle: OHLC | undefined): OHLC {
        const newCan = curCandle === undefined || nTVtime(q.ltt) - curCandle.time > 299;
        return (newCan) ? this.newCandle(q, curCandle) : this.updateCandle(q, curCandle!);
    }

    newCandle(q: Quote, curCandle: OHLC | undefined) {
        return {
            time: nTVtime(q.ltt) - (nTVtime(q.ltt) % 300),
            open: (curCandle) ? curCandle.close : q.ltp,
            high: q.ltp,
            low: q.ltp,
            close: q.ltp
        };
    }

    updateCandle(q: Quote, curCandle: OHLC) {
        curCandle.high = Math.max(q.ltp, curCandle.high);
        curCandle.low = Math.min(q.ltp, curCandle.low);
        curCandle.close = q.ltp;

        return curCandle;
    }
}

export class HistoryChart extends ChartInstance {

    ema: boolean = true;
    constructor(panel: HTMLDivElement) {
        super(panel);
    }

    load(requests: ChartRequest[], reuse: boolean = true) {
        super.load(requests, reuse);
        for (const req of requests) {
            Eventer.addEventListener(`${req.symbol}_history`, (e: any) => {
                const d = e.detail;
                this.series.get(d.symbol)!.setData(d.qs);
                if (this.constructor.name === 'StrategyChart')
                    this.aggregateHistory(d.symbol, d.qs);
            });
        }
        if (this.ema) {
            this.chart.addIndicator('ema', { length: 20, timeframe: '5m', priceLineVisible: false }, { paneIndex: 0 });
            this.chart.addIndicator('ema', { length: 20, timeframe: '5m', priceLineVisible: false }, { paneIndex: 1 });
        }
    }

    aggregateHistory(symbol: string, qA: OHLC[]) {

    }
}

export class StrategyChart extends HistoryChart {

    strategy!: Strategy;
    strat_series?: SeriesApi;
    hisData: OHLC[][] = [];

    constructor(panel: HTMLDivElement) {
        super(panel);
        this.ema = false;
    }

    load(requests: ChartRequest[]) {
        super.load(requests);

        this.strat_series?.setData([]);
        this.strat_series = this.chart.addSeries('candlestick', {
            priceScaleId: 'right', paneIndex: 0
        });
        this.strategy = Strategy.getStrategyImpl('strangle');
        this.strategy.init(requests);
    }

    handleQuote(q: Quote): void {
        super.handleQuote(q);

        const str_candle = this.getCandle(
            { symbol: 'ST', ltp: this.strategyImpl(q), ltt: q.ltt } as Quote,
            this.strat_series!.getData().at(-1) as OHLC);

        this.strat_series!.update(str_candle);
    }

    strategyImpl(q: Quote) {

        return this.strategy.calc(q);
    }

    aggregateHistory(symbol: string, qA: OHLC[]) {

        this.hisData.push(qA);

        if (this.hisData.length == this.series.size) {
            let aggregate_hist = new Array<OHLC>(this.hisData[0]!.length);
            for (var i = 0; i < aggregate_hist.length; i++) {
                aggregate_hist[i] = {
                    time: this.hisData[0]![i]!.time,
                    close: 0, high: 0, open: 0, low: 0,
                };
                for (var j = 0; j < this.hisData.length; j++) {
                    aggregate_hist[i]!['close'] += this.hisData[j]![i]!['close'];
                    aggregate_hist[i]!['high'] += this.hisData[j]![i]!['high'];
                    aggregate_hist[i]!['open'] += this.hisData[j]![i]!['open'];
                    aggregate_hist[i]!['low'] += this.hisData[j]![i]!['low'];
                }
            }
            this.strat_series!.setData(aggregate_hist);
        }
    }
}
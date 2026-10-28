import { TPWebApp } from './app.js';
import { NavBar } from '../comp/navbar.js';
import { HistoryChart, StrategyChart } from '../entity/chart.js';
import { OptionChain } from '../entity/optionchain.js';
import { OrderWindow } from '../comp/orderwindow.js';
import { Layout } from "./layout.js";
import { Positions } from '../comp/positions.js';
import { tg_1_id, tg_2_id, tg_3_id } from '../utils/constants.js';

import type { AppProfile, ChartRequest, HistoryRequest, ORDERACTION, Order } from '../utils/types.js';
import type { PriceScaleId } from "openalgo-charts"
import { OrderList } from '../comp/orderlist.js';

export class UIApp {
    parent: TPWebApp;
    profile?: AppProfile;
    navbar: NavBar;
    layout: Layout;
    futures_chart?: HistoryChart;
    options_chart?: StrategyChart;
    c_optionchain?: OptionChain;
    n_optionchain?: OptionChain;
    order_dialog?: OrderWindow;
    positions?: Positions;
    orderlist?: OrderList;

    constructor(parent: TPWebApp) {
        this.parent = parent;
        this.layout = new Layout(this);
        this.navbar = new NavBar('nav-bar', this);

        this.order_dialog = new OrderWindow('order-window', this);
    }

    init(profile: AppProfile) {

        this.profile = profile;
        this.navbar.init(profile);
        this.layout.init(profile);

        this.futures_chart = new HistoryChart(this.layout.getChartGroup().getContentPane('Chart1')!);
        this.options_chart = new StrategyChart(this.layout.getChartGroup().getContentPane('Chart2')!);

        const expiry1 = this.profile!.oExpiries![0]! as string;
        const expiry2 = this.profile!.oExpiries?.at(1) as string;

        this.c_optionchain = new OptionChain(expiry1, `${tg_2_id}_${expiry1}_content`, this);
        this.c_optionchain.init();
        if (expiry2 !== undefined) {
            this.n_optionchain = new OptionChain(expiry2, `${tg_2_id}_${expiry2}_content`, this);
            this.n_optionchain.init();
        }

        this.positions = new Positions(`${tg_3_id}_Positions_content`, this);
        this.positions.init();

        this.orderlist = new OrderList(`${tg_3_id}_Orderbook_content`, this);
        this.orderlist.init();


        this.navbar.enableButton("start-btn");

        this.order_dialog?.init();
    }

    loadPrimaryChart() {

        const chart_reqs: ChartRequest[] = [
            { symbol: this.profile!.stockCode + this.profile!.fExpiry + 'FUT', priceScaleId: "right", paneIndex: 0, visible: true },
            { symbol: this.profile!.stockCode, priceScaleId: "right", paneIndex: 1, visible: true },
            { symbol: 'INDVIX', priceScaleId: "left", paneIndex: 0, visible: true }
        ];

        this.futures_chart?.load(chart_reqs);

        const history_requests = this.historyRequests([
            this.profile!.stockCode + this.profile!.fExpiry + 'FUT',
            this.profile!.stockCode,
            'INDVIX'
        ]);

        this.parent.history(history_requests);
        this.parent.start();
    }

    submitOrders(orders: Order[]) {
        this.parent.submitOrders(orders);
    }

    loadStrategyChart() {
        this.layout.getChartGroup().switchTabs(1);
        const expiry = this.layout.getOCGroup().getActiveTabLabel()

        const symbols: string[] = OptionChain.optionChains.get(expiry)!.getHighlightedRowSymbols();

        const requests = this.chartRequests(symbols);
        this.options_chart?.load(requests);

        const hist_requests = this.historyRequests(symbols);
        this.parent.history(hist_requests);
    }

    chartRequests(symbols: string[]) {
        const requests: ChartRequest[] = [];

        symbols.forEach((symbol, i) => {
            requests.push({
                symbol: symbol as string, visible: true, paneIndex: 0 as number,
                priceScaleId: ((i + 1) % 2) == 0 ? 'left' : 'right' as PriceScaleId
            });
        });
        return requests;
    }

    historyRequests(symbols: string[]) {
        const req: any = {
            stockCode: this.profile!.stockCode,
            startTime: this.profile!.lookbackstart,
            endTime: this.profile!.lookbackend,
            fExpiry: this.profile!.fExpiry,
            interval: '5minute'
        };
        const requests: HistoryRequest[] = [];

        for (const symbol of symbols) {
            requests.push({ ...req, symbol: symbol as string });
        }
        return requests;
    }

    newOrder(symbol: string, action: string) {
        this.order_dialog?.newOrder(symbol, action as ORDERACTION);
    }

    newOrderMulti(symbol: string, action: ORDERACTION, quantity: number) {
        this.order_dialog?.createOrder(symbol, action, quantity);
        (document.getElementById('order-window') as HTMLDivElement).style.display = 'none';
    }

    showOrderWindow() {
        this.order_dialog?.show();
    }

    hideOrderWindow() {
        this.order_dialog?.hide();
    }

    notifyEvent(event: Event, tg_id: string) {
        if (tg_id === tg_1_id) {
            const clicked = event.target as HTMLButtonElement;
            if (clicked.innerText.toUpperCase() === 'C')
                this.loadStrategyChart();
        }
        else if (tg_id === tg_3_id) {
            const clicked = event.target as HTMLButtonElement;
            if (clicked.innerText.toUpperCase() === 'C')
                this.orderbook();
        }
    }

    isBasketEnabled() {
        return this.navbar.isBasketEnabled();
    }

    disableBasketToggle(flag: boolean) {
        this.navbar.disableBasketToggle(flag);
    }

    getAppProfile(property: keyof AppProfile | undefined = undefined) {
        if (property === undefined)
            return this.profile;
        else
            return this.profile?.[property];
    }

    orderbook() {
        this.layout.getPositionsGroup().switchTabs(1);
        this.parent.orderbook();
    }

    listOrders(symbol: string) {
        this.orderlist?.listOrders(symbol);
        this.layout.getPositionsGroup().switchTabs(1);
    }
}
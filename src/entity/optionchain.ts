import { Eventer } from '../services/eventservice.js';
import { type ExQuote, type ORDERACTION } from '../utils/types.js';
import { RowFactory } from '../utils/factory.js';
import { OptionGreeks } from '../utils/greeks.js';
import { UIApp } from '../app/ui.js';

const STRIKE_SIZE = {
    NIFTY: 50,
    CRUDEOIL: 50
};

export class OptionChain {
    static optionChains: Map<string, OptionChain> = new Map();

    expiry: string;
    container: HTMLDivElement;
    atm: number = 0;
    row_map: Map<string, any> = new Map();
    OTMRange = { high: 8, low: 0 };
    parent: UIApp;
    interval: number;

    constructor(expiry: string, v_oc_id: string, parent: UIApp) {
        this.expiry = expiry;
        this.container = document.getElementById(v_oc_id) as HTMLDivElement;
        this.parent = parent;
        this.interval = STRIKE_SIZE[this.parent.getAppProfile('stockCode') as keyof typeof STRIKE_SIZE];

        OptionChain.optionChains.set(expiry, this);
    }

    init() {
        const h_call_tbl = document.createElement('table');
        h_call_tbl.classList.add('oc-table');
        this.container.appendChild(h_call_tbl);

        const h_put_tbl = document.createElement('table');
        h_put_tbl.classList.add('oc-table');
        this.container.appendChild(h_put_tbl);

        const range = this.OTMRange.high - this.OTMRange.low;
        for (var i = 0; i <= range; i++) {
            h_call_tbl.append(this.createRow('CE'));
            h_put_tbl.append(this.createRow('PE'));
        }
        this.setupListenersEx();
    }

    createRow(type: string) {
        const tr = RowFactory.create(RowFactory.templates.optionchain) as HTMLTableRowElement;
        tr.classList.add(type === 'CE' ? 'tr-straight' : 'tr-reverse');
        tr.addEventListener('click', (e: Event) => {
            e.stopPropagation();
            this.handleRowEvent(e);
        }, true);
        return tr;
    }

    setupListenersEx() {
        Eventer.addEventListener('quote', (event: any) => {
            if (!this.container.checkVisibility()) return;

            var q = event.detail as ExQuote;

            if (q.key === 'strikex' && q.scrip.expiry === this.expiry)
                this.onQuote(q);
            else if (q.key === 'futures')
                this.onUQuote(q);
        });
    }

    handleRowEvent(e: Event) {
        const clicked = e.target as HTMLElement;
        const parent = e.currentTarget as HTMLTableRowElement;

        if (clicked.id === 'row_attn_btn')
            parent.classList.toggle('row-highlight');
        else if (clicked.id === 'div_trans_btn')
            this.createOrder(clicked, parent);
    }

    createOrder(clicked: HTMLElement, parent: HTMLTableRowElement) {
        const symbol = parent.title;
        const action = clicked.innerText;

        this.parent.newOrder(symbol, action as ORDERACTION);
    }

    onUQuote(q: ExQuote) {
        if (Math.abs(q.ltp - this.atm) > this.interval) {
            this.atm = Math.round(q.ltp / this.interval) * this.interval;
            const range = this.OTMRange.high - this.OTMRange.low;

            this.row_map.clear();
            for (var i = 0; i < range * 2; i++) {
                if (i < range)
                    this.strike(this.atm + (this.OTMRange.low + i) * this.interval, 'CE', i);
                else
                    this.strike(this.atm - (this.OTMRange.high - i) * this.interval, 'PE', i);
            }
        }
    }

    strike(strike: number, type: 'CE' | 'PE', i: number) {
        const className = type === 'CE' ? 'tr-straight' : 'tr-reverse';
        const row = this.container.querySelector(`.${className}:nth-child(${i + 1})`) as HTMLTableRowElement;

        let symbol = this.parent.getAppProfile('stockCode') + this.expiry + strike + type;
        (row.cells[2]!.childNodes[3]! as HTMLElement).textContent = String(strike);
        row.title = symbol;
        this.row_map.set(symbol, row);
    }

    onQuote(q: ExQuote): void {
        const row = this.row_map.get(q.symbol);

        if (row !== undefined) {
            row.cells[1].textContent = q.ltp.toFixed(2);
            row.cells[0].textContent = OptionGreeks.addIVNDelta(q, Eventer.lastfq!.ltp).toFixed(2);
        }
    }

    markPosition(symbol: string, psize: number) {
        const row = this.row_map.get(symbol);

        if (row) {
            if (psize === 0) {
                row.cells[2].childNodes[1].textContent = '';
                row.classList.remove('buy', 'sell');
            }
            else {
                row.cells[2].childNodes[1].textContent = psize;
                row.classList.add(psize > 0 ? 'buy' : 'sell');
            }
        }
    }

    getHighlightedRowSymbols(): string[] {
        return Array.from(this.container.querySelectorAll('tr.row-highlight')).map((r) => {
            return (r as HTMLTableRowElement).title as string;
        });
    }

    static get(expiry: string) {
        return OptionChain.optionChains.get(expiry);
    }
}
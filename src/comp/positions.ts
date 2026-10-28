import type { Order, Quote } from "../utils/types.js";
import { ORDERACTION, ORDERSTATE } from "../utils/types.js";
import { Eventer } from "../services/eventservice.js";
import { UIApp } from "../app/ui.js";
import { Position } from "../entity/position.js";

export class Positions {
    positions: Map<string, Position>;
    container: HTMLDivElement;
    parent: UIApp;
    pl_fields_ref?: HTMLTableCellElement[];

    constructor(id: string, parent: UIApp) {
        this.positions = new Map<string, Position>();
        this.parent = parent;
        this.container = document.getElementById(id) as HTMLDivElement;
        this.pl_fields_ref = new Array(3);
    }

    init() {
        const table = document.createElement("table");
        const tbody = document.createElement("tbody");

        table.appendChild(this.header());
        table.appendChild(tbody);
        table.appendChild(this.footer());

        this.container.appendChild(table);
        this.setupListeners();
        this.setupListnersEx();
    }

    header() {
        const thead = document.createElement("thead");
        const header_row = document.createElement("tr");

        const labels = {
            cb: 4, Scrip: 20, Booked: 22,
            AvgPr: 10, LTP: 10, Open: 22, Total: 14
        };

        Object.entries(labels).forEach(([label, width]) => {
            const th = document.createElement("th");
            if (label === 'cb') {
                th.innerHTML = "<input type='checkbox' id='exit-all-cb'></input>";
            } else {
                th.textContent = label;
                th.colSpan = ['Booked', 'Open'].includes(label) ? 2 : 1;
            }
            th.style.width = width + "%";
            header_row.appendChild(th);
        });

        thead.appendChild(header_row);
        return thead;
    }

    footer() {
        const tfoot = document.createElement("tfoot");
        const footer_row = document.createElement("tr");
        tfoot.appendChild(footer_row);

        const pos_exit_btn = document.createElement('button');
        pos_exit_btn.textContent = 'Exit';
        pos_exit_btn.id = 'pos-exit-btn';
        pos_exit_btn.disabled = true;
        footer_row.appendChild(pos_exit_btn);

        const labels = ['Booked: ', 'total-booked-lb', 'Open:', 'total-open-lb', 'Total: ', 'total-pl-lb'];
        for (let i = 0; i < labels.length; i++) {
            let td = document.createElement('td');
            if (i % 2 === 1) {
                const idx = (i - 1) / 2;
                td.id = labels[i]!;
                this.pl_fields_ref![idx] = td;
                td.style.width = '18%';

            } else {
                td.textContent = labels[i]!;
                td.style.width = '12%';
            }
            footer_row.appendChild(td);
        }
        return tfoot;
    }

    setupListnersEx() {
        Eventer.addEventListener('quote', (e: Event) => {
            const q = e as CustomEvent<Quote>;
            const quote = q.detail;
            this.positions.get(quote.symbol)?.onQuote(quote);

            this.updateTotals({});
        });

        Eventer.addEventListener('order', (e: Event) => {
            const order = (e as CustomEvent<Order>).detail;
            this.handleOrder(order);
        });

        Eventer.addEventListener('orderbook', (e: Event) => {
            const orders = (e as CustomEvent).detail;
            for (const order of orders)
                this.handleOrder(order);
        });
    }

    setupListeners() {
        const pos_exit_btn = document.getElementById('pos-exit-btn') as HTMLButtonElement;
        const tbody = this.container.querySelector('tbody') as HTMLTableSectionElement;

        pos_exit_btn.addEventListener('click', (event) => {
            event.stopPropagation();
            const checkboxes = tbody.querySelectorAll(`input[type="checkbox"]:checked`);

            checkboxes.forEach((cb: Element) => {
                const checkbox = cb as HTMLInputElement;
                const symbol = (checkbox.parentNode!.parentNode! as HTMLTableRowElement).title;
                const p = this.positions.get(symbol)!;
                const action = Math.sign(p.open.quantity) === 1 ? ORDERACTION.SELL : ORDERACTION.BUY;
                const quantity = Math.abs(p.open.quantity);
                this.parent.newOrderMulti(symbol, action, quantity);
                checkbox.checked = false;
            });
            pos_exit_btn.disabled = true;
            (document.getElementById('exit-all-cb') as HTMLInputElement).checked = false;
            this.parent.showOrderWindow();
        });

        const select_all_cb = document.getElementById('exit-all-cb') as HTMLInputElement;
        select_all_cb.addEventListener('change', (event) => {
            event.stopPropagation();
            const checkboxes = tbody.querySelectorAll(`input[type="checkbox"]:not(:disabled)`);
            checkboxes.forEach((cb: Element) => (cb as HTMLInputElement).checked = (event.target as HTMLInputElement).checked);
            pos_exit_btn.disabled = !(event.target as HTMLInputElement).checked;
        }, true);
    }

    handleOrder(order: Order) {
        const symbol = order.symbol;
        let position = this.positions.get(symbol);
        if (!position) {
            position = new Position(symbol, this.container, this.parent);
            this.positions.set(symbol, position);
        }

        position.handleOrder(order);
        this.updateTotals({});
    }

    updateTotals(options: any) {
        let booked = 0;
        let open = 0;
        Array.from(this.positions.values()).forEach((p: Position) => {
            let include = (!(options) || !options['checked'] || options['checked'] !== true) ||
                (options['checked'] === true && (p.row?.querySelector('#pos-exit-cb') as HTMLInputElement)?.checked);

            if (include) {
                booked += Number(p.value('realized_pl'));
                open += Number(p.value('unrealized_pl'));
            }
        });
        this.pl_fields_ref![0]!.textContent = booked.toFixed(2);
        this.pl_fields_ref![1]!.textContent = open.toFixed(2);
        this.pl_fields_ref![2]!.textContent = (booked + open).toFixed(2);
    }
}
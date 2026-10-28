import { UIApp } from "../app/ui.js";
import { Eventer } from "../services/eventservice.js";
import { RowFactory } from "../utils/factory.js";
import { ORDERSTATE, ORDERACTION, type Order } from "../utils/types.js";

export class OrderList {
    container: HTMLDivElement;
    parent: UIApp;
    orders: Order[];

    constructor(container: string, parent: UIApp) {
        this.container = document.getElementById(container) as HTMLDivElement;
        this.parent = parent;
        this.orders = [];
    }

    init() {
        const table = document.createElement('table');
        table.appendChild(this.header());
        const tbody = document.createElement("tbody");
        table.appendChild(tbody);

        this.container.appendChild(table);
        this.setupListenersEx();
    }

    header() {
        const thead = document.createElement("thead");
        const header_row = document.createElement("tr");
        header_row.style.display = 'flex';
        header_row.style.border = '0.5px solid var(--forecolor)';
        header_row.style.borderRadius = '5px';
        header_row.style.justifyContent = 'space-around';
        header_row.style.alignContent = 'space-around';
        header_row.style.gap = '10px';
        header_row.style.width = '100%';
        header_row.style.height = '48px'

        thead.appendChild(header_row);
        return thead;
    }

    setupListenersEx() {
        Eventer.addEventListener('orderbook', (e: Event) => {
            const orders = (e as CustomEvent).detail as Order[];
            this.listOrdersAll(orders);
        });
    }

    listOrders(symbol: string) {
        this.container.querySelector('tbody')!.innerHTML = '';
        this.orderRows(this.orders.filter((order: Order) => order.symbol === symbol), { symbol: true });
    }

    listOrdersAll(orders: Order[]) {
        const symbols = [...new Set(orders.map((order: Order) => {
            return order.symbol;
        }))];
        const header_row = this.container.querySelector('thead')?.querySelector('tr');
        header_row!.innerHTML = '';
        for (const s of symbols) {
            const btn = document.createElement('button');
            btn.innerText = Eventer.getScrip(s).name ?? '';
            btn.classList.add('barely-raised-btn');
            header_row!.appendChild(btn);
        }
        this.orders = orders;
        this.orderRows(orders);
    }

    orderRows(orders: Order[], options?: any) {

        const tbody = this.container.querySelector('tbody') as HTMLTableSectionElement;
        tbody.innerHTML = '';

        let tqty: number = 0;
        orders.forEach((order: Order) => {
            var new_row = RowFactory.build('orderdisplay') as HTMLTableRowElement;
            new_row.title = order.orderid;

            const cells = Array.from(new_row.children) as HTMLTableCellElement[];

            cells[0]!.textContent = Eventer.getScrip(order.symbol).name ?? '';
            cells[1]!.textContent = (order.executiontime) ? new Date(order.executiontime).toLocaleTimeString() : '';
            cells[2]!.textContent = order.action;
            cells[3]!.textContent = order.filled_q + '/' + order.quantity;
            cells[4]!.textContent = order.ordertype.slice(0, 1).toUpperCase();
            if (options?.symbol) {
                let qty: number = order.state.startsWith('complete') ? Number(order.filled_q) : 0;
                tqty += qty * (order.action === ORDERACTION.BUY ? 1 : -1);
            }
            cells[5]!.textContent = String(tqty);
            cells[6]!.textContent = (order.state === ORDERSTATE.OPENED ? order.price :
                order.state === ORDERSTATE.CANCELLED ? 0 : order.pricedAt)?.toFixed(2) ?? '';
            cells[7]!.textContent = order.state.slice(0, 1).toUpperCase();
            cells[8]!.textContent = order.state === ORDERSTATE.OPENED ? 'X' : '';

            this.container.querySelector('tbody')!.append(new_row);
        });
    }
}
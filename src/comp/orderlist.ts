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

        header_row.classList.add('order-list-header-row');
        thead.appendChild(header_row);
        return thead;
    }

    setupListener(header_row: HTMLTableRowElement) {
        const btns = header_row!.querySelectorAll('button');
        for (const btn of btns) {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const clicked = e.target as HTMLElement;
                this.filterOrders(clicked.innerText);
            }, true);
        }
    }

    setupListenersEx() {
        Eventer.addEventListener('orderbook', (e: Event) => {
            const orders = (e as CustomEvent).detail as Order[];
            this.listOrdersAll(orders);
        });
    }

    filterOrders(scrip: string) {
        let tqty = 0;
        this.container.querySelector('tbody')?.querySelectorAll('tr')?.forEach((row: HTMLTableRowElement) => {
            const display = ((row.cells[0] as HTMLTableCellElement).textContent === scrip || scrip === 'Reset') ? 'flex' : 'none';
            row.style.display = display;

            if (!(scrip === undefined || scrip === '' || scrip === 'Reset') && row.style.display === 'flex') {
                const qty: number = row.cells[7]?.textContent === 'C' ? Number(row.cells[3]?.textContent) : 0;
                tqty += qty * (row.cells[2]?.textContent === ORDERACTION.BUY ? 1 : -1);
                row.cells[5]!.textContent = String(tqty);
            }
            else {
                row.cells[5]!.textContent = '-';
            }
        });
    }

    selector(symbols: string[]) {
        const header_row = this.container.querySelector('thead')?.querySelector('tr');
        header_row!.innerHTML = '';

        const reset_btn = document.createElement('button');
        reset_btn.innerText = 'Reset';
        reset_btn.classList.add('barely-raised-btn');
        header_row!.appendChild(reset_btn);

        for (const s of symbols) {
            const btn = document.createElement('button');
            btn.innerText = Eventer.getScrip(s).name ?? '';
            btn.classList.add('barely-raised-btn');
            header_row!.appendChild(btn);
        }

        this.setupListener(header_row!);
    }

    listOrdersAll(orders: Order[]) {
        this.orders = orders;
        const symbols = [...new Set(orders.map((order: Order) => {
            return order.symbol;
        }))];
        if (symbols.length > 1)
            this.selector(symbols);
        this.orderRows(orders);
    }

    orderRows(orders: Order[], options?: any) {

        const tbody = this.container.querySelector('tbody') as HTMLTableSectionElement;
        tbody.innerHTML = '';

        orders.forEach((order: Order) => {
            const new_row = this.createRow();
            new_row.title = order.orderid;

            const cells = Array.from(new_row.children) as HTMLTableCellElement[];
            cells[0]!.textContent = Eventer.getScrip(order.symbol).name ?? '';
            const time = order.executiontime ?? order.submittime;
            cells[1]!.textContent = (time) ? new Date(time).toLocaleTimeString() : '-';
            cells[2]!.textContent = order.action;
            cells[3]!.textContent = String(order.filled_q); // + '/' + order.quantity;
            cells[4]!.textContent = order.ordertype.slice(0, 1).toUpperCase();
            cells[6]!.textContent = (order.state === ORDERSTATE.OPENED ? order.price :
                order.state === ORDERSTATE.CANCELLED ? 0 : order.pricedAt)?.toFixed(2) ?? '';
            cells[7]!.textContent = order.state.slice(0, 1).toUpperCase();
            if (order.state === ORDERSTATE.OPENED)
                this.cancelDialog(cells[8] as HTMLTableCellElement);

            this.container.querySelector('tbody')!.append(new_row);
        });
    }

    createRow() {
        var new_row = RowFactory.build('orderdisplay') as HTMLTableRowElement;
        new_row.addEventListener('click', (e) => {
            e.stopPropagation();
            const clicked = e.target as HTMLElement;
            const parent = e.currentTarget as HTMLTableRowElement;
            if (clicked !== new_row)
                this.handleRowClick(clicked, parent);
        }, true);
        return new_row;
    }

    cancelDialog(cell: HTMLTableCellElement): void {
        cell.style.position = 'relative';
        const label = document.createElement('label') as HTMLLabelElement;
        label.id = 'orderlist-check-cancel';
        label.innerText = 'X';
        label.classList.add('clickable');
        cell.appendChild(label);

        const panel = document.createElement('div');
        panel.classList.add('floating-pane');

        const confirm_cancel_btn = document.createElement('button') as HTMLButtonElement;
        confirm_cancel_btn.innerText = 'Confirm';
        confirm_cancel_btn.id = 'orderlist-confirm-cancel';
        panel.appendChild(confirm_cancel_btn);

        const drop_cancel_btn = document.createElement('button') as HTMLButtonElement;
        drop_cancel_btn.innerText = 'Cancel';
        drop_cancel_btn.id = 'orderlist-drop-cancel';
        panel.appendChild(drop_cancel_btn);

        cell.appendChild(panel);
    }

    handleRowClick(clicked: HTMLElement, parent: HTMLTableRowElement) {
        if (clicked?.id === 'orderlist-check-cancel')
            (parent.querySelector('div') as HTMLDivElement).style.display = 'flex';
        else if (clicked?.id === 'orderlist-confirm-cancel')
            this.parent.cancelOrder(parent.title)
        else if (clicked?.id === 'orderlist-drop-cancel')
            (parent.querySelector('div') as HTMLDivElement).style.display = 'none';
    }
}
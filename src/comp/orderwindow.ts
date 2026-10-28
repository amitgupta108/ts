import type { UIApp } from "../app/ui.js";
import { ORDERACTION, ORDERTYPE, type Order, type Quote } from "../utils/types.js";
import { RowFactory } from "../utils/factory.js";
import { Eventer } from "../services/eventservice.js";
import { order_template } from "../utils/constants.js";
import { Floater } from "./html/floater.js";

//const sound_order_submit = new Audio("../assets/order_submit.wav");

export class OrderWindow extends Floater {
    parent: UIApp;
    inprocess_orders: Order[] = [];
    err_validate: boolean = false;

    constructor(id: string, parent: UIApp) {
        super(id);
        this.parent = parent;
    }

    init() {
        this.p_init();

        const table = document.createElement("table");
        table.id = 'order-window-table';
        const tbody = document.createElement("tbody");
        tbody.id = 'order-window-tbody';

        table.appendChild(tbody);
        table.appendChild(this.footer());
        this.self.appendChild(table);

        this.setupListners();
        this.setupListenersEx();
    }

    footer() {
        const tfoot = document.createElement("tfoot");
        tfoot.classList.add('ow-action-panel')

        const btn_cancel = document.createElement('button');
        btn_cancel.textContent = "Cancel";
        btn_cancel.id = "ow-cancel-btn";

        const btn_validate = document.createElement('button');
        btn_validate.textContent = "Validate";
        btn_validate.id = "ow-validate-btn";

        const btn_submit = document.createElement('button');
        btn_submit.textContent = "Submit";
        btn_submit.id = "ow-submit-btn";

        tfoot.appendChild(btn_cancel);
        tfoot.appendChild(btn_validate);
        tfoot.appendChild(btn_submit);
        return tfoot;
    }

    setupListners() {
        (this.self.querySelector('#ow-submit-btn') as HTMLButtonElement).addEventListener('click', (e) => {
            e.stopPropagation();
            this.submitOrder();
        });

        (this.self.querySelector('#ow-validate-btn') as HTMLButtonElement).addEventListener('click', (e) => {
            e.stopPropagation();
            this.validateOrder();
        });

        (this.self.querySelector('#ow-cancel-btn') as HTMLButtonElement).addEventListener('click', (e) => {
            e.stopPropagation();
            this.hide();
        });
    }

    setupListenersEx() {
        Eventer.addEventListener("quote", (e: Event) => {
            if (this.self.checkVisibility() === false)
                return;

            const q = (e as CustomEvent).detail as Quote;
            this.handleQuote(q);
        });
    }

    createRow() {
        const row = RowFactory.create(RowFactory.templates.orderwindow) as HTMLTableRowElement;
        row.addEventListener('click', (e) => {
            e.stopPropagation();
            if (e.target !== row)
                this.handleRowClick(e);
        }, true);
        row.addEventListener('change', (e) => {
            e.stopPropagation();
            if (e.target !== row)
                this.handleRowChange(e);
        }, true);
        row.addEventListener('input', (e) => {
            e.stopPropagation();
            if (e.target !== row)
                (this.self.querySelector('#ow-submit-btn') as HTMLButtonElement).disabled = true;
        }, true);
        return row;
    }

    handleRowClick(e: Event) {
        const clicked = e.target as HTMLElement;
        const parent = e.currentTarget as HTMLTableRowElement;

        if (clicked.id === 'ow-order-type')
            this.flipOrderType(clicked, parent);
        else if (clicked.id === 'ow-action-btn')
            this.flipOrderAction(clicked as HTMLButtonElement, parent);
        else if (clicked.id === 'ow-row-rm-btn')
            parent.remove();
    }

    handleRowChange(e: Event) {
        const clicked = e.target as HTMLElement;
        const parent = e.currentTarget as HTMLTableRowElement;

        if (clicked.id === 'ow-order-type')
            this.flipOrderType(clicked, parent);
        else if (clicked.id === 'ow-action-btn')
            this.flipOrderAction(clicked as HTMLButtonElement, parent);
    }

    handleQuote(q: Quote) {
        const rows = this.getOrderRows();
        if (rows.length === 0)
            return;

        rows.forEach((r) => {
            if (q.symbol === r.title) {
                r.querySelector("#ow-price")!.textContent = q.ltp.toFixed(2);

                const lmt_price_tb = r.querySelector('#ow-lmtp-input') as HTMLInputElement;
                const price_type_lb = r.querySelector('#ow-order-type') as HTMLElement;
                if (lmt_price_tb.value === '' && price_type_lb.innerText === ORDERTYPE.LIMIT)
                    lmt_price_tb.value = q.ltp.toFixed(2);
            }
        });
    }

    flipOrderType(clicked: HTMLElement, parent: HTMLTableRowElement) {
        clicked.textContent = (clicked.textContent === ORDERTYPE.LIMIT ? ORDERTYPE.MARKET : ORDERTYPE.LIMIT);
        const limitp = parent.querySelector('#ow-lmtp-input') as HTMLInputElement;
        limitp.disabled = (clicked.textContent === ORDERTYPE.MARKET);
        if (clicked.textContent === ORDERTYPE.MARKET)
            limitp.value = "";
    }

    flipOrderAction(clicked: HTMLButtonElement, orderRow: HTMLTableRowElement) {
        this.flipCSS(clicked, orderRow.querySelector('select') as HTMLSelectElement);
    }

    flipCSS(action_btn: HTMLButtonElement, selectbox: HTMLSelectElement) {
        var action = action_btn.innerText;
        action_btn.innerText = action === 'B' ? 'S' : 'B';
        if (action === 'B') {
            action_btn.classList.replace('buy', 'sell');
            selectbox.classList.replace('buy', 'sell');
        }
        else {
            action_btn.classList.replace('sell', 'buy');
            selectbox.classList.replace('sell', 'buy');
        }
    }

    getOrderRows() {
        return Array.from(this.self.querySelector('tbody')!.rows);
    }

    newOrder(symbol: string, action: ORDERACTION) {
        const rows = this.getOrderRows();
        if (rows.length === 1 && !this.parent.isBasketEnabled())
            rows[0]?.remove();
        else
            rows.find((r) => {
                return r.title === symbol;
            })?.remove();

        this.createOrder(symbol, action);
        this.show();
    }

    getOrderTemplate(symbol: string, action: ORDERACTION) {
        const order = structuredClone(order_template);
        order.appid = this.parent.getAppProfile('appid') as string;
        order.stockCode = this.parent.getAppProfile('stockCode') as string;
        order.ordertype = ORDERTYPE.MARKET
        order.symbol = symbol;
        order.action = action;

        return order;
    }

    createOrder(symbol: string, action: ORDERACTION, quantity = 1) {
        const row = this.createRow()
        row.title = symbol;
        row.querySelector('#ow-scrip')!.textContent = Eventer.getScrip(symbol)?.name ?? '';

        const action_btn = row.querySelector('#ow-action-btn') as HTMLButtonElement;
        action_btn.innerText = action === ORDERACTION.BUY ? 'B' : 'S';
        action_btn.classList.add(action === ORDERACTION.BUY ? 'buy' : 'sell');

        const lot_select = row.querySelector('#ow-lot-select') as HTMLSelectElement;
        lot_select.value = quantity.toString();
        lot_select.classList.add(action === ORDERACTION.BUY ? 'buy' : 'sell');

        if (!(this.parent.isBasketEnabled() && this.getOrderRows().length === 1)) {
            row.querySelector('.ow-row-hover')!.remove();
        }
        this.self.querySelector('tbody')!.prepend(row);
    }

    show(): void {
        this.parent.disableBasketToggle(true);
        this.self.style.display = 'block';
    }

    hide(): void {
        this.self.style.display = 'none';
        (this.self.querySelector('#ow-submit-btn') as HTMLButtonElement).disabled = true;
        this.self.querySelector('tbody')!.innerHTML = "";
        this.parent.disableBasketToggle(false);
        this.inprocess_orders = [];
        this.err_validate = false;
    }

    validateOrder() {
        const rows = this.getOrderRows();

        this.inprocess_orders = rows.map((r) => {
            const symbol = r.title;
            const action_btn = r.querySelector('#ow-action-btn') as HTMLButtonElement;
            const action = action_btn.innerText as ORDERACTION;
            const order = this.getOrderTemplate(symbol, action);

            const selectbox = r.querySelector('#ow-lot-select') as HTMLSelectElement;
            order.quantity = Number(selectbox.value);
            const pricetype = r.querySelector('#ow-order-type') as HTMLElement;
            order.ordertype = pricetype.innerText as ORDERTYPE;
            order.pricetype = order.ordertype;

            if (!(symbol?.length > 1) || !(action?.length > 0) || !(order.quantity > 0)) {
                r.style.border = "1px solid red";
                this.err_validate = true;
            }

            const lmtp_display = r.querySelector('#ow-lmtp-input') as HTMLInputElement;
            if (order.pricetype === ORDERTYPE.LIMIT) {
                if (lmtp_display.value === '') {
                    lmtp_display.style.border = '1px solid red';
                    this.err_validate = true;
                }
                else
                    order.price = Number(lmtp_display.value);
            }
            return order;
        });
        (this.self.querySelector('#ow-submit-btn') as HTMLButtonElement).disabled = this.err_validate;
    }

    submitOrder() {
        if (!this.err_validate) {
            this.parent.submitOrders(this.inprocess_orders);

            //sound_order_submit.play();
            this.hide();
        }
    }
}
import type { BookedPosition, OpenPosition, Order, Quote } from "../utils/types.js";
import { ORDERACTION, ORDERSTATE } from "../utils/types.js";
import { RowFactory } from "../utils/factory.js";
import { UIApp } from "../app/ui.js";
import { Eventer } from "../services/eventservice.js";

const decimal2 = ['realized_pl', 'avg_price', 'ltp', 'unrealized_pl', 'total_pl'];

export class Position {
    symbol: string;
    uiApp: UIApp;
    container: HTMLDivElement;
    booked: BookedPosition = { buyv: 0, sellv: 0, quantity: 0 };
    open: OpenPosition = { quantity: 0, pnl: 0, avgprice: 0 };
    state: string = "initial";
    orders: Map<string, Order> = new Map<string, Order>();
    row?: HTMLTableRowElement;

    row_fields = {
        scrip: 1, booked_qty: 3, realized_pl: 4, avg_price: 5,
        ltp: 6, open_qty: 7, unrealized_pl: 8, total_pl: 9
    } as { [key: string]: number };

    constructor(symbol: string, container: HTMLDivElement, uiApp: UIApp) {
        this.symbol = symbol;
        this.container = container;
        this.uiApp = uiApp;
        this.init();
    }

    init() {
        this.row = RowFactory.create(RowFactory.templates.position) as HTMLTableRowElement;
        this.row.title = this.symbol;
        this.value('scrip', Eventer.getScrip(this.symbol).name);
        this.container.querySelector('tbody')!.append(this.row);
        this.setupListeners();
    }

    setupListeners() {
        this.row!.addEventListener('change', (e) => {
            e.stopPropagation();
            if ((e.target as HTMLInputElement).id === 'pos-exit-cb') {
                const checkboxes = this.container.querySelectorAll('#pos-exit-cb');
                const checkedIdx = Array.from(checkboxes)
                    .map((cb, i) => (cb as HTMLInputElement).checked ? i : null)
                    .filter(val => val !== null);

                (document.getElementById('pos-exit-btn') as HTMLButtonElement).disabled = checkedIdx.length === 0;
                (document.getElementById('exit-all-cb') as HTMLInputElement).checked = checkedIdx.length === checkboxes.length;
            }
        }, true);

        this.row!.addEventListener('click', (e) => {
            e.stopPropagation();
            if ((e.target as HTMLButtonElement).id === 'order-display-btn') {
                this.uiApp.filterOrders(this.value('scrip')!);
            }
        }, true);

    }

    value(p: string, v: number | string | undefined = undefined): string | undefined {
        const idx = (this.row_fields as any)[p];

        const cell = this.row!.cells[idx] as HTMLElement;
        if (v != undefined)
            cell.textContent = (decimal2.includes(p) ? Number(v).toFixed(2) : String(v));

        return String(cell.textContent);
    }

    handleOrder(order: Order) {
        this.orders.set(order.orderid, order);
        if (order.state === ORDERSTATE.OPENED)
            this.openOrder('create');
        else
            this.executedOrder(order);

        (this.row?.querySelector('#pos-exit-cb') as HTMLInputElement).disabled = this.open.quantity === 0;
    }

    openOrder(action: 'create' | 'close') {
        const opencount = Array.from(this.orders.values()).filter((o) => o.state === ORDERSTATE.OPENED).length;
        const label = this.row!.querySelector('#order-display-btn') as HTMLButtonElement;
        label!.innerText = (opencount === 0 ? 'N' : String(opencount));
        label!.style.backgroundColor = (opencount === 0 ? 'white' : 'skyblue');
    }

    executedOrder(order: Order) {
        this.openOrder('close');
        this.value('ltp', order.pricedAt!);
        this.calculatePL();

        this.value('booked_qty', this.booked.quantity);
        this.value('realized_pl', this.booked.sellv - this.booked.buyv);
        this.value('avg_price', this.open.avgprice ?? order.pricedAt!);
        this.value('open_qty', this.open.quantity);
        this.value('unrealized_pl', (Number(this.value('avg_price')!) - order.pricedAt!) * this.open.quantity);
        this.value('total_pl', Number(this.value('unrealized_pl')) + Number(this.value('realized_pl')));

        (this.row!.querySelector('#pos-exit-cb') as HTMLInputElement).disabled = this.open.quantity === 0;
    }

    calculatePL() {
        let buyv = 0; let sellv = 0;
        let buyq = 0; let sellq = 0;

        const completed = Array.from(this.orders.values()).filter((o) => {
            return o.state === ORDERSTATE.COMPLETED;
        });

        for (const order of completed) {
            if (order.action === ORDERACTION.BUY) {
                buyq += order.filled_q!;
                buyv += order.filled_q! * order.pricedAt!;
            } else {
                sellq += order.filled_q!;
                sellv += order.filled_q! * order.pricedAt!;
            }

            const squared: boolean = (sellq === buyq);
            this.booked.quantity = Math.min(sellq, buyq);
            this.open.quantity = buyq - sellq;

            if (squared) {
                this.booked.buyv = buyv;
                this.booked.sellv = sellv;

                this.open.pnl = 0;
                this.open.avgprice = 0;
            }
            this.open.avgprice = this.open.quantity > 0 ? buyv / buyq : sellv / sellq;
            this.open.pnl = this.open.quantity * (this.open.avgprice - order.pricedAt!);
        }
    }

    onQuote(q: Quote) {
        this.value('ltp', q.ltp);
        this.value('unrealized_pl', (Number(this.value('ltp')!) - Number(this.value('avg_price')!)) * this.open.quantity);
        this.value('total_pl', (Number(this.value('unrealized_pl')) + Number(this.value('realized_pl'))));
    }
    /*
        executedOrder(order: Order) {
            this.openOrder('close');
    
            if (this.open.quantity !== 0 && Math.sign(this.open.quantity) !== (order.action === ORDERACTION.BUY ? 1 : -1)) {
                this.reducePosition(order);
            }
            this.increasePosition(order);
            this.value('ltp', order.pricedAt!);
        }
    
        reducePosition(order: Order) {
            if (order.action === ORDERACTION.BUY) {
                this.booked.buyv += order.filled_q! * order.pricedAt!;
            } else {
                this.booked.sellv += order.filled_q! * order.pricedAt!;
            }
            this.booked.quantity += order.filled_q!;
    
            this.value('booked_qty', this.booked.quantity);
            this.value('realized_pl', this.booked.sellv - this.booked.buyv);
        }
    
        increasePosition(order: Order) {
            const buysell = order.action === ORDERACTION.BUY ? 1 : -1;
            this.open.quantity += order.filled_q! * buysell;
            this.open.value += order.filled_q! * order.pricedAt! * buysell;
            this.open.avgprice = this.open.quantity !== 0 ? this.open.value / this.open.quantity : 0;
    
            this.value('avg_price', this.open.avgprice ?? order.pricedAt!);
            this.value('open_qty', this.open.quantity);
            this.value('unrealized_pl', (Number(this.value('avg_price')!) - order.pricedAt!) * this.open.quantity);
            this.value('total_pl', Number(this.value('unrealized_pl')) + Number(this.value('realized_pl')));
            (this.row!.querySelector('#pos-exit-cb') as HTMLInputElement).disabled = this.open.quantity === 0;
        }
    */
}
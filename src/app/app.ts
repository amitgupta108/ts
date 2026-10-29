import { ServerInterface } from '../services/serverinterface.js';
import type { AppProfile, HistoryRequest, Order } from '../utils/types.js';
import { UIApp } from './ui.js'
import { host } from '../utils/constants.js';

export class TPWebApp {

    private serverRef: ServerInterface;
    profile?: AppProfile;
    uiApp: UIApp;

    constructor() {
        this.uiApp = new UIApp(this);
        this.serverRef = new ServerInterface(this.uiApp);
    }

    connect(profile: AppProfile): void {
        try {
            this.profile = profile;
            const isConnected = this.serverRef.connect(host, profile);

            this.uiApp.init(profile, isConnected);
        } catch (error) {
            console.error(error);
        }
    }

    history(requests: HistoryRequest[]) {
        if (!this.profile) {
            console.error("No profile found, cannot start session");
            return;
        }
        this.serverRef?.history(requests);
    }

    start() {
        if (!this.profile) {
            console.error("No profile found, cannot start session");
            return;
        }
        this.serverRef?.start();
    }

    submitOrders(orders: Order[]) {
        this.serverRef?.submitOrders(orders);
    }

    orderbook() {
        this.serverRef?.orderbook();
    }

    cancelOrder(orderid: string) {
        this.serverRef?.cancelOrder(orderid);
    }

    exit() {
        this.serverRef.exit();
    }
}
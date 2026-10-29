import { Eventer } from '../services/eventservice.js'
import type { AppProfile } from '../utils/types';
import { UIApp } from '../app/ui.js';

export class NavBar {
    private parent: UIApp;
    private self: HTMLDivElement;
    private btns: HTMLButtonElement[] = [];
    private labels: HTMLLabelElement[] = [];
    private profile?: AppProfile;

    constructor(id: string, parent: UIApp) {
        this.parent = parent;
        this.self = document.getElementById(id) as HTMLDivElement;
        const appHeading = document.createElement('h2');
        appHeading.textContent = "Trading App";
        this.self.appendChild(appHeading);
        this.scaffold();
    }

    scaffold() {
        const btn_set_1_div = document.createElement('div');
        btn_set_1_div.classList.add('navbar-btn-set');

        const html_btn_set_1 = this.itemSet(
            [{ key: 'connect', type: 'button', text: 'Connect' },
            { key: 'start', type: 'button', text: 'Start' }]
        );
        btn_set_1_div.append(...html_btn_set_1);
        this.self.appendChild(btn_set_1_div);

        const btn_set_2_div = document.createElement('div');
        btn_set_2_div.classList.add('navbar-btn-set');

        const html_btn_set_2 = this.itemSet(
            [{ key: 'golive', type: 'button', text: 'Go Live' },
            { key: 'disconnect', type: 'button', text: 'Disconnect' }]
        );
        btn_set_2_div.append(...html_btn_set_2);
        this.self.appendChild(btn_set_2_div);

        const ticker = document.createElement('div');
        ticker.classList.add('ticker');
        ticker.append(...this.itemSet([
            { key: 'stock', type: 'label', text: '' },
            { key: 'mode', type: 'label', text: '' },
            { key: 'date', type: 'label', text: '' },
            { key: 'time', type: 'label', text: '' },
            { key: 'futures', type: 'label', text: 'Futures' },
            { key: 'spot', type: 'label', text: 'Spot' },
            { key: 'latency', type: 'label', text: 'Latency' },
            { key: 'sconnect', type: 'label', text: '@' }
        ]));
        this.self.appendChild(ticker);

        const exit_btn = document.createElement('button');
        exit_btn.id = 'navbar-exit-btn';
        exit_btn.classList.add('navbar-btn');
        exit_btn.innerText = 'Exit';
        exit_btn.addEventListener('click', (e) => this.onClick(e, exit_btn));
        this.self.appendChild(exit_btn);

        this.btns = Array.from(this.self.getElementsByTagName('button'));
        this.labels = Array.from(ticker.getElementsByTagName('label'));
    }

    itemSet(controls: { key: string, type: string, text: string }[]): HTMLElement[] {
        const item_set: Array<HTMLElement> = [];

        for (const control of controls) {
            const item = document.createElement(control.type);
            if (control.type === 'label') {
                item.id = `navbar-${control.key}-key-lbl`;
                item.classList.add('navbar-lbl');
                item.innerText = control.text + ': ';
                if (control.text !== '')
                    item_set.push(item);

                const value = document.createElement('label');
                value.id = `navbar-${control.key}-lbl`;
                value.classList.add('navbar-lbl');
                value.innerText = '';
                value.style.width = '90px'
                if (control.text !== '@')
                    item_set.push(value);
            } else {
                item.innerText = control.text;
                item.id = `navbar-${control.key}-btn`;
                item.classList.add('navbar-btn');
                item.addEventListener('click', (e) => this.onClick(e, item as HTMLButtonElement));
                item_set.push(item);
            }
        }
        return item_set;
    }

    init(profile: AppProfile) {
        this.profile = profile;

        this.labels.find(x => x.id === 'navbar-stock-lbl')!.textContent = profile.stockCode;
        this.labels.find(x => x.id === 'navbar-date-lbl')!.textContent = new Date(profile.simStartTime).toLocaleDateString()

        const label = this.labels.find(x => x.id === 'navbar-mode-lbl')!;
        if (profile.mode === 'HISTORY') {
            label.innerText = "HISTORY"
            label.style.color = "#50a2e6ff";
        }
        else if (profile.mode.includes('TS')) {
            label.innerText = "SIM"
            label.style.color = "#538a47ff"
        }
        else {
            label.innerText = 'LIVE';
        }
        this.setupListenersEx();
    }

    setupListenersEx() {
        Eventer.addEventListener('heartbeat', (state: any) => {
            const label: HTMLLabelElement = this.labels.find(x => x.id === 'navbar-sconnect-key-lbl')!;
            label.style.color = state?.detail?.connected ? "#4CAF50" : "#f44336";
        });
        Eventer.addEventListener('isConnected', (state: any) => {
            this.connected(state?.detail?.connected);
        });
        Eventer.addEventListener('quote', (data: any) => {
            const q = data.detail;
            if (q.key === 'index') {
                this.labels[7]!.textContent = q.ltp.toFixed(2);
            }
            else if (q.key === 'futures') {
                this.labels[5]!.textContent = q.ltp.toFixed(2);
                this.labels[3]!.textContent = new Date(q.ltt).toLocaleTimeString();
            }
        });
        Eventer.addEventListener('latency', (data: any) => {
            this.labels[9]!.textContent = String(data.detail);
        });
    }

    onClick(e: Event, btn: HTMLButtonElement) {
        if (btn.id === "navbar-connect-btn") {
            this.onClickConnect();
        } else if (btn.id === "navbar-start-btn") {
            this.onClickStart();
        } else if (btn.id === "navbar-exit-btn") {
            this.onClickExit();
        }
    }

    onClickConnect() {
        this.parent.connect();
    }

    onClickStart() {
        this.parent.start();
    }

    onClickExit() {
        this.parent.exit();
    }

    enableButton(name: string) {
        this.btns.find(x => x.id == name)!.disabled = false;
    }

    disableButton(name: string) {
        this.btns.find(x => x.id == name)!.disabled = true;
    }

    connected(flag: boolean) {
        const btn = this.btns.find(x => x.id == 'navbar-connect-btn')!;
        btn.disabled = flag;
    }
}
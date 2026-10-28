import { Eventer } from '../services/eventservice.js'
import type { AppProfile } from '../utils/types';
import { UIApp } from '../app/ui.js';

export class NavBar {
    private parent: UIApp;
    private self: HTMLDivElement;
    private btns: HTMLButtonElement[];
    private profile?: AppProfile;

    constructor(id: string, parent: UIApp) {
        this.parent = parent;
        this.self = document.getElementById(id) as HTMLDivElement;
        this.btns = Array.from(this.self.querySelectorAll('button'));
        this.btns.forEach((btn) => {
            btn.addEventListener('click', () => this.onClick(btn));
        });
    }

    init(profile: AppProfile) {
        this.profile = profile;

        const btn = this.btns.find(x => x.id == 'mode-btn')!;
        if (profile.mode === 'HISTORY') {
            btn.innerText = "HISTORY"
            btn.style.backgroundColor = "#50a2e6ff"
            btn.style.color = "white"
        }
        else if (profile.mode.includes('TS')) {
            btn.innerText = "SIM"
            btn.style.backgroundColor = "#538a47ff"
            btn.style.color = "white"
        }
        this.setupListenersEx();
    }

    setupListenersEx() {
        Eventer.addEventListener('heartbeat', (state: any) => {
            const btn: HTMLButtonElement = this.btns.find(x => x.id === 'order-socket-state')!;
            btn.style.color = state?.connected ? "#4CAF50" : "#f44336";
        });
    }

    onClick(btn: HTMLButtonElement) {
        if (btn.id === "btn-connect") {
            this.onClickConnect();
        } else if (btn.id === "start-btn") {
            this.onClickStart();
        } else if (btn.id === "exit-btn") {
            this.onClickExit();
        }
    }

    onClickConnect() {
        //dispatchEvent(new CustomEvent('connect'));

    }

    onClickStart() {
        this.parent.loadPrimaryChart();
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

    isBasketEnabled(): boolean {
        return (document.getElementById('basket-toggle') as HTMLInputElement).checked;
    }

    disableBasketToggle(flag: boolean) {
        (document.getElementById('basket-toggle') as HTMLInputElement).disabled = flag;
    }
}
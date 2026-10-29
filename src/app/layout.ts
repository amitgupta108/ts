import { Resizer } from '../comp/html/resizer.js';
import { UIApp } from './ui.js'
import { TradeButtons } from '../custom/tradebuttons.js';
import { TabGroup } from "../comp/html/tabgroup.js";
import type { AppProfile } from '../utils/types.js';
import { tg_1_id, tg_2_id, tg_3_id } from '../utils/constants.js';
export class Layout {

    parent: UIApp;
    profile?: AppProfile;

    hlResizer: Resizer;
    hrResizer: Resizer;
    vResizer: Resizer;

    chart_group: TabGroup;
    oc_group: TabGroup;
    positions_group: TabGroup;

    //orderwindow: Floater;
    constructor(parent: UIApp) {
        this.parent = parent;
        this.hlResizer = new Resizer('h', 'h-resizer-left');
        this.hrResizer = new Resizer('h', 'h-resizer-right');
        this.vResizer = new Resizer('v', 'v-resizer');

        this.chart_group = new TabGroup(tg_1_id, 'left-bottom-pane', this.parent);
        this.oc_group = new TabGroup(tg_2_id, 'right-top-pane', this.parent);
        this.positions_group = new TabGroup(tg_3_id, 'right-bottom-pane', this.parent);

        customElements.define('trade-buttons', TradeButtons);
    }

    init(profile: AppProfile) {

        this.profile = profile;
        this.hlResizer.render('left-top-pane', 'left-bottom-pane', 0.06);
        this.hrResizer.render('right-top-pane', 'right-bottom-pane', 0.5);
        this.vResizer.render('left-container', 'right-container', 0.6);

        this.chart_group.render(["Chart1", "Chart2"]);
        this.oc_group.render(this.profile.oExpiries);
        this.oc_group.createBasketToggle();
        this.positions_group.render(["Positions", "Orderbook", "NetPosition"]);
    }

    getChartGroup(): TabGroup {
        return this.chart_group;
    }

    getOCGroup(): TabGroup {
        return this.oc_group;
    }

    getPositionsGroup(): TabGroup {
        return this.positions_group;
    }
}
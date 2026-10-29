import type { UIApp } from "../../app/ui";

export class TabGroup extends EventTarget {
	private self: HTMLDivElement;
	private label_group: HTMLDivElement;
	private labels!: string[];
	private parent: UIApp;

	listener = (e: MouseEvent) => {
		e.stopPropagation();
		const target = e.target as HTMLDivElement;
		this.switchTabs(target.textContent as string);
	};

	constructor(id: string, container: string, parent: UIApp) {
		super();
		this.parent = parent;

		this.self = document.createElement("div");
		this.self.id = id;
		this.self.className = "content-box";
		document.getElementById(container)!.appendChild(this.self);
		this.label_group = document.createElement("div");
		this.label_group.className = "tabs";
		this.self.appendChild(this.label_group);
	}

	options(): void {
		const action_tab = document.createElement('div');

		action_tab.classList.add('action-tab');
		for (let i = 0; i < 2; i++) {
			const btn = document.createElement('button');
			btn.addEventListener('click', (e: MouseEvent) => {
				e.stopPropagation();
				this.postEvent(e);
			});
			btn.textContent = i === 0 ? 'C' : '>';
			btn.classList.add('smallbutton');
			btn.classList.add('order');
			action_tab.appendChild(btn);
		}
		this.label_group.appendChild(action_tab);
	}

	createBasketToggle(): void {
		let toggle = document.createElement('input');
		toggle.type = 'checkbox';
		toggle.id = 'basket-toggle';

		let span = document.createElement('span');
		span.classList.add('slider');
		span.classList.add('round');

		const label = document.createElement('label');
		label.classList.add('switch');
		label.append(toggle, span);

		this.label_group.querySelector('.action-tab')!.prepend(label);
	}

	render(names: string[]): HTMLDivElement {
		this.labels = names;
		const len = names.length;

		for (var i = 0; i < len; i++) {
			const label_pane = document.createElement("div") as HTMLDivElement;
			label_pane.id = `${this.self.id}_${names[i]}`;
			label_pane.textContent = names[i]!;
			label_pane.classList.add("tab");
			label_pane.addEventListener('click', (e) => this.listener(e));

			const content_pane = document.createElement("div") as HTMLDivElement;
			content_pane.id = `${this.self.id}_${names[i]}_content`;
			content_pane.classList.add("tab-content");

			if (i === 0) {
				label_pane.classList.add("active-label");
				content_pane.classList.add("active-content");
			}
			this.label_group.appendChild(label_pane);
			this.self.appendChild(content_pane);
		}
		this.options();
		return this.self;
	}

	add(name: string, div: HTMLDivElement): void {
		const pane = this.getContentPane(name);
		if (pane)
			pane.appendChild(div);
	}

	getContentPane(name: string): HTMLDivElement | null {
		return document.getElementById(`${this.self.id}_${name}_content`) as HTMLDivElement | null;
	}

	getActiveContentPane(): HTMLDivElement {
		const c = this.self.querySelector('.active-content') as HTMLDivElement;
		if (c)
			return c;

		throw new Error(`No active content pane found in ${this.self.id}`);
	}

	getActiveTabLabel(): string {
		const tab = this.self.querySelector('.active-label') as HTMLDivElement;
		if (tab)
			return tab.textContent as string;

		throw new Error(`No active tab label found in ${this.self.id}`);
	}

	getContentPaneforTab(label: string): HTMLDivElement {
		const c = this.self.querySelector(`#${this.self.id}_${label}_content`) as HTMLDivElement;
		if (c)
			return c;

		throw new Error(`No content pane found for tab ${label}`);
	}

	getLabel(index: number): string | null {
		return this.labels[index] || null;
	}

	getTabByLabel(label: string) {
		return this.self.querySelector(`#${this.self.id}_${label}`);
	}

	switchTabs(name: string) {
		const tabs = this.label_group.children;
		const panes = this.self.querySelectorAll('div[id$="_content"]');

		for (var i = 0; i < tabs.length - 1; i++) {
			(tabs[i] as HTMLElement).classList.remove("active-label");
			(panes[i] as HTMLElement).classList.remove("active-content");
		}

		this.getContentPaneforTab(name).classList.add('active-content');
		(this.getTabByLabel(name) as HTMLElement).classList.add('active-label');
	}

	isBasketEnabled(): boolean {
		return (this.self.querySelector('#basket-toggle') as HTMLInputElement).checked;
	}

	disableBasketToggle(flag: boolean) {
		(this.self.querySelector('#basket-toggle') as HTMLInputElement).disabled = flag;
	}

	postEvent(event: Event) {
		this.parent.notifyEvent(event, this.self.id);
	}
}
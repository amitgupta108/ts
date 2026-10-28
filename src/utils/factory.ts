export class RowFactory {
	static templates = {
		optionchain: document.getElementById("option-chain-row") as HTMLTemplateElement,
		orderwindow: document.getElementById("order-window-row") as HTMLTemplateElement,
		orderdisplay: document.getElementById("order-display-row") as HTMLTemplateElement,
		position: document.getElementById("position-row") as HTMLTemplateElement,
	};

	static row_fields = {
		orderdisplay: {
			Scrip: 20, Time: 20, Action: 5, O_Qty: 14, Type: 5,
			P_Qty: 14, Price: 14, Status: 5, Exit: 5
		}
	};

	static create(template: HTMLTemplateElement): HTMLTableRowElement {
		return document.importNode(template.content, true).querySelector('tr')!;
	}

	static build(rowtype: string) {
		const row = document.createElement('tr');
		const field = this.row_fields[rowtype as keyof typeof this.row_fields];
		for (const [label, width] of Object.entries(field)) {
			const cell = document.createElement('td');
			cell.id = label.toLowerCase() + "-td";
			cell.style.width = width + "%";
			row.appendChild(cell);
		}
		return row;
	}
}

export class TradeButtons extends HTMLElement {

    constructor(private symbol: string) {
        super();
    }

    connectedCallback() {
        this.innerHTML = `
		<div class="hover-content">
			<button  id="div_trans_btn" class="smallbutton buy">B</button>
			<button  id="row_attn_btn" class="smallbutton order">!</button>
			<button  id="div_trans_btn" class="smallbutton sell">S</button> 
		</div>    
	`;
    }
}
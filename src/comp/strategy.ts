import type { ChartRequest, Quote } from "../utils/types.js";

export class Strategy {

	name: string;
	names: string[] = ['straddle', 'strangle'];
	operands?: Int32Array;
	symbols?: { [key: string]: number };
	impl?: Function;

	strategy_strangle_fn = {
		fn_2: () => this.operands![0]! + this.operands![1]! | 0,
		fn_3: () => this.operands![0]! + this.operands![1]! + this.operands![2]! | 0,
		fn_4: () => this.operands![0]! + this.operands![1]! + this.operands![2]! + this.operands![3]! | 0,
		fn_5: () => this.operands![0]! + this.operands![1]! + this.operands![2]! + this.operands![3]! + this.operands![4]! | 0,
	}

	constructor(name: string) {
		if (!this.names.includes(name))
			throw new Error('Invalid strategy name');

		this.name = name;
	}

	static getStrategyImpl(name: string): Strategy {

		return new Strategy(name);
	}

	init(requests: ChartRequest[]): void {

		if (requests.length < 2 && requests.length > 5)
			throw new Error('Invalid strategy length');

		this.operands = new Int32Array(requests.length);
		this.symbols = new Object() as { [key: string]: number };

		requests.forEach((req: ChartRequest, i: number) => {
			this.symbols![req.symbol] = i;
		});

		const len = requests.length as 2 | 3 | 4 | 5;
		this.impl = this.strategy_strangle_fn[`fn_${len}`];
	}

	calc(q: Quote): number {

		this.operands![this.symbols![q.symbol]!] = q.ltp;
		return this.impl?.();
	}
}
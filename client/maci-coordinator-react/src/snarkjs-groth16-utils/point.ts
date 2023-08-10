export class G1Point {
    public x: BigInt;
    public y: BigInt;
    constructor(_x: BigInt, _y: BigInt) {
		this.x = _x;
		this.y = _y;
	}
    equals(pt: G1Point): boolean {
		return this.x === pt.x && this.y === pt.y
	}
    asContractParam(): {
        x: string;
        y: string;
    } {
		return {
			x: this.x.toString(),
			y: this.y.toString(),
	}
}
}

export class G2Point {
    public x: BigInt[];
    public y: BigInt[];
    constructor(_x: BigInt[], _y: BigInt[]) {
		this.x = _x;
		this.y = _y;
	}
    equals(pt: G2Point): boolean {
		return this.x[0] === pt.x[0] &&
			this.x[1] === pt.x[1] &&
			this.y[0] === pt.y[0] &&
			this.y[1] === pt.y[1];
	}
    asContractParam(): {
        x: string[];
        y: string[];
    } {
		return {
			x: [this.x[0].toString(), this.x[1].toString()],
			y: [this.y[0].toString(), this.y[1].toString()],
	}
}
}

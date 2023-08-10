
export class CoordinatorOutput {
	public proof: Groth16Proof;
	public publicSignals: PublicSignals;
	constructor(_proof: Groth16Proof, _publicSignals: PublicSignals) {
		this.proof = _proof;
		this.publicSignals = _publicSignals;
	}
	equals(p: CoordinatorOutput): boolean {
		return this.proof.equals(p.proof) && this.publicSignals.equals(p.publicSignals);
	}
	asContractParam() {
		return {
			proof: this.proof.asContractParam(),
			publicSignals: this.publicSignals.asContractParam(),
		};
	}

	public static fromJSON(json: any): CoordinatorOutput {
		const obj = JSON.parse(json);

		return new CoordinatorOutput(
			Groth16Proof.fromObj(obj),
			PublicSignals.fromObj(obj)
		);
	}

	public static fromObj = (obj: any): CoordinatorOutput => {
		return new CoordinatorOutput(
			Groth16Proof.fromObj(obj),
			PublicSignals.fromObj(obj)
		);
	}

}

export class PublicSignals {
	public signals: BigInt[];
	constructor(_signals: BigInt[]) {
		this.signals = _signals;
	};
	equals(p: PublicSignals): boolean {
		return this.signals.every((x, i) => x === p.signals[i]);
	};
	asContractParam() {
		return this.signals;
	};

	public static fromObj = (obj: any): PublicSignals => {
		const signals = obj.publicInput.map((x: any) => BigInt(x));
		return new PublicSignals(signals);
	}
}
export class Groth16Proof {
	public pi_a: BigInt[];
	public pi_b: BigInt[][];
	public pi_c: BigInt[];
	constructor(_pi_a: BigInt[], _pi_b: BigInt[][], _pi_c: BigInt[]) {
		this.pi_a = _pi_a;
		this.pi_b = _pi_b;
		this.pi_c = _pi_c;
	}
	equals(p: Groth16Proof): boolean {
		return (
			this.pi_a[0] === p.pi_a[0] &&
			this.pi_a[1] === p.pi_a[1] &&

			this.pi_b[0][0] === p.pi_b[0][0] &&
			this.pi_b[0][1] === p.pi_b[0][1] &&
			this.pi_b[1][0] === p.pi_b[1][0] &&
			this.pi_b[1][1] === p.pi_b[1][1] &&

			this.pi_c[0] === p.pi_c[0] &&
			this.pi_c[1] === p.pi_c[1]
		);
	};
	asContractParam() {
		return[
			this.pi_a[0],
			this.pi_a[1],

			this.pi_b[0][0],
			this.pi_b[0][1],
			this.pi_b[1][0],
			this.pi_b[1][1],

			this.pi_c[0],
			this.pi_c[1],
		]
	}

	public static fromJSON = (json: string): Groth16Proof => {
		const obj = JSON.parse(json);
		return Groth16Proof.fromObj(obj);
	}

	public static fromObj = (obj: any): Groth16Proof => {
		const pi_a = [
				BigInt(obj.pi_a[0]),
				BigInt(obj.pi_a[1])]
		const pi_b = [
				[
					BigInt(obj.pi_b[0][0]),
					BigInt(obj.pi_b[0][1]),
				],
				[
					BigInt(obj.pi_b[1][0]),
					BigInt(obj.pi_b[1][1]),
				]
			]
		const pi_c =[
				BigInt(obj.pi_c[0]),
				BigInt(obj.pi_c[1])]

		return new Groth16Proof(pi_a, pi_b, pi_c);
	}
}

import { G1Point, G2Point } from "./point"

export class VerifyingKey {
    public alpha1: G1Point
    public beta2: G2Point
    public gamma2: G2Point
    public delta2: G2Point
    public ic: G1Point[]

    constructor (
        _alpha1: G1Point,
        _beta2: G2Point,
        _gamma2: G2Point,
        _delta2: G2Point,
        _ic: G1Point[],
    ) {
        this.alpha1 = _alpha1
        this.beta2 = _beta2
        this.gamma2 = _gamma2
        this.delta2 = _delta2
        this.ic = _ic
    }

    public asContractParam() {
        return {
            alpha1: this.alpha1.asContractParam(),
            beta2: this.beta2.asContractParam(),
            gamma2: this.gamma2.asContractParam(),
            delta2: this.delta2.asContractParam(),
            ic: this.ic.map((x) => x.asContractParam()),
        }
    }

    public static fromContract(data: any): VerifyingKey {
        const convertG2 = (point: any): G2Point => {
            return new G2Point(
                [
                    BigInt(point.x[0]),
                    BigInt(point.x[1]),
                ],
                [
                    BigInt(point.y[0]),
                    BigInt(point.y[1]),
                ],
            )
        }

        return new VerifyingKey(
            new G1Point(
                BigInt(data.alpha1.x),
                BigInt(data.alpha1.y),
            ),
            convertG2(data.beta2),
            convertG2(data.gamma2),
            convertG2(data.delta2),
            data.ic.map(
                (c: any) => new G1Point(BigInt(c.x), BigInt(c.y))
            ),
        )
    }

    public equals(vk: VerifyingKey): boolean {
        let icEqual = this.ic.length === vk.ic.length

        // Immediately return false if the length doesn't match
        if (!icEqual) {
            return false
        }

        // Each element in ic must match
        for (let i = 0; i < this.ic.length; i ++) {
            icEqual = icEqual && this.ic[i].equals(vk.ic[i])
        }

        return this.alpha1.equals(vk.alpha1) &&
            this.beta2.equals(vk.beta2) &&
            this.gamma2.equals(vk.gamma2) &&
            this.delta2.equals(vk.delta2) &&
            icEqual
    }

    public copy(): VerifyingKey {
        const copyG2 = (point: any): G2Point => {
            return new G2Point(
                [
                    BigInt(point.x[0].toString()),
                    BigInt(point.x[1].toString()),
                ],
                [
                    BigInt(point.y[0].toString()),
                    BigInt(point.y[1].toString()),
                ],
            )
        }

        return new VerifyingKey(
            new G1Point(
                BigInt(this.alpha1.x.toString()),
                BigInt(this.alpha1.y.toString()),
            ),
            copyG2(this.beta2),
            copyG2(this.gamma2),
            copyG2(this.delta2),
            this.ic.map(
                (c: any) => new G1Point(BigInt(c.x.toString()), BigInt(c.y.toString()))
            ),
        )
    }

    public static fromJSON = (j: string): VerifyingKey => {
        const data = JSON.parse(j)
        return VerifyingKey.fromObj(data)
    }

    public static fromObj = (data: any): VerifyingKey => {
        const alpha1 = new G1Point(
            BigInt(data.vk_alpha_1[0]),
            BigInt(data.vk_alpha_1[1]),
        )
        const beta2 = new G2Point(
            [
                BigInt(data.vk_beta_2[0][1]),
                BigInt(data.vk_beta_2[0][0]),
            ],
            [
                BigInt(data.vk_beta_2[1][1]),
                BigInt(data.vk_beta_2[1][0]),
            ],
        )
        const gamma2 = new G2Point(
            [
                BigInt(data.vk_gamma_2[0][1]),
                BigInt(data.vk_gamma_2[0][0]),
            ],
            [
                BigInt(data.vk_gamma_2[1][1]),
                BigInt(data.vk_gamma_2[1][0]),
            ],
        )
        const delta2 = new G2Point(
            [
                BigInt(data.vk_delta_2[0][1]),
                BigInt(data.vk_delta_2[0][0]),
            ],
            [
                BigInt(data.vk_delta_2[1][1]),
                BigInt(data.vk_delta_2[1][0]),
            ],
        )
        const ic = data.IC.map((ic: string) => new G1Point(
            BigInt(ic[0]),
            BigInt(ic[1]),
        ))

        return new VerifyingKey(alpha1, beta2, gamma2, delta2, ic)
    }
}

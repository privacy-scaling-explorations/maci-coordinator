export const verifierContractABI = [
	{
		"inputs": [
			{
				"internalType": "uint256[8]",
				"name": "_proof",
				"type": "uint256[8]"
			},
			{
				"components": [
					{
						"components": [
							{
								"internalType": "uint256",
								"name": "x",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "y",
								"type": "uint256"
							}
						],
						"internalType": "struct Pairing.G1Point",
						"name": "alpha1",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "uint256[2]",
								"name": "x",
								"type": "uint256[2]"
							},
							{
								"internalType": "uint256[2]",
								"name": "y",
								"type": "uint256[2]"
							}
						],
						"internalType": "struct Pairing.G2Point",
						"name": "beta2",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "uint256[2]",
								"name": "x",
								"type": "uint256[2]"
							},
							{
								"internalType": "uint256[2]",
								"name": "y",
								"type": "uint256[2]"
							}
						],
						"internalType": "struct Pairing.G2Point",
						"name": "gamma2",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "uint256[2]",
								"name": "x",
								"type": "uint256[2]"
							},
							{
								"internalType": "uint256[2]",
								"name": "y",
								"type": "uint256[2]"
							}
						],
						"internalType": "struct Pairing.G2Point",
						"name": "delta2",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "uint256",
								"name": "x",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "y",
								"type": "uint256"
							}
						],
						"internalType": "struct Pairing.G1Point[]",
						"name": "ic",
						"type": "tuple[]"
					}
				],
				"internalType": "struct SnarkCommon.VerifyingKey",
				"name": "vk",
				"type": "tuple"
			},
			{
				"internalType": "uint256",
				"name": "input",
				"type": "uint256"
			}
		],
		"name": "verify",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]



import { Button, Text, VStack } from '@chakra-ui/react';
import React, { useState } from 'react';
import { useApi } from '../../context/ApiContext';

import { ConnectButton } from '@rainbow-me/rainbowkit';

import { useContractRead } from 'wagmi';

import {CoordinatorOutput, VerifyingKey} from '../../snarkjs-groth16-utils'
import { verifierContractABI } from './verifierContractABI';
import  vkPM from '../../snarkjs-groth16-utils/data/vk_processMessages-6-8-2-3.json'
import proofPM from '../../snarkjs-groth16-utils/data/proof_processMessages-6-8-2-3.json'



export const myPublicInput: BigInt =
BigInt("14704409631080902356035237930411403039120445656715690267916296226703866308707")



// WIll make a hooks using WAGMI for verifier contract
// https://wagmi.sh/react/typescript
// https://wagmi.sh/react/hooks/useContractWrite
// https://wagmi.sh/react/hooks/useContractRead
// SubmitPage will call verifier contract of Ethereum
const SubmitPage: React.FC<React.PropsWithChildren<{}>> = () => {

	console.log("------trying to generate correct calldata of verifier contract-----")

	const coordinatorServiceOutput: CoordinatorOutput = CoordinatorOutput.fromJSON(JSON.stringify(proofPM));
	const params = coordinatorServiceOutput.asContractParam();
	const processVk: VerifyingKey = VerifyingKey.fromJSON(JSON.stringify(vkPM));



	console.log("------SubmitPage mounted-----")
	// it hooks into the context(state variables)
	const { proofs, proverStateProcessMessages } = useApi();
	const verifierContractAddress = "0x8CdaF0CD259887258Bc13a92C0a6dA92698644C0"


	// const [verifyProofData, setVerifyProofData] = useState<any>(null);
	const [verifyProofError, setVerifyProofError] = useState<any>(null);
	const [verifyProofLoading, setVerifyProofLoading] = useState(false);

	// console.log("myProof", myProof);
	// console.log("processVk", processVk);
	// console.log("myPublicInput", myPublicInput);
	// console.log("Verify proof onchain");
	useContractRead({
		address: verifierContractAddress,
		abi: verifierContractABI,
		functionName: 'verify',
		args: [params.proof, processVk.asContractParam(), params.publicSignals],
		onSuccess: (data) => {
			// setVerifyProofData(data);
			setVerifyProofLoading(false);

			console.log("------verify result-----")
			console.log("hi: ", data)
		},
		onError: (error) => {
			setVerifyProofError(error);
			setVerifyProofLoading(false);

			console.log("verifyProofError", verifyProofError);
			console.log("verifyProofLoading", verifyProofLoading);
		},
	});


	const handleClick = () => {
		// setVerifyProofLoading(true);


	};
	return (
		<VStack>
			<Text>prover status: {proverStateProcessMessages}</Text>

			<ConnectButton />;

			<Button onClick={handleClick}>VerifyProof</Button>
			<>
				{/* display current prover status */}
				<div>prover status: {proverStateProcessMessages}</div>
				{/* render all vars */}
				<div>proofs: {JSON.stringify(proofs, null, 2)}</div>
			</>
		</VStack>

	);
}




export { SubmitPage };



import { Button, Text, VStack } from '@chakra-ui/react';
import React, { useState } from 'react';
import { useApi } from '../../context/ApiContext';

import { ConnectButton } from '@rainbow-me/rainbowkit';

import { useContractRead } from 'wagmi';

import {VerifyingKey} from '../../snarkjs-groth16-utils'
import { verifierContractABI } from './verifierContractABI';
import { vkJSON } from './vks';

export const myProof: BigInt[] = [
	BigInt("20776610477887446815273078353492765146630950893754290483106965963129184484201"),
	BigInt("20361705172705744303670075571916655888523410733801205089874915044387567682743"),
	BigInt("17389678848279063996173375881166939098239202813854548829882014432716092398334"),
	BigInt("17426197184151128999906962307999891337688037397387297609583638954535393586735"),
	BigInt("18815443775003060680231326273871977473225534307022727513514139122135612426509"),
	BigInt("1013820286085527856549788085986156916790548419305218446388370822384113344741"),
	BigInt("16682165190010025012222900500298529354050778179356771675155890688392737175543"),
	BigInt("20538042432207684220272328471113780649647617726850422541845213393797044820505"),
  ]


export const myPublicInput: BigInt =
BigInt("14704409631080902356035237930411403039120445656715690267916296226703866308707")



// WIll make a hooks using WAGMI for verifier contract
// https://wagmi.sh/react/typescript
// https://wagmi.sh/react/hooks/useContractWrite
// https://wagmi.sh/react/hooks/useContractRead
// SubmitPage will call verifier contract of Ethereum
const SubmitPage: React.FC<React.PropsWithChildren<{}>> = () => {


	console.log("------trying to generate correct calldata of verifier contract-----")

	const processVk: VerifyingKey = VerifyingKey.fromJSON(vkJSON)
	console.log("print domainobj: ", processVk.asContractParam());

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
		args: [myProof, processVk.asContractParam(), myPublicInput],
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

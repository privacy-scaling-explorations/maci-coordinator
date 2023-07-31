

import { Button, Text, VStack } from '@chakra-ui/react';
// import React, { useEffect, useState } from 'react';
import { useApi } from '../../context/ApiContext';

import { ConnectButton } from '@rainbow-me/rainbowkit';

// import { useContractRead } from 'wagmi';


// import { verifierContractABI } from './verifierContractABI';
// import { useState } from 'react';

// import { VerifyingKey } from 'maci-domainobjs'

// const myProof = ["16542799721131651594785520319939783050030996408880254975213942397115447948314", "11276094094407219125404880012996672687090029887517677365047394352730647638307", "4624707048990030241056274829986006064451294258864122130035851765417778857786", "11374867336108506564620695974673178140916932693816778303485868343126183996044", "13333897898351739374526247260562782187584657865084138075076474604866795747683", "21796399198891278713705094768108457173296477518126790625214500606487714231431", "12623440252842916725366345337807414063060721420474747555220467655269698182186", "3227599174012473946974486383698113016637468848831011083098752465254352579452"];

// const myPublicInput = [
// 	"18723775248480812191782918525766489928877804881253575454956449323181176067888"
// ]

// const processVk: VerifyingKey = VerifyingKey.fromJSON(vkObj)

// WIll make a hooks using WAGMI for verifier contract
// https://wagmi.sh/react/typescript
// https://wagmi.sh/react/hooks/useContractWrite
// https://wagmi.sh/react/hooks/useContractRead
// SubmitPage will call verifier contract of Ethereum
const SubmitPage: React.FC<React.PropsWithChildren<{}>> = () => {
	console.log("------SubmitPage mounted-----")
	// it hooks into the context(state variables)
	const { proofs, proverStateProcessMessages } = useApi();
	// const verifierContractAddress = '0x'


	// const [verifyProofData, setVerifyProofData] = useState<any>(null);
	// const [verifyProofError, setVerifyProofError] = useState<any>(null);
	// const [verifyProofLoading, setVerifyProofLoading] = useState(false);

	const handleClick = () => {
		// setVerifyProofLoading(true);
		console.log("Verify proof onchain");
	};

	// useContractRead({
	// 	address: verifierContractAddress,
	// 	abi: verifierContractABI,
	// 	functionName: 'verify',
	// 	args: [myProof, 'FIXME_VK', myPublicInput],
	// 	onError: (error) => {
	// 		setVerifyProofError(error);
	// 		setVerifyProofLoading(false);

	// 		console.log("verifyProofError", verifyProofError);
	// 		console.log("verifyProofLoading", verifyProofLoading);
	// 	},
	// });




	// const handleSomething = () => {
	// 	console.log("handleSomething");
	// };

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

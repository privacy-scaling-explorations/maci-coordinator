

import { Button, HStack, VStack } from '@chakra-ui/react';
// import React, { useEffect, useState } from 'react';
import { useApi } from '../../context/ApiContext';

import { ConnectButton } from '@rainbow-me/rainbowkit';


// SubmitPage will call verifier contract of Ethereum
const SubmitPage: React.FC<React.PropsWithChildren<{}>> = () => {
	// it hooks into the context(state variables)
	const { proofs, proverStateProcessMessages } = useApi();

	const handleSomething = () => {
		console.log("handleSomething");
	};

	return (
		<VStack>
			  <ConnectButton />;
			<HStack alignSelf="stretch" justifyContent="space-between" minH={"42px"} alignItems={"center"} spacing={10}>
				<Button onClick={handleSomething}>Do</Button>
			</HStack>
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

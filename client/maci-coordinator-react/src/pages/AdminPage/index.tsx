// import { useEffect } from "react";
import { useApi } from "../../context/ApiContext";

import { circuitInputProcessMessagesArray } from "../../context/circuit_inputs/pm_6-8-2-3";
import { circuitInputTallyVotesArray } from "../../context/circuit_inputs/tv_6-2-3";
import { Button } from "@chakra-ui/react";

const AdminPage: React.FC<React.PropsWithChildren<{}>> = () => {
	// it hooks into the context(state variables)
	const { circuitName, circuitInputProcessMessages, circuitInputTallyVotes, isLoading,  proverStateProcessMessages, CheckCoordinatorService, GenMultipleProofs  } = useApi();


	// Print out the circuitInputTallyVotesArray
	console.log("circuitInputTallyVotesArray: ", circuitInputTallyVotesArray);



	const handleGenProof = async () => {
		try {
			await CheckCoordinatorService();
			GenMultipleProofs("ProcessMessages", circuitInputProcessMessagesArray)
			// GenMultipleProofs("TallyVotes", circuitInputTallyVotesArray)

		} catch (err) {
			alert(`Failed to generate proof: ${err}`);
		}
};

const handleCheckCoordinatorService = async () => {
	try {
		console.log("CheckCoordinatorService: ", await CheckCoordinatorService())
	} catch (err) {
		console.log(`${err}`);
	}
};

	return <>
		{/* display current prover status */}
		{/* by automatically calling GetStatusFromCoordinatorService  */}


		<div>prover status: {proverStateProcessMessages}</div>

		<Button onClick={handleCheckCoordinatorService}>Check Coordinator Service</Button>
		<Button onClick={handleGenProof}>Gen Multiple Proof</Button>

		{/* render all vars */}
		{/* <div>proofs: {JSON.stringify(proofs, null, 2)}</div> */}


		<div>circuitName: {circuitName}</div>
		<div>circuitInputProcessMessages: {JSON.stringify(circuitInputProcessMessages, null, 2)}</div>
		<div>circuitInputTallyVotes: {JSON.stringify(circuitInputTallyVotes, null, 2)}</div>
		<div>isLoading: {isLoading.toString()}</div>
	</>
}


export { AdminPage };

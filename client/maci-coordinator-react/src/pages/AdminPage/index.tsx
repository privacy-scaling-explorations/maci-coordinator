import { useEffect } from "react";
import { useApi } from "../../context/ApiContext";

const AdminPage: React.FC<React.PropsWithChildren<{}>> = () => {
	// it hooks into the context(state variables)
	const { proofs, circuitName, circuitInputProcessMessages, circuitInputTallyVotes, isLoading, SendGenProofRequestToCoordinatorService,PollingGetProofFromCoordinatorService, GetStatusFromCoordinatorService, proverStateProcessMessages } = useApi();

	useEffect(() => {
		console.log('AdminPage useEffect');
		// call the function
		GetStatusFromCoordinatorService("ProcessMessages");
		SendGenProofRequestToCoordinatorService("ProcessMessages", circuitInputProcessMessages);
		PollingGetProofFromCoordinatorService("ProcessMessages");
	}, []);
	return <>
		{/* display current prover status */}
		{/* by automatically calling GetStatusFromCoordinatorService  */}


		<div>prover status: {proverStateProcessMessages}</div>


		{/* render all vars */}
		<div>proofs: {JSON.stringify(proofs, null, 2)}</div>


		<div>circuitName: {circuitName}</div>
		<div>circuitInputProcessMessages: {JSON.stringify(circuitInputProcessMessages, null, 2)}</div>
		<div>circuitInputTallyVotes: {JSON.stringify(circuitInputTallyVotes, null, 2)}</div>
		<div>isLoading: {isLoading.toString()}</div>
	</>
}


export { AdminPage };

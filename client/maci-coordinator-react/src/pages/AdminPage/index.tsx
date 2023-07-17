import { useApi } from "../../context/ApiContext";

const AdminPage: React.FC<React.PropsWithChildren<{}>> = () => {
	// it hooks into the context(state variables)
	const { proofs, circuitName, circuitInputProcessMessages, circuitInputTallyVotes, isLoading } = useApi();

	return <>
		{/* render all vars */}
		<div>proofs: {proofs.join(',')}</div>
		<div>circuitName: {circuitName}</div>
		<div>circuitInputProcessMessages: {JSON.stringify(circuitInputProcessMessages, null, 2)}</div>
		<div>circuitInputTallyVotes: {JSON.stringify(circuitInputTallyVotes, null, 2)}</div>
		<div>isLoading: {isLoading.toString()}</div>
	</>
}


export { AdminPage };


import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { circuitInputProcessMessagesDefault } from './circuitInputProcessMessagesDefault';
import { circuitInputTallyVotesDefault } from './circuitInputTallyVotesDefault';
// import { Text } from '@chakra-ui/react';


// define what the shape of our context wiil looks like
//
// Request body of /generateProof to the server
// {
// 	"circuitName": "ProcessMessages",
// 	"circuitInput": {JSON}
// }
export interface State {
	proofs: Array<any>;
	// TODO: create proof type
	setProofs: React.Dispatch<React.SetStateAction<Array<any>>>;
	circuitName: string;
	setcircuitName: React.Dispatch<React.SetStateAction<string>>;

	// circuitInput for each circuit
	circuitInputProcessMessages: CircuitInputProcessMessages;
	setcircuitInputProcessMessages: React.Dispatch<React.SetStateAction<CircuitInputProcessMessages>>;
	circuitInputTallyVotes: CircuitInputTallyVotes;
	setcircuitInputTallyVotes: React.Dispatch<React.SetStateAction<CircuitInputTallyVotes>>;


	// Loading state
	isLoading: boolean;
	setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;

	// function to send request to the server

	// TODO; knock in down later
	SendGenProofRequestToCoordinatorService: (circuitName: string, circuitInput: any) => void;
	PollingGetProofFromCoordinatorService: (_circuitName: string) => void;
	GetStatusFromCoordinatorService: (circuitName: string) => void;

	proverStateProcessMessages: string;
	setProverStateProcessMessages: React.Dispatch<React.SetStateAction<string>>;
	proverStateTallyVotes: string;
	setProverStateTallyVotes: React.Dispatch<React.SetStateAction<string>>;
}




// circuit inputs are defined in https://github.com/privacy-scaling-explorations/maci/blob/dev/circuits/circom/processMessages.circom
export interface CircuitInputProcessMessages {
	"coordPrivKey": string,
	"coordPubKey": Array<string>,
	"currentBallotRoot": string,
	"currentBallots": Array<Array<string>>,
	"currentBallotsPathElements": Array<Array<Array<string>>>,
	"currentSbCommitment": string,
	"currentSbSalt": string,
	"currentStateLeaves": Array<Array<string>>,
	"currentStateLeavesPathElements": Array<Array<Array<string>>>,
	"currentStateRoot": string,
	"currentVoteWeights": Array<string>,
	"currentVoteWeightsPathElements": Array<Array<Array<string>>>,
	"encPubKeys": Array<Array<string>>,
	"inputHash": string,
	"msgRoot": string,
	"msgSubrootPathElements": Array<Array<string>>,
	"msgs": Array<Array<string>>,
	"newSbCommitment": string,
	"newSbSalt": string,
	"packedVals": string,
	"pollEndTimestamp": string
}

// circuit inputs are defined in https://github.com/privacy-scaling-explorations/maci/blob/dev/circuits/circom/tallyVotes.circom
export interface CircuitInputTallyVotes {
	"ballotPathElements": Array<Array<string>>;
	"ballotRoot": string,
	"ballots": Array<Array<string>>,
	"currentPerVOSpentVoiceCredits": Array<string>,
	"currentPerVOSpentVoiceCreditsRootSalt": string,
	"currentResults": Array<string>,
	"currentResultsRootSalt": string,
	"currentSpentVoiceCreditSubtotal": string,
	"currentSpentVoiceCreditSubtotalSalt": string,
	"currentTallyCommitment": string,
	"inputHash": string,
	"newPerVOSpentVoiceCreditsRootSalt": string,
	"newResultsRootSalt": string,
	"newSpentVoiceCreditSubtotalSalt": string,
	"newTallyCommitment": string,
	"packedVals": string,
	"sbCommitment": string,
	"sbSalt": string,
	"stateRoot": string,
	"votes": Array<Array<string>>
}

const API_URL = "http://localhost:8080";

const ApiContext = createContext<State>({
	proofs: [],
	setProofs: () => null,
	circuitName: '',
	setcircuitName: () => null,
	circuitInputProcessMessages: circuitInputProcessMessagesDefault
	,
	// value is a function that takes in the previous state and returns the new state
	// @ts-ignore
	setcircuitInputProcessMessages: (value: (previousState: CircuitInputProcessMessages) => CircuitInputProcessMessages) => null,
	circuitInputTallyVotes: circuitInputTallyVotesDefault,
	setcircuitInputTallyVotes: () => null,
	isLoading: false,
	setIsLoading: () => null,
	SendGenProofRequestToCoordinatorService: (_circuitName: string, _circuitInput: any) => null,
	PollingGetProofFromCoordinatorService: (_circuitName: string) => null,
	GetStatusFromCoordinatorService: (_circuitName: string) => null,
	proverStateProcessMessages: '',
	setProverStateProcessMessages: () => null,
	proverStateTallyVotes: '',
	setProverStateTallyVotes: () => null,
});

export const initializeApiContext = () => {
	// create all of the context hooks
	const [circuitName, setcircuitName] = useState<string>("ProcessMessages")
	const [circuitInputProcessMessages, setcircuitInputProcessMessages] = useState<CircuitInputProcessMessages>(circuitInputProcessMessagesDefault)
	const [circuitInputTallyVotes, setcircuitInputTallyVotes] = useState<CircuitInputTallyVotes>(circuitInputTallyVotesDefault)
	const [proofs, setProofs] = useState<Array<any>>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [proverStateProcessMessages, setProverStateProcessMessages] = useState<string>("");
	const [proverStateTallyVotes, setProverStateTallyVotes] = useState<string>("");


	// API calls
	const SendGenProofRequestToCoordinatorService = async (circuitName: string, circuitInput: any) => {
		setIsLoading(true);
		try {
			console.log("circuitName", circuitName)
			// console.log("circuitInput", circuitInput)
			const response = await axios.post(`${API_URL}/api/generateProof`, { "circuitName": circuitName, "circuitInput": circuitInput });

			setProofs(response.data);
		} catch (error) {
			console.error(error);
		}
		setIsLoading(false);
	};

	const PollingGetProofFromCoordinatorService = async (circuitName: string) => {
		setIsLoading(true);
		try {
			let response = await axios.get(`${API_URL}/api/getResult`);
			let count = 0;
			let start = Date.now();


			let circuit = "";
			if (circuitName === "ProcessMessages") {
				circuit = "processMessagesCircuit";
			} else if (circuitName === "TallyVotes") {
				circuit = "tallyVotesCircuit";
			} else {
				throw new Error("Invalid circuit name");
			}

			// poll the coordinator until the proof is available
			while (response.data.data[circuit].status !== "ProofAvailable") {
				response = await axios.get(`${API_URL}/api/getResult`);
				count++;
				await new Promise(r => setTimeout(r, 1000));
			}
			let end = Date.now();
			console.log("Polling " + count + " times");
			console.log("Elapsed time: " + (end - start) / 1000 + " seconds");

			const proof: Array<any> = JSON.parse(response.data.data[circuit].result.proof);
			const publicInputs = JSON.parse(response.data.data[circuit].result.publicInput);
			const status = response.data.data[circuit].status;
			console.log("Prover status: " + status);
			console.log("publicInput: " + publicInputs);
			setProofs(proof);
		} catch (error) {
			console.error(error);
		}
		setIsLoading(false);
	};


	// API: /getResult
	// - Request (GET):

	// - Response:
	// 	{
	// 		"circuit": {
	// 			"name": "ProcessMessages",
	// 			"status": "Finished",
	// 			"result": {
	// 				"proof": {},
	// 				"publicInput": {}
	// 			}
	// 		}
	// 	}
	// Get Status by calling `${API_URL}/api/getResult`
	const GetStatusFromCoordinatorService = async (circuitName: string) => {
		try {
			let response = await axios.get(`${API_URL}/api/getResult`);
			let circuit = "";
			if (circuitName === "ProcessMessages") {
				circuit = "processMessagesCircuit";
			} else if (circuitName === "TallyVotes") {
				circuit = "tallyVotesCircuit";
			} else {
				throw new Error("Invalid circuit name");
			}
			const status = response.data.data[circuit].status;

			if (circuitName === "ProcessMessages") {
				setProverStateProcessMessages(status);
			} else if (circuitName === "TallyVotes") {
				setProverStateTallyVotes(status);
			}

			console.log("Prover status: " + status);
		} catch (error) {
			console.error(error);
		}
	};

	// empty dependency array of useEffect means this will only run once
	// when calling async inside useEffect, we need to define a function inside useEffect
	useEffect(() => { console.log('initializeApiContext useEffect'); }, []);

	return {
		proofs,
		setProofs,
		circuitName,
		setcircuitName,
		circuitInputProcessMessages,
		setcircuitInputProcessMessages,
		circuitInputTallyVotes,
		setcircuitInputTallyVotes,
		isLoading,
		setIsLoading,
		SendGenProofRequestToCoordinatorService,
		PollingGetProofFromCoordinatorService,
		GetStatusFromCoordinatorService,
		proverStateProcessMessages,
		setProverStateProcessMessages,
		proverStateTallyVotes,
		setProverStateTallyVotes
	}
}

// types are generally capitalized
// props is when we call the component with attributes
// type ApiProviderProps = {

// };


// we are going to store all of the proofs that we fetch from the server in this context
// React component that will wrap our entire application
//@ts-ignore
export const ApiProvider: React.Context<State> = ({ children }) => {
	// call our hook
	const state = initializeApiContext();




	return <ApiContext.Provider value={{ ...state }}>{children}</ApiContext.Provider>;
}


// how `ApiProvider` will resolved when we call `useApi`. `ApiProvider` is exported as a named export. And it could be accessed
// this is a custom hook that we will call in our components
export const useApi = () => useContext(ApiContext);

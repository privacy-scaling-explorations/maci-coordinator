
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { circuitInputProcessMessagesDefault } from './circuitInputProcessMessagesDefault';
import { circuitInputTallyVotesDefault } from './circuitInputTallyVotesDefault';


// circuit names:
// ProcessMessages
// TallyVotes

// define what the shape of our context wiil looks like
//
// Request body of /generateProof to the server
// {
// 	"circuitName": "ProcessMessages",
// 	"circuitInput": {JSON}
// }
export interface State {
	// TODO: assgin right type
	proofs: MACIProofs;
	// TODO: create proof type
	setProofs: React.Dispatch<React.SetStateAction<MACIProofs>>;
	getProofs: () => MACIProofs;
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

	CheckCoordinatorService: () => Promise<boolean>;

	// function to send request to the server
	GenMultipleProofs: (_circuitName: string, _circuitInputArray: Array<any>) => void;

	// TODO; knock in down later
	SendGenProofRequestToCoordinatorService: (circuitName: string, circuitInput: any) => void;
	PollingGetProofFromCoordinatorService: (_circuitName: string) => void;
	GetStatusFromCoordinatorService: (circuitName: string) => void;
	GetProofsFromCoordinatorService: () => void;

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

export interface Groth16Proof {
	"pi_a": Array<bigint>,
	"pi_b": Array<Array<bigint>>,
	"pi_c": Array<bigint>,
	"publicInput": Array<bigint>
}

export interface MACIProofs {
	"ProcessMessages": Array<Groth16Proof>,
	"TallyVotes": Array<Groth16Proof>
}

//
const emptyMACIProofs: MACIProofs = {
	"ProcessMessages": [],
	"TallyVotes": []
}

const API_URL = "http://localhost:8080";

const ApiContext = createContext<State>({
	proofs: emptyMACIProofs,
	setProofs: () => null,
	getProofs: () => emptyMACIProofs,
	circuitName: '',
	setcircuitName: () => null,
	circuitInputProcessMessages: circuitInputProcessMessagesDefault
	,
	// value is a function that takes in the previous state and returns the new state
	// @ts-ignore
	setcircuitInputProcessMessages: () => null,
	circuitInputTallyVotes: circuitInputTallyVotesDefault,
	setcircuitInputTallyVotes: () => null,
	isLoading: false,
	setIsLoading: () => null,
	CheckCoordinatorService: () => Promise.resolve(false),
	GenMultipleProofs: (_circuitName: string, _circuitInputArray: Array<CircuitInputProcessMessages>) => null,
	SendGenProofRequestToCoordinatorService: (_circuitName: string, _circuitInput: any) => null,
	PollingGetProofFromCoordinatorService: (_circuitName: string) => null,
	GetStatusFromCoordinatorService: (_circuitName: string) => null,
	GetProofsFromCoordinatorService: () => null,
	proverStateProcessMessages: '',
	setProverStateProcessMessages: () => null,
	proverStateTallyVotes: '',
	setProverStateTallyVotes: () => null,
});

export const InitializeApiContext = () => {
	// create all of the context hooks
	const [circuitName, setcircuitName] = useState<string>("ProcessMessages")
	const [circuitInputProcessMessages, setcircuitInputProcessMessages] = useState<CircuitInputProcessMessages>(circuitInputProcessMessagesDefault)
	const [circuitInputTallyVotes, setcircuitInputTallyVotes] = useState<CircuitInputTallyVotes>(circuitInputTallyVotesDefault)
	const [proofs, setProofs] = useState<MACIProofs>(emptyMACIProofs);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const [proverStateProcessMessages, setProverStateProcessMessages] = useState<string>("");
	const [proverStateTallyVotes, setProverStateTallyVotes] = useState<string>("");



	// API calls
	const CheckCoordinatorService = async () => {
		try {
			const response = await fetch(`${API_URL}/api/getResult`);
			if (response.ok) {
				return true;
			} else {
				console.log(`status code of GET request for ${API_URL}/api/getResult is not 200: ${response.status}`)
				return false;
			}
		} catch (error) {
			throw new Error(`failed to get a result from ${API_URL}/api/getResult: ${error}`);
		}
	}

	const GenMultipleProofs = async (circuitName: string, circuitInput: Array<any>) => {
		console.log("#################")
		console.log("#################")
		console.log("#################")
		console.log("#################")
		console.log("Start GenMultipleProofs")

		//measure elapsed time
		const start = performance.now();
		for (let i = 0; i < circuitInput.length; i++) {
			console.log(`Start GenProof ${i}`)
			await SendGenProofRequestToCoordinatorService(circuitName, circuitInput[i]);
			await PollingGetProofFromCoordinatorService(circuitName);
			console.log(`End GenProof ${i}`)
		}
		const end = performance.now();

		console.log("elapsed time", (end - start) / 1000, + " seconds")

	}

	const SendGenProofRequestToCoordinatorService = async (circuitName: string, circuitInput: any) => {
		setIsLoading(true);
		try {
			console.log("circuitName", circuitName)
			// console.log("circuitInput", circuitInput)
			const response = await axios.post(`${API_URL}/api/generateProof`, { "circuitName": circuitName, "circuitInput": circuitInput });

			console.log(`${API_URL}/api/generateProof response: ${response.status} ${response.statusText}`)

		} catch (error) {
			console.error(error);
		}
		setIsLoading(false);
	};

	const PollingGetProofFromCoordinatorService = async (circuitName: string) => {
		setIsLoading(true);

		let circuit = "";
		if (circuitName === "ProcessMessages") {
			circuit = "processMessagesCircuit";
		} else if (circuitName === "TallyVotes") {
			circuit = "tallyVotesCircuit";
		} else {
			throw new Error("Invalid circuit name");
		}

		try {
			let response = await axios.get(`${API_URL}/api/getResult`);
			let start = Date.now();


			// poll the coordinator until the proof is available

			while (response.data.data[circuit].status !== "ProofAvailable") {
				response = await axios.get(`${API_URL}/api/getResult`);

				console.log(`Waiting for proof generation... [${(Date.now() - start) / 1000} seconds]`);
				await new Promise(r => setTimeout(r, 1000));
			}
			let end = Date.now();
			console.log("Elapsed time: " + (end - start) / 1000 + " seconds");

			const proof: Groth16Proof = JSON.parse(response.data.data[circuit].result.proof);
			const publicInputs = JSON.parse(response.data.data[circuit].result.publicInput);
			const status = response.data.data[circuit].status;
			console.log("Prover status: " + status);
			console.log("publicInput: " + publicInputs);
			console.log("proof: " + proof);
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

	const GetProofsFromCoordinatorService = async () => {
		try {
			const _proofs: MACIProofs = {
				ProcessMessages: Array<Groth16Proof>(),
				TallyVotes: Array<Groth16Proof>()
			};

			let response = await axios.get(`${API_URL}/api/getResult`);

			const proofProcessMessages: Groth16Proof = JSON.parse(response.data.data.processMessagesCircuit.result.proof);
			const publicInputsProcessMessages = JSON.parse(response.data.data.processMessagesCircuit.result.publicInput);
			const statusProcessMessages = response.data.data.processMessagesCircuit.status;
			console.log("#################")
			console.log("#################")
			console.log("Prover status: " + statusProcessMessages);
			console.log("publicInput: " + publicInputsProcessMessages);

			proofProcessMessages.publicInput = publicInputsProcessMessages;
			console.log("#################")
			console.log("#################")
			console.log("proofProcessMessages: " + JSON.stringify(proofProcessMessages));
			_proofs.ProcessMessages.push(proofProcessMessages);

			console.log("$$$$$$$$$$$")
			console.log("$$$$$$$$$$$")


			const proofTallyVotes: Groth16Proof = JSON.parse(response.data.data.tallyVotesCircuit.result.proof);
			const publicInputsTallyVotes = JSON.parse(response.data.data.tallyVotesCircuit.result.publicInput);
			console.log("#################")
			console.log("#################")
			const statusTallyVotes = response.data.data.tallyVotesCircuit.status;
			console.log("Prover status: " + statusTallyVotes);
			console.log("publicInput: " + publicInputsTallyVotes);

			console.log("#################")
			console.log("#################")
			proofTallyVotes.publicInput = publicInputsTallyVotes;
			console.log("proofTallyVotes: " + JSON.stringify(proofTallyVotes));
			_proofs.TallyVotes.push(proofTallyVotes);

			setProofs(_proofs);
			// console.log(`proofs: ${JSON.stringify(_proofs)}`);
		} catch (error) {
			console.error(error);
		}
	}

	const getProofs = () => {
		return proofs;
	}

	// empty dependency array of useEffect means this will only run once
	// when calling async inside useEffect, we need to define a function inside useEffect
	useEffect(() => {
		console.log('initializeApiContext useEffect');
		// const getStatus = async () => {
		// 	await GetStatusFromCoordinatorService("ProcessMessages");
		// };
		// getStatus();
	}, []);

	return {
		proofs,
		setProofs,
		getProofs,
		circuitName,
		setcircuitName,
		circuitInputProcessMessages,
		setcircuitInputProcessMessages,
		circuitInputTallyVotes,
		setcircuitInputTallyVotes,
		isLoading,
		setIsLoading,
		CheckCoordinatorService,
		GenMultipleProofs,
		SendGenProofRequestToCoordinatorService,
		PollingGetProofFromCoordinatorService,
		GetStatusFromCoordinatorService,
		GetProofsFromCoordinatorService,
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
	const state = InitializeApiContext();


	return <ApiContext.Provider value={{ ...state }}>{children}</ApiContext.Provider>;
}


// how `ApiProvider` will resolved when we call `useApi`. `ApiProvider` is exported as a named export. And it could be accessed
// this is a custom hook that we will call in our components
export const useApi = () => useContext(ApiContext);


import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
// import axios from 'axios';
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
	proofs: Array<string>;
	// TODO: create proof type
	setProofs: React.Dispatch<React.SetStateAction<Array<string>>>;
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
}




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



// const API_URL = "http://localhost:8080";

const ApiContext = createContext<State>({
	proofs: [],
	setProofs: () => null,
	circuitName: '',
	setcircuitName: () => null,
	circuitInputProcessMessages: circuitInputProcessMessagesDefault
	  ,
	setcircuitInputProcessMessages: () => null,
	circuitInputTallyVotes: circuitInputTallyVotesDefault,
	setcircuitInputTallyVotes: () => null,
	isLoading: false,
	setIsLoading: () => null

});

export const initializeApiContext = () => {
	// create all of the context hooks
	const [circuitName, setcircuitName] = useState<string>("ProcessMessages")
	const [circuitInputProcessMessages, setcircuitInputProcessMessages] = useState<CircuitInputProcessMessages>(circuitInputProcessMessagesDefault)
	const [circuitInputTallyVotes, setcircuitInputTallyVotes] = useState<CircuitInputTallyVotes>(circuitInputTallyVotesDefault)
	const [proofs, setProofs] = useState<Array<string>>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);

	// actual API calls
	// empty dependency array of useEffect means this will only run once
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
		setIsLoading
	}
}

// types are generally capitalized
// props is when we call the component with attributes
type ApiProviderProps = {

};


// we are going to store all of the proofs that we fetch from the server in this context
//@ts-ignore
export const ApiProvider : React.FC<PropsWithChildren<ApiProviderProps>> = ({children}) => {
    return children;
}



export const useApi = () => useContext(ApiContext);

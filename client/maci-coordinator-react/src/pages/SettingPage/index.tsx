import { Box, Button, Code, HStack, Input, Text, VStack } from '@chakra-ui/react';
import React, { useState, useRef, useEffect } from 'react';
import { useApi, MACIProofs } from '../../context/ApiContext';

const SettingPage: React.FC<React.PropsWithChildren<{}>> = () => {
	const [processMessagesFile, setProcessMessagesFile]: any = useState();
	const [tallyVotesFile, setTallyVotesFile]: any = useState();

	const [processMessagesUploaded, setProcessMessagesUploaded] = useState(false);
	const [tallyVotesUploaded, setTallyVotesUploaded] = useState(false);
	const [allProofsGenerated, setAllProofsGenerated] = useState(false);
	const [proofData, setProofData] = useState(null as MACIProofs | null);


	const [status, setStatus] = useState({
		ProcessMessages: { state: "Pending", startTime: new Date, endTime: new Date },
		TallyVotes: { state: "Pending", startTime: new Date, endTime: new Date },
	});
	const [totalTime, setTotalTime] = useState(0);
	const timerRef: any = useRef();

	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
		}
	}, []);

	const { getProofs, proverStateProcessMessages, circuitInputProcessMessages, setcircuitInputProcessMessages, circuitInputTallyVotes, setcircuitInputTallyVotes, SendGenProofRequestToCoordinatorService, GetProofsFromCoordinatorService, PollingGetProofFromCoordinatorService } = useApi();

	console.log("[Setting page] proverstate: ", proverStateProcessMessages)

	const handleProcessMessagesFileChange = (event: any) => {
		setProcessMessagesFile(event.target.files[0]);
	};

	const handleTallyVotesFileChange = (event: any) => {
		setTallyVotesFile(event.target.files[0]);
	};

	const handleProcessMessagesUpload = () => {
		if (processMessagesFile) {
			const reader = new FileReader();
			reader.onload = function (evt) {
				try {
					const json = JSON.parse(evt.target?.result as string);
					// read file name
					const fileName = processMessagesFile.name;
					console.log("file name: ", fileName);
					console.log(json); // Replace this with whatever you want to do with the JSON

					setcircuitInputProcessMessages(json);
					setProcessMessagesUploaded(true);


				} catch (err) {
					alert(`The uploaded file is not valid JSON: ${err}`);
				}
			};
			reader.readAsText(processMessagesFile);
		} else {
			alert('No file selected');
		}
	};

	const handleTallyVotesUpload = () => {
		if (tallyVotesFile) {
			const reader = new FileReader();
			reader.onload = function (evt) {
				try {
					const json = JSON.parse(evt.target?.result as string);
					// read file name
					const fileName = tallyVotesFile.name;
					console.log("file name: ", fileName);
					console.log(json); // Replace this with whatever you want to do with the JSON

					setcircuitInputTallyVotes(json);
					setTallyVotesUploaded(true);

				} catch (err) {
					alert(`The uploaded file is not valid JSON: ${err}`);
				}
			};
			reader.readAsText(tallyVotesFile);
		} else {
			alert('No file selected');
		}
	};

	const handleGenProof = async () => {
		try {
			// Measure total time
			setTotalTime(0);
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}
			timerRef.current = setInterval(() => {
				setTotalTime(prevTime => prevTime + 1);
			}, 1000);


			setStatus(prevStatus => ({
				...prevStatus,
				ProcessMessages: { ...prevStatus.ProcessMessages, state: '⚙️ Generating...' },
			}));

			await SendGenProofRequestToCoordinatorService("ProcessMessages", circuitInputProcessMessages);
			await PollingGetProofFromCoordinatorService("ProcessMessages");

			setStatus(prevStatus => ({
				...prevStatus,
				ProcessMessages: { ...prevStatus.ProcessMessages, state: '✅', endTime: new Date() },
				TallyVotes: { ...prevStatus.TallyVotes, state: '⚙️ Generating...' },
			}));

			await SendGenProofRequestToCoordinatorService("TallyVotes", circuitInputTallyVotes);
			await PollingGetProofFromCoordinatorService("TallyVotes");
			setStatus(prevStatus => ({
				...prevStatus,
				TallyVotes: { ...prevStatus.TallyVotes, state: '✅', endTime: new Date() },
			}));

			// Stop timer
			if (timerRef.current) {
				clearInterval(timerRef.current);
			}

			setAllProofsGenerated(true);
			await showGeneratedProofs();

		} catch (err) {
			alert(`Failed to generate proof: ${err}`);
		}
	};

	const showGeneratedProofs = async () => {
		try {
			await GetProofsFromCoordinatorService();
			const proofs = getProofs();
			setProofData(proofs);
		} catch (err) {
			alert(`Failed to get proof: ${err}`);
		}
	};

	const getTimeElapsed = (start: any, end: any) => {
		if (!start || !end) return "N/A";
		const timeElapsed = end - start;
		return (timeElapsed / 1000).toFixed(2) + " seconds";
	};

	return (
		<VStack spacing={10}>
			<Text fontSize="2xl" fontWeight="bold">Upload circuit input</Text>

			<VStack>
				<Text fontSize="xl" fontWeight="bold">ProcessMessages</Text>
				<HStack alignSelf="stretch" justifyContent="space-between" minH={"42px"} alignItems={"center"} spacing={2}>
					<Input type="file" onChange={handleProcessMessagesFileChange} size="md" />
					<Button onClick={handleProcessMessagesUpload}>Upload</Button>
					<Text>{processMessagesUploaded ? '👍' : '🤔'}</Text>
				</HStack>
				<Text>Status: {status.ProcessMessages.state}</Text>
				<Text>Elapsed Time: {getTimeElapsed(status.ProcessMessages.startTime, status.ProcessMessages.endTime)}</Text>
			</VStack>

			<VStack>
				<Text fontSize="xl" fontWeight="bold">TallyVotes</Text>
				<HStack alignSelf="stretch" justifyContent="space-between" minH={"42px"} alignItems={"center"} spacing={2}>
					<Input type="file" onChange={handleTallyVotesFileChange} size="md" />
					<Button onClick={handleTallyVotesUpload}>Upload</Button>
					<Text>{tallyVotesUploaded ? '👍' : '🤔'}</Text>
				</HStack>
				<Text>Status: {status.TallyVotes.state}</Text>
				<Text>Elapsed Time: {getTimeElapsed(status.TallyVotes.startTime, status.TallyVotes.endTime)}</Text>
			</VStack>

			{/* Just for spacing */}
			<Text></Text>
			<Text></Text>
			<Text></Text>
			<Text></Text>

			<VStack>
				<Button onClick={handleGenProof}>Gen Proof</Button>
				<Text>Total Elapsed Time: {totalTime} seconds</Text>
				<HStack>
					<Text>Proofs Ready?</Text>
					<Text>{allProofsGenerated ? '🙆‍♂️' : '🙅‍♂️'}</Text>
				</HStack>
				<Box width="300%" height="400px" overflow="auto" p={4} color="white" bg="teal.500">
						<Code display="block" whiteSpace="pre" overflowX="auto">
							{proofData ? JSON.stringify(proofData, null, 2) : 'No data yet'}
						</Code>
				</Box>
			</VStack>
			<Button onClick={showGeneratedProofs}>Get Proof</Button>
		</VStack>
	);
}

export { SettingPage };

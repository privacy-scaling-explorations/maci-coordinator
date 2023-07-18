

import { Button, HStack, Input, VStack } from '@chakra-ui/react';
import React, { useState } from 'react';
import {  useApi } from '../../context/ApiContext';

const SettingPage: React.FC<React.PropsWithChildren<{}>> = () => {
  const [file, setFile] = useState();

  // set circuitInputProcessMessages from api context
  const { proverStateProcessMessages, circuitInputProcessMessages, setcircuitInputProcessMessages, SendGenProofRequestToCoordinatorService, PollingGetProofFromCoordinatorService } = useApi();

  console.log("[Setting page] proverstate: ", proverStateProcessMessages)

  const handleFileChange = (event: any) => {
    setFile(event.target.files[0]);
  };

const handleSubmit = () => {
	if (file) {
		const reader = new FileReader();
		reader.onload = function(evt) {
			try {
				const json = JSON.parse(evt.target?.result as string);
				console.log(json); // Replace this with whatever you want to do with the JSON

				setcircuitInputProcessMessages(json);
			} catch (err) {
				alert(`The uploaded file is not valid JSON: ${err}`);
			}
		};
		reader.readAsText(file);
	} else {
		alert('No file selected');
	}
};

const handleGenProof = () => {

			try {
				SendGenProofRequestToCoordinatorService("ProcessMessages", circuitInputProcessMessages);
				PollingGetProofFromCoordinatorService("ProcessMessages");
			} catch (err) {
				alert(`Failed to generate proof: ${err}`);
			}

};

  return (
	<VStack>
		<HStack alignSelf="stretch" justifyContent="space-between" minH={"42px"} alignItems={"center"} spacing={10}>
			<Input type="file" onChange={handleFileChange} size="md" />
			<Button onClick={handleSubmit}>Submit</Button>
		</HStack>
		<Button onClick={handleGenProof}>Gen Proof</Button>
	</VStack>

  );
}




export { SettingPage };

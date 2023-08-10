// specify an outlet

import { HStack, Heading, Text, VStack } from "@chakra-ui/react";
// import { Component } from "react";
import { Link, Outlet } from "react-router-dom";


const Layout: React.FC<React.PropsWithChildren<{}>> = () => {
	// return react fragment
	return <>
		{/* It will stack vertically */}
		<VStack minHeight="100vh" width={"100%"} spacing={0}>
			<HStack alignSelf="stretch" justifyContent="space-between" minH={"42px"} alignItems={"center"}>
				<Heading size="md" as={Link} to="/">Logo</Heading>
				<HStack spacing={4}>
					<Text as={Link} to="/admin">Admin</Text>
					<Text as={Link} to="/setting">Setting</Text>
					<Text as={Link} to="/submit">Submit</Text>
				</HStack>

			</HStack>
			<Outlet />
		</VStack>

	</>
}


export { Layout };

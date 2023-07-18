// @ts-nocheck
import './App.css'

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { LandingPage } from "./pages/LandingPage";
import { AdminPage } from "./pages/AdminPage";
import { SettingPage } from "./pages/SettingPage";

import { Layout } from "./Layout";
import { ApiProvider } from './context/ApiContext';
import { SubmitPage } from './pages/SubmitPage';

//
import '@rainbow-me/rainbowkit/styles.css';
import {
	getDefaultWallets,
	RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { configureChains, createConfig, WagmiConfig } from 'wagmi';
import {
	mainnet,
	polygon,
	optimism,
	arbitrum,
	zora,
} from 'wagmi/chains';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { publicProvider } from 'wagmi/providers/public';

const { chains, publicClient } = configureChains(
	[mainnet, polygon, optimism, arbitrum, zora],
	[
		// alchemyProvider({ apiKey: process.env.ALCHEMY_ID }),
		publicProvider()
	]
);
const { connectors } = getDefaultWallets({
	appName: 'My RainbowKit App',
	projectId: 'YOUR_PROJECT_ID',
	chains
});
const wagmiConfig = createConfig({
	autoConnect: true,
	connectors,
	publicClient
})



function App() {


	// make Path and layout
	return (
		// state variables has defined in ApiContext.tsx
		// It's React component not HTML tag
		<WagmiConfig config={wagmiConfig}>
			<RainbowKitProvider chains={chains}>
				<ApiProvider>
					<Router>
						<Routes>
							<Route path="/" element={<Layout />}>
								<Route path="/admin" element={<AdminPage />} />
								<Route path="/setting" element={<SettingPage />} />
								<Route path="/submit" element={<SubmitPage />} />

								<Route index element={<LandingPage />} />

							</Route>
						</Routes>
					</Router>
				</ApiProvider>
			</RainbowKitProvider>
		</WagmiConfig>
	)
}

export default App

import './App.css'

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { LandingPage } from "./pages/LandingPage";
import { AdminPage } from "./pages/AdminPage";
import { SettingPage } from "./pages/SettingPage";

import { Layout } from "./Layout";

function App() {


	// make Path and layout
	return (
		<Router>
			<Routes>
				<Route path="/" element={<Layout />}>
					<Route path="/admin" element={<AdminPage />} />
					<Route path="/setting" element={<SettingPage />} />

					<Route index element={<LandingPage />} />

				</Route>
			</Routes>
		</Router>
	)
}

export default App

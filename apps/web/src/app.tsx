import { BrowserRouter, Route, Routes } from "react-router";
import { HomeScreen } from "@/components/home-screen";
import { LobbyScreen } from "@/components/lobby-screen";

export const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/l/:lobbyId" element={<LobbyScreen />} />
    </Routes>
  </BrowserRouter>
);

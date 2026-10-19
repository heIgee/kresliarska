import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router";
import { HomeScreen } from "@/components/home-screen";
import { LobbyScreen } from "@/components/lobby-screen";
import { useSystemTheme } from "@/hooks/use-system-theme";

export const App = () => {
  const theme = useSystemTheme();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/l/:lobbyId" element={<LobbyScreen theme={theme} />} />
      </Routes>
    </BrowserRouter>
  );
};

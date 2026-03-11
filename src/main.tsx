import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { shadcnTheme } from "./theme";
import "@mantine/core/styles.css";
import { shadcnCssVariableResolver } from "./cssVariableResolver";
import "./style.css";
import "@mantine/dates/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider
      theme={shadcnTheme}
      cssVariablesResolver={shadcnCssVariableResolver}
      defaultColorScheme="light"
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>,
);

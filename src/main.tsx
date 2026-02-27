import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AdsProvider } from "./context/AdsContext";

import "@mantine/core/styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="dark">
      <BrowserRouter>
        <AdsProvider>
          <App />
        </AdsProvider>
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>,
);

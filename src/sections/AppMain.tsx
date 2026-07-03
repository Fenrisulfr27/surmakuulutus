import { Box, Flex } from "@mantine/core";
import { Route, Routes } from "react-router-dom";
import AddAdPage from "../pages/AddAdPage";
import AdDetailsPage from "../pages/AdDetailsPage";
import HomePage from "../pages/HomePage";

export function AppMain() {
  return (
    <Box component="main" className="app-main-section">
      <Flex direction="row" wrap="wrap" justify="center" gap="lg">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lisa-kuulutus" element={<AddAdPage />} />
          <Route path="/ads/:slug" element={<AdDetailsPage />} />
        </Routes>
      </Flex>
    </Box>
  );
}

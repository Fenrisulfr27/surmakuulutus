import "@mantine/core/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Container } from "@mantine/core";
import { AppHeader } from "./sections/AppHeader";
import { AppMain } from "./sections/AppMain";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Container size="xl">
        <Helmet>
          <title>Surmakuulutused – Avaleht</title>
          <meta
            name="description"
            content="Surmakuulutused – avalda lahkunute mälestuseks kuulutusi ja hoia mälestusi elus."
          />
        </Helmet>
        <AppHeader />
        <AppMain />
      </Container>
    </QueryClientProvider>
  );
}

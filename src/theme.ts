import { createTheme } from "@mantine/core";

export const theme = createTheme({
  fontFamily: '"Cormorant Garamond", Georgia, serif',
  colors: {
    dark: [
      "#ececec",
      "#d0d0d0",
      "#a6a6a6",
      "#696969",
      "#353535",
      "#1f1f1f",
      "#121212",
      "#0a0a0a",
      "#050503",
      "#000000",
    ],
  },
  primaryColor: "dark",
  headings: {
    fontFamily: '"Cinzel", "Cormorant Garamond", Georgia, serif',
  },
  components: {
    Text: {
      defaultProps: {
        ff: '"Cormorant Garamond", Georgia, serif',
        c: "#e3ded6",
      },
      styles: {
        root: {
          color: "#e3ded6",
        },
      },
    },
    Title: {
      defaultProps: {
        ff: '"Cinzel", "Cormorant Garamond", Georgia, serif',
        c: "#ece5d8",
      },
      styles: {
        root: {
          color: "#ece5d8",
        },
      },
    },
    Button: {
      defaultProps: {
        ff: '"Cinzel", "Cormorant Garamond", Georgia, serif',
        radius: 0,
      },
      styles: {
        root: {
          textTransform: "uppercase",
          letterSpacing: "2px",
          paddingInline: 16,
          minWidth: "auto",
          fontSize: 14,
          fontWeight: 600,
          border: "1px solid rgba(255,255,255,0.12)",
          backgroundColor: "#ece5d8",
          color: "#121212",
        },
        label: {
          color: "#121212",
        },
      },
    },
  },
});

import type { Decorator, Preview } from "@storybook/react-vite";
import { ToastProvider } from "../src/components/Toast";
import "../src/styles/components.css";
import "../src/styles/tokens.css";
import { ThemeProvider, type ThemeSetting } from "../src/theme/ThemeProvider";

const withTheme: Decorator = (Story, context) => (
  <ThemeProvider theme={context.globals.theme as ThemeSetting}>
    <ToastProvider>
      <div style={{ padding: 24, minHeight: "100vh", boxSizing: "border-box" }}>
        <Story />
      </div>
    </ToastProvider>
  </ThemeProvider>
);

const preview: Preview = {
  decorators: [withTheme],
  tags: ["autodocs"],
  globalTypes: {
    theme: {
      description: "Color theme",
      toolbar: { title: "Theme", icon: "mirror", items: ["light", "dark", "system"], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: "light" },
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" }, // axe violations fail story tests
  },
};

export default preview;

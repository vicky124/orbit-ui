import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../test/axe";
import { ThemeProvider, useTheme } from "../theme/ThemeProvider";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { Switch } from "./Switch";
import { Tab, TabList, TabPanel, Tabs } from "./Tabs";
import { TextField } from "./TextField";
import { ToastProvider, useToast } from "./Toast";
import { Tooltip } from "./Tooltip";

describe("Button", () => {
  it("defaults to type=button and forwards props and refs", async () => {
    const onClick = vi.fn();
    let node: HTMLButtonElement | null = null;
    render(<Button onClick={onClick} ref={(n) => { node = n; }} data-testid="b">Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("type", "button");
    expect(node).toBe(button);
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("is busy and unclickable while loading", async () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("TextField", () => {
  it("wires label, description and error for assistive tech", async () => {
    const { container } = render(
      <TextField label="Email" description="Work address" error="Enter a valid email" required defaultValue="x" />,
    );
    const input = screen.getByRole("textbox", { name: /email/i });
    expect(input).toBeRequired();
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription("Work address Enter a valid email");
    await expectNoA11yViolations(container);
  });
});

describe("Switch", () => {
  it("toggles via click on the switch or its label, and with Space", async () => {
    const onChange = vi.fn();
    render(<Switch label="Notifications" onCheckedChange={onChange} />);
    const sw = screen.getByRole("switch", { name: "Notifications" });
    expect(sw).not.toBeChecked();
    await userEvent.click(sw);
    expect(sw).toBeChecked();
    await userEvent.click(screen.getByText("Notifications"));
    expect(sw).not.toBeChecked();
    sw.focus();
    await userEvent.keyboard(" ");
    expect(sw).toBeChecked();
    expect(onChange.mock.calls.map((c) => c[0])).toEqual([true, false, true]);
  });

  it("respects controlled state", async () => {
    render(<Switch label="Locked" checked={false} onCheckedChange={() => {}} />);
    await userEvent.click(screen.getByRole("switch"));
    expect(screen.getByRole("switch")).not.toBeChecked();
  });
});

function TabsDemo(props: { activation?: "automatic" | "manual" }) {
  return (
    <Tabs defaultValue="a" activation={props.activation}>
      <TabList label="Sections">
        <Tab value="a">Alpha</Tab>
        <Tab value="b" disabled>Beta</Tab>
        <Tab value="c">Gamma</Tab>
      </TabList>
      <TabPanel value="a">Alpha panel</TabPanel>
      <TabPanel value="b">Beta panel</TabPanel>
      <TabPanel value="c">Gamma panel</TabPanel>
    </Tabs>
  );
}

describe("Tabs", () => {
  it("uses roving tabindex and links tabs to panels", async () => {
    const { container } = render(<TabsDemo />);
    const alpha = screen.getByRole("tab", { name: "Alpha" });
    expect(alpha).toHaveAttribute("tabindex", "0");
    expect(screen.getByRole("tab", { name: "Gamma" })).toHaveAttribute("tabindex", "-1");
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("Alpha");
    await expectNoA11yViolations(container);
  });

  it("arrow keys skip disabled tabs and wrap (automatic activation)", async () => {
    render(<TabsDemo />);
    await userEvent.tab();
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Gamma" })).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Gamma panel");
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Alpha" })).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Gamma" })).toHaveAttribute("aria-selected", "true");
  });

  it("manual activation moves focus without selecting until Enter", async () => {
    render(<TabsDemo activation="manual" />);
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Alpha panel");
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("tabpanel")).toHaveTextContent("Gamma panel");
  });
});

function DialogDemo({ dismissOnOverlayClick }: { dismissOnOverlayClick?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Delete project</Button>
      <p>Background content</p>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Delete project?"
        description="This cannot be undone."
        dismissOnOverlayClick={dismissOnOverlayClick}
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="danger">Delete</Button>
          </>
        }
      />
    </>
  );
}

const nextFrame = () => act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))));

describe("Dialog", () => {
  it("moves focus in, traps Tab, closes on Escape and restores focus", async () => {
    render(<DialogDemo />);
    const opener = screen.getByRole("button", { name: "Delete project" });
    await userEvent.click(opener);
    await nextFrame();
    const dialog = screen.getByRole("dialog", { name: "Delete project?" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleDescription("This cannot be undone.");
    const cancel = within(dialog).getByRole("button", { name: "Cancel" });
    expect(cancel).toHaveFocus();
    expect(document.body.style.overflow).toBe("hidden");

    await userEvent.tab();
    expect(within(dialog).getByRole("button", { name: "Delete" })).toHaveFocus();
    await userEvent.tab(); // wraps
    expect(cancel).toHaveFocus();
    await userEvent.tab({ shift: true }); // wraps backwards
    expect(within(dialog).getByRole("button", { name: "Delete" })).toHaveFocus();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });

  it("closes on overlay click unless disabled", async () => {
    const { unmount } = render(<DialogDemo />);
    await userEvent.click(screen.getByRole("button", { name: "Delete project" }));
    await userEvent.click(document.querySelector(".orbit-dialog__overlay")!);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    unmount();

    render(<DialogDemo dismissOnOverlayClick={false} />);
    await userEvent.click(screen.getByRole("button", { name: "Delete project" }));
    await userEvent.click(document.querySelector(".orbit-dialog__overlay")!);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("has no axe violations when open", async () => {
    render(<DialogDemo />);
    await userEvent.click(screen.getByRole("button", { name: "Delete project" }));
    await nextFrame();
    await expectNoA11yViolations(screen.getByRole("dialog"));
  });
});

describe("Tooltip", () => {
  it("shows on focus, describes the trigger, and hides on Escape", async () => {
    render(
      <Tooltip content="Copies the link">
        <button>Share</button>
      </Tooltip>,
    );
    await userEvent.tab();
    const tip = await screen.findByRole("tooltip");
    expect(tip).toHaveTextContent("Copies the link");
    expect(screen.getByRole("button", { name: "Share" })).toHaveAccessibleDescription("Copies the link");
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows on hover after the delay and keeps the child's own handlers", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const onMouseEnter = vi.fn();
    render(
      <Tooltip content="Hi" delay={300}>
        <button onMouseEnter={onMouseEnter}>Hover me</button>
      </Tooltip>,
    );
    await userEvent.hover(screen.getByRole("button"));
    expect(onMouseEnter).toHaveBeenCalled();
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    vi.useRealTimers();
  });
});

function ToastDemo() {
  const { toast } = useToast();
  return (
    <>
      <Button onClick={() => toast({ title: "Saved", tone: "success", duration: 1000 })}>Save</Button>
      <Button onClick={() => toast({ title: "Upload failed", tone: "danger", duration: 0 })}>Fail</Button>
    </>
  );
}

describe("Toast", () => {
  it("announces politely, errors assertively, auto-dismisses and pauses on hover", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<ToastProvider><ToastDemo /></ToastProvider>);
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("status")).toHaveTextContent("Saved");

    await userEvent.hover(screen.getByRole("status"));
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(screen.getByRole("status")).toBeInTheDocument(); // paused while hovered
    await userEvent.unhover(screen.getByRole("status"));
    await act(() => vi.advanceTimersByTimeAsync(1100));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Fail" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Upload failed");
    await act(() => vi.advanceTimersByTimeAsync(10_000));
    await userEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});

describe("ThemeProvider", () => {
  function Toggle() {
    const { resolved, setTheme } = useTheme();
    return <Button onClick={() => setTheme(resolved === "dark" ? "light" : "dark")}>{resolved}</Button>;
  }

  it("applies data-theme, token overrides, and carries them into portals", async () => {
    render(
      <ThemeProvider defaultTheme="dark" tokens={{ "--orbit-color-accent": "#0f766e" }}>
        <Toggle />
        <Dialog open onOpenChange={() => {}} title="Themed" />
      </ThemeProvider>,
    );
    const root = document.querySelector(".orbit-root") as HTMLElement;
    expect(root).toHaveAttribute("data-theme", "dark");
    expect(root.style.getPropertyValue("--orbit-color-accent")).toBe("#0f766e");
    const portal = screen.getByRole("dialog").closest(".orbit-portal") as HTMLElement;
    expect(portal).toHaveAttribute("data-theme", "dark");
    expect(portal.style.getPropertyValue("--orbit-color-accent")).toBe("#0f766e");

    await userEvent.click(screen.getByRole("button", { name: "dark" }));
    expect(root).toHaveAttribute("data-theme", "light");
    expect(portal).toHaveAttribute("data-theme", "light");
  });
});

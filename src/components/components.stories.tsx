import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button } from "./Button";
import { Dialog } from "./Dialog";
import { Switch } from "./Switch";
import { Tab, TabList, TabPanel, Tabs } from "./Tabs";
import { TextField } from "./TextField";
import { useToast } from "./Toast";
import { Tooltip } from "./Tooltip";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  args: { children: "Save changes", variant: "solid", size: "md", loading: false, disabled: false },
  argTypes: {
    variant: { control: "inline-radio", options: ["solid", "outline", "ghost", "danger"] },
    size: { control: "inline-radio", options: ["sm", "md", "lg"] },
  },
};
export default meta;

export const Playground: StoryObj<typeof Button> = {};

export const Variants: StoryObj = {
  render: () => (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
      <Button>Solid</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Delete</Button>
      <Button loading>Saving</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
};

export const Form: StoryObj = {
  render: function FormStory() {
    const [email, setEmail] = useState("not-an-email");
    const invalid = !email.includes("@");
    return (
      <form style={{ display: "grid", gap: 16, maxWidth: 360 }} onSubmit={(e) => e.preventDefault()}>
        <TextField label="Full name" required placeholder="Ada Lovelace" />
        <TextField label="Email" description="We'll send the invoice here." value={email}
          onChange={(e) => setEmail(e.target.value)} error={invalid ? "Enter a valid email address." : undefined} />
        <Switch label="Email me product updates" defaultChecked />
        <Button type="submit">Create account</Button>
      </form>
    );
  },
};

export const TabsStory: StoryObj = {
  name: "Tabs",
  render: () => (
    <Tabs defaultValue="overview">
      <TabList label="Project">
        <Tab value="overview">Overview</Tab>
        <Tab value="activity">Activity</Tab>
        <Tab value="billing" disabled>Billing</Tab>
        <Tab value="settings">Settings</Tab>
      </TabList>
      <TabPanel value="overview">Arrow keys move between tabs; Home/End jump; disabled tabs are skipped.</TabPanel>
      <TabPanel value="activity">No recent activity.</TabPanel>
      <TabPanel value="settings">Settings panel.</TabPanel>
    </Tabs>
  ),
};

export const DialogStory: StoryObj = {
  name: "Dialog",
  render: function DialogDemo() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>Delete project</Button>
        <Dialog open={open} onOpenChange={setOpen} title="Delete “Orbit website”?"
          description="The project and its 214 deployments will be permanently removed." dismissOnOverlayClick={false}
          footer={<>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => setOpen(false)}>Delete project</Button>
          </>}>
          <TextField label="Type the project name to confirm" />
        </Dialog>
      </>
    );
  },
};

export const TooltipStory: StoryObj = {
  name: "Tooltip",
  render: () => (
    <div style={{ paddingTop: 48, display: "flex", gap: 12 }}>
      <Tooltip content="Copies a public link to your clipboard"><Button variant="outline">Share</Button></Tooltip>
      <Tooltip content="Opens below when there's no room above" side="bottom"><Button variant="ghost">Bottom</Button></Tooltip>
    </div>
  ),
};

export const ToastStory: StoryObj = {
  name: "Toast",
  render: function ToastDemo() {
    const { toast } = useToast();
    return (
      <div style={{ display: "flex", gap: 12 }}>
        <Button onClick={() => toast({ title: "Changes saved", tone: "success" })}>Success</Button>
        <Button variant="outline" onClick={() => toast({ title: "Sync paused", description: "We'll retry in 30 seconds." })}>Neutral</Button>
        <Button variant="danger" onClick={() => toast({ title: "Upload failed", description: "File exceeds 25 MB.", tone: "danger", duration: 0 })}>Error</Button>
      </div>
    );
  },
};

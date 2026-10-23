import { notFound } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { STATUS_META, StatusBadge, type StatusKey } from "@/components/ui/status-badge";
import { TextSizeControl } from "@/components/ui/text-size-control";
import { DialogDemo } from "./dialog-demo";

// Dev-only design gallery; always 404 in production (notFound() is not linked from any nav).
export default function DesignPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="mx-auto flex max-w-288 flex-col gap-8 px-4 py-6 sm:px-6">
      <h1 className="text-display font-semibold">Design gallery</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-heading font-semibold">Text size</h2>
        <TextSizeControl />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-heading font-semibold">Status badges</h2>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(STATUS_META) as StatusKey[]).map((k) => (
            <StatusBadge key={k} status={k} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-heading font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
          <Button disabled>Disabled</Button>
          <Button loading>Loading</Button>
          <Button variant="secondary" size="lg">
            Large (56px)
          </Button>
        </div>
      </section>

      <section className="flex max-w-md flex-col gap-4">
        <h2 className="text-heading font-semibold">Fields</h2>
        <Field label="Email" required helper="Use your college address.">
          <Input type="email" autoComplete="username" />
        </Field>
        <Field label="Password" required error="Enter your password.">
          <Input type="password" autoComplete="current-password" />
        </Field>
        <Field label="Venue">
          <Select defaultValue="hall">
            <option value="hall">Main Hall</option>
            <option value="lab">Lab 2</option>
          </Select>
        </Field>
        <Field label="Notes">
          <Textarea />
        </Field>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-heading font-semibold">Alerts</h2>
        <Alert variant="info" title="Info">Registrations close on Friday.</Alert>
        <Alert variant="success" title="Success">You are registered for Demo Hackathon.</Alert>
        <Alert variant="warning" title="Warning">Only 2 seats left.</Alert>
        <Alert variant="error" title="Error">We could not save that. Try again.</Alert>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-heading font-semibold">Card</h2>
        <Card>Card content on the panel surface.</Card>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-heading font-semibold">Review and confirm</h2>
        <DialogDemo />
      </section>
    </main>
  );
}

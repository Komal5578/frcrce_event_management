"use client";

import { useActionState, type ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/field";
import { addTaskAction, type ActionState } from "../actions";

/** Step 4: inline "Add task" group (not a modal). The existing tasks table is passed in as children. */
export function TasksStep({ eventId, students, children }: {
  eventId: string; students: { id: string; name: string }[]; children: ReactNode;
}) {
  type S = ActionState & { values?: Record<string, string> };
  const [state, action, pending] = useActionState(async (p: S, fd: FormData): Promise<S> => {
    const r = await addTaskAction(eventId, fd);
    // React resets the form after an action, so a failed attempt echoes what was typed back as defaults
    if (r.ok) return { ...r, count: (p.count ?? 0) + 1 };
    return { ...r, count: p.count, values: { title: String(fd.get("title") ?? ""), assignee: String(fd.get("assignee") ?? ""), due: String(fd.get("due") ?? "") } };
  }, {} as S);
  const err = state.fieldErrors ?? {};
  return (
    <div className="flex flex-col gap-6">
      {children}
      <form action={action} noValidate className="flex max-w-2xl flex-col gap-4 rounded-control border border-border-card bg-panel p-4">
        <h3 className="text-heading font-semibold">Add task</h3>
        <Field label="Task" required error={err.title}><Input name="title" maxLength={120} autoComplete="off" defaultValue={state.values?.title} /></Field>
        <Field label="Assigned to" required error={err.assignee}>
          <Select name="assignee" defaultValue={state.values?.assignee ?? ""}>
            <option value="" disabled>Choose a student</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </Field>
        <Field label="Due date" required error={err.due} helper="Due at the end of that day."><Input type="date" name="due" defaultValue={state.values?.due} /></Field>
        {state.error && <Alert variant="error" title="Could not add the task">{state.error}</Alert>}
        {state.ok && <Alert variant="success" title="Task added">The student has been told in the app.</Alert>}
        <div><Button type="submit" variant="secondary" loading={pending}>Add task</Button></div>
      </form>
    </div>
  );
}

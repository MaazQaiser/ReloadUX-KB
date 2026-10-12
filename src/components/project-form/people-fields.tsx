"use client";

import { useState, useTransition } from "react";
import { createPersonAction, type FormPerson } from "@/app/(app)/projects/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { PERSON_ROLE } from "@/lib/constants";
import type { PersonRole } from "@/schemas/tags";
import type { ProjectFormValues } from "@/schemas/project-form";
import { ChipGroup, SelectField, TextField } from "./fields";

type PeopleValues = Pick<
  ProjectFormValues,
  "lead_designer" | "designers" | "account_manager" | "delivered_to_name" | "delivered_to_role"
>;

/** People who can fill a role: active ones, plus anyone already selected (who may have left since). */
function optionsFor(people: FormPerson[], role: PersonRole, selected: readonly string[]) {
  return people
    .filter((person) => person.roles.includes(role) && (person.active || selected.includes(person.id)))
    .map((person) => ({ value: person.id, label: person.active ? person.name : `${person.name} (former)` }));
}

function AddPerson({ onAdded }: { onAdded: (person: FormPerson, existed: boolean) => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState<PersonRole>("designer");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function add() {
    startTransition(async () => {
      try {
        const result = await createPersonAction({ name, roles: [role] });
        if (!result.ok) {
          setMessage(result.message);
          return;
        }
        onAdded(result.person, result.existed);
        setMessage(result.existed ? `${result.person.name} was already listed, so they're selected.` : null);
        setName("");
      } catch {
        setMessage("Couldn't add that person. Try again.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed p-3">
      <p className="text-sm font-medium">Someone missing?</p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label htmlFor="new-person-name">Name</Label>
          <Input id="new-person-name" value={name} onChange={(event) => setName(event.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-person-role">Role</Label>
          <NativeSelect id="new-person-role" value={role} onChange={(event) => setRole(event.target.value as PersonRole)}>
            {PERSON_ROLE.keys.map((key) => (
              <NativeSelectOption key={key} value={key}>
                {PERSON_ROLE.labels[key]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <Button type="button" variant="outline" onClick={add} disabled={pending || name.trim() === ""}>
          {pending ? "Adding…" : "Add person"}
        </Button>
      </div>
      <p role="status" className="min-h-5 text-sm text-muted-foreground">
        {message}
      </p>
    </div>
  );
}

export function PeopleFields({
  values,
  set,
  errors,
  initialPeople,
}: {
  values: PeopleValues;
  set: <K extends keyof ProjectFormValues>(key: K, value: ProjectFormValues[K]) => void;
  errors: Record<string, string>;
  initialPeople: FormPerson[];
}) {
  const [people, setPeople] = useState(initialPeople);
  const selected = [values.lead_designer, ...values.designers, values.account_manager].filter(Boolean);
  const designerOptions = optionsFor(people, "designer", selected);

  function added(person: FormPerson) {
    setPeople((current) =>
      current.some((existing) => existing.id === person.id)
        ? current
        : [...current, person].sort((a, b) => a.name.localeCompare(b.name)),
    );
    // Fill the most likely empty slot so adding someone takes one click.
    if (person.roles.includes("designer") && !values.lead_designer) set("lead_designer", person.id);
    else if (person.roles.includes("designer")) set("designers", [...new Set([...values.designers, person.id])]);
    else if (person.roles.includes("account_manager") && !values.account_manager) set("account_manager", person.id);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          path="lead_designer"
          label="Lead designer"
          required
          value={values.lead_designer}
          onChange={(value) => {
            set("lead_designer", value);
            // The lead isn't also listed as another designer.
            set("designers", values.designers.filter((id) => id !== value));
          }}
          options={designerOptions}
          error={errors.lead_designer}
        />
        <SelectField
          path="account_manager"
          label="Account manager"
          value={values.account_manager}
          onChange={(value) => set("account_manager", value)}
          options={optionsFor(people, "account_manager", selected)}
          placeholder="Not recorded"
          error={errors.account_manager}
        />
      </div>
      <ChipGroup
        path="designers"
        legend="Other designers"
        options={designerOptions.filter((option) => option.value !== values.lead_designer)}
        selected={values.designers}
        onChange={(next) => set("designers", next)}
        error={errors.designers}
      />
      <AddPerson onAdded={added} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          path="delivered_to_name"
          label="Delivered to (client contact)"
          value={values.delivered_to_name}
          onChange={(value) => set("delivered_to_name", value)}
          error={errors.delivered_to_name}
        />
        <TextField
          path="delivered_to_role"
          label="Their role"
          value={values.delivered_to_role}
          onChange={(value) => set("delivered_to_role", value)}
          error={errors.delivered_to_role}
        />
      </div>
    </div>
  );
}

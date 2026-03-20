import React, { useState } from "react";
import { Button } from "../atoms/Button";
import { Input } from "../atoms/Input";

interface AddAppFormProps {
  onSubmit: (name: string, sourceUrl: string) => Promise<void>;
}

interface FormErrors {
  name?: string;
  sourceUrl?: string;
}

export function AddAppForm({ onSubmit }: AddAppFormProps): React.JSX.Element {
  const [name, setName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!sourceUrl.trim()) errs.sourceUrl = "URL is required";
    else if (!/^https:\/\//i.test(sourceUrl))
      errs.sourceUrl = "Must start with https://";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      await onSubmit(name.trim(), sourceUrl.trim());
      setName("");
      setSourceUrl("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="add-app-form" onSubmit={handleSubmit} noValidate>
      <h2 className="add-app-form__title">Add Application</h2>
      <Input
        label="Name"
        placeholder="e.g. VS Code"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        disabled={submitting}
      />
      <Input
        label="Source URL"
        placeholder="https://github.com/owner/repo"
        value={sourceUrl}
        onChange={(e) => setSourceUrl(e.target.value)}
        error={errors.sourceUrl}
        disabled={submitting}
      />
      <Button
        type="submit"
        loading={submitting}
        className="add-app-form__submit"
      >
        Track App
      </Button>
    </form>
  );
}

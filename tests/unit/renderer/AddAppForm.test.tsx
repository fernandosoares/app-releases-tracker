// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AddAppForm } from "@renderer/components/molecules/AddAppForm";

afterEach(() => {
  cleanup();
});

describe("AddAppForm", () => {
  it("shows validation errors for empty and invalid inputs", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<AddAppForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: "Track App" }));

    expect(screen.getByText("Name is required")).toBeTruthy();
    expect(screen.getByText("URL is required")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "My App" },
    });
    fireEvent.change(screen.getByLabelText("Source URL"), {
      target: { value: "http://example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Track App" }));

    expect(screen.getByText("Must start with https://")).toBeTruthy();
  });

  it("submits trimmed values and resets fields", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<AddAppForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "  VS Code  " },
    });
    fireEvent.change(screen.getByLabelText("Source URL"), {
      target: { value: "  https://github.com/microsoft/vscode  " },
    });

    fireEvent.click(screen.getByRole("button", { name: "Track App" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        "VS Code",
        "https://github.com/microsoft/vscode",
      );
    });

    const nameInput = screen.getByLabelText("Name") as HTMLInputElement;
    const urlInput = screen.getByLabelText("Source URL") as HTMLInputElement;

    expect(nameInput.value).toBe("");
    expect(urlInput.value).toBe("");
  });
});

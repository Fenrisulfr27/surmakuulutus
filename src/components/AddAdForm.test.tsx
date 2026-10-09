import { MantineProvider } from "@mantine/core";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AddAdForm from "./AddAdForm";
import type { AdFormValues } from "../lib/adValidation";
import { LanguageProvider } from "../context/LanguageContext";

afterEach(() => {
  cleanup();
});

const emptyValues: AdFormValues = {
  name: "",
  email: "",
  birthYear: "",
  deathYear: "",
  poem: "",
  bottomText: "",
  topText: "",
};

function renderForm(
  overrides: Partial<{
    values: AdFormValues;
    onSubmit: (values: AdFormValues) => Promise<void>;
    onChange: (values: AdFormValues) => void;
  }> = {},
) {
  const onSubmit = overrides.onSubmit ?? vi.fn().mockResolvedValue(undefined);
  const onChange = overrides.onChange ?? vi.fn();

  render(
    <MantineProvider>
      <LanguageProvider>
        <AddAdForm
          values={overrides.values ?? emptyValues}
          onSubmit={onSubmit}
          onChange={onChange}
        />
      </LanguageProvider>
    </MantineProvider>,
  );

  return { onSubmit, onChange };
}

describe("AddAdForm", () => {
  it("shows required field errors and does not submit empty form", async () => {
    const { onSubmit } = renderForm();

    fireEvent.click(screen.getByRole("button", { name: "Salvesta" }));

    expect(await screen.findByText("Nimi on kohustuslik")).toBeDefined();
    expect(screen.getByText("Sisesta kehtiv e-mail")).toBeDefined();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("shows death date error when death date is before birth date", async () => {
    const { onSubmit } = renderForm({
      values: {
        ...emptyValues,
        name: "Mari Mets",
        email: "mari@example.com",
        birthYear: new Date("2026-01-02"),
        deathYear: new Date("2026-01-01"),
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Salvesta" }));

    expect(
      await screen.findByText("Surmaaeg peab olema hilisem kui sünniaeg"),
    ).toBeDefined();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits normalized values when form is valid", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm({
      onSubmit,
      values: {
        ...emptyValues,
        name: "  Mari Mets  ",
        email: "  mari@example.com  ",
        topText: "Teatame kurbusega",
        bottomText: "Leinavad lapsed",
      },
    });

    fireEvent.click(screen.getByRole("button", { name: "Salvesta" }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Mari Mets",
      email: "mari@example.com",
      birthYear: undefined,
      deathYear: undefined,
      poem: "",
      topText: "Teatame kurbusega",
      bottomText: "Leinavad lapsed",
    });
  });
});

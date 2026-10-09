import { z } from "zod";

const optionalDateLike = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    return value;
  },
  z.union([z.string(), z.date()]).optional(),
);

export const adFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Nimi on kohustuslik")
      .max(100, "Nimi võib olla kuni 100 tähemärki"),
    email: z
      .string()
      .trim()
      .email("Sisesta kehtiv e-mail")
      .max(254, "E-mail võib olla kuni 254 tähemärki"),
    poem: z
      .string()
      .max(300, "Luuletus võib olla kuni 300 tähemärki")
      .default(""),
    topText: z
      .string()
      .max(100, "Tekst enne lahkunu nime võib olla kuni 100 tähemärki")
      .default(""),
    bottomText: z
      .string()
      .max(100, "Leinajad võivad olla kuni 100 tähemärki")
      .default(""),
    birthYear: optionalDateLike,
    deathYear: optionalDateLike,
  })
  .superRefine((values, context) => {
    const parseDate = (value: string | Date | undefined) => {
      if (!value) {
        return undefined;
      }

      const date = value instanceof Date ? value : new Date(value);

      return Number.isNaN(date.getTime()) ? null : date;
    };

    const birthDate = parseDate(values.birthYear);
    const deathDate = parseDate(values.deathYear);

    if (values.birthYear && birthDate === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["birthYear"],
        message: "Sisesta kehtiv sünniaeg",
      });
    }

    if (values.deathYear && deathDate === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deathYear"],
        message: "Sisesta kehtiv surmaaeg",
      });
    }

    if (birthDate && deathDate && deathDate < birthDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deathYear"],
        message: "Surmaaeg peab olema hilisem kui sünniaeg",
      });
    }
  });

export type AdFormValues = z.infer<typeof adFormSchema>;

export type AdFieldErrors = Partial<Record<keyof AdFormValues, string>>;

export function validateAdForm(values: unknown) {
  const result = adFormSchema.safeParse(values);

  if (result.success) {
    return { success: true as const, data: result.data };
  }

  const flattened = result.error.flatten().fieldErrors;
  const fieldErrors = Object.fromEntries(
    Object.entries(flattened).map(([key, messages]) => [key, messages?.[0]]),
  ) as AdFieldErrors;

  return {
    success: false as const,
    fieldErrors,
    errorMessage: result.error.issues[0]?.message ?? "Andmed ei ole õiged",
  };
}

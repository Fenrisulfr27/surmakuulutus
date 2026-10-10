import { z } from "zod";
import type { Language } from "../context/language";

const validationMessages = {
  et: {
    nameRequired: "Nimi on kohustuslik",
    nameMax: "Nimi võib olla kuni 100 tähemärki",
    topTextRequired: "Tekst enne lahkunu nime on kohustuslik",
    bottomTextRequired: "Leinajad on kohustuslikud",
    emailInvalid: "Sisesta kehtiv e-mail",
    emailMax: "E-mail võib olla kuni 254 tähemärki",
    poemMax: "Luuletus võib olla kuni 300 tähemärki",
    topTextMax: "Tekst enne lahkunu nime võib olla kuni 100 tähemärki",
    bottomTextMax: "Leinajad võivad olla kuni 100 tähemärki",
    birthDateInvalid: "Sisesta kehtiv sünniaeg",
    deathDateInvalid: "Sisesta kehtiv surmaaeg",
    deathBeforeBirth: "Surmaaeg peab olema hilisem kui sünniaeg",
    generic: "Andmed ei ole õiged",
  },
  en: {
    nameRequired: "Name is required",
    nameMax: "Name can be up to 100 characters",
    topTextRequired: "Text before the deceased's name is required",
    bottomTextRequired: "Mourners are required",
    emailInvalid: "Enter a valid email",
    emailMax: "Email can be up to 254 characters",
    poemMax: "Poem can be up to 300 characters",
    topTextMax: "Text before the deceased's name can be up to 100 characters",
    bottomTextMax: "Mourners can be up to 100 characters",
    birthDateInvalid: "Enter a valid date of birth",
    deathDateInvalid: "Enter a valid date of death",
    deathBeforeBirth: "Date of death must be after date of birth",
    generic: "The data is invalid",
  },
} as const;

const optionalDateLike = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    return value;
  },
  z.union([z.string(), z.date()]).optional(),
);

export function createAdFormSchema(language: Language = "et") {
  const messages = validationMessages[language];

  return z
  .object({
    name: z
      .string()
      .trim()
      .min(1, messages.nameRequired)
      .max(100, messages.nameMax),
    email: z
      .string()
      .trim()
      .email(messages.emailInvalid)
      .max(254, messages.emailMax),
    poem: z
      .string()
      .max(300, messages.poemMax)
      .default(""),
    topText: z
      .string()
      .trim()
      .min(1, messages.topTextRequired)
      .max(100, messages.topTextMax)
      .default(""),
    bottomText: z
      .string()
      .trim()
      .min(1, messages.bottomTextRequired)
      .max(100, messages.bottomTextMax)
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
        message: messages.birthDateInvalid,
      });
    }

    if (values.deathYear && deathDate === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deathYear"],
        message: messages.deathDateInvalid,
      });
    }

    if (birthDate && deathDate && deathDate < birthDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deathYear"],
        message: messages.deathBeforeBirth,
      });
    }
  });
}

export const adFormSchema = createAdFormSchema();

export type AdFormValues = z.infer<typeof adFormSchema>;

export type AdFieldErrors = Partial<Record<keyof AdFormValues, string>>;

export function validateAdForm(values: unknown, language: Language = "et") {
  const result = createAdFormSchema(language).safeParse(values);

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
    errorMessage:
      result.error.issues[0]?.message ?? validationMessages[language].generic,
  };
}

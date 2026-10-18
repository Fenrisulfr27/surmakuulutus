import { validateAdForm, type AdFormValues } from "./adValidation";
import { createAiGeneratedAd, findAiGeneratedAdByKey } from "./ads";
import victims from "../data/kommunismiohvrid.json";
import { createHash } from "node:crypto";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const MODEL = "gpt-4.1-mini";
const GENERATED_EMAIL = "automaat@surmakuulutus.ee";

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getOutputText(payload: OpenAIResponse) {
  if (payload.output_text) {
    return payload.output_text;
  }

  return payload.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text ?? "")
    .join("\n")
    .trim();
}

type Victim = (typeof victims)[number];

function toIsoDate(date: string) {
  const [day, month, year] = date.split(".");
  return `${year}-${month}-${day}`;
}

function selectVictim(key: string): Victim {
  const index = createHash("sha256").update(key).digest().readUInt32BE(0) % victims.length;
  return victims[index];
}

function parseGeneratedAd(text: string, victim: Victim): AdFormValues {
  const json = JSON.parse(text) as Partial<AdFormValues>;
  const parsed = validateAdForm({
    name: victim.name,
    email: GENERATED_EMAIL,
    birthYear: toIsoDate(victim.birthDate),
    deathYear: toIsoDate(victim.deathDate),
    poem: json.poem ?? "",
    topText: json.topText,
    bottomText: json.bottomText,
  });

  if (!parsed.success) {
    throw new Error("Generated obituary did not match the ad form schema");
  }

  return parsed.data;
}

async function generateAdValues(victim: Victim) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not defined");
  }

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      input: [
        {
          role: "system",
          content:
            "Kirjuta ainult korrektne JSON. Sisu peab olema eestikeelne, austav ja loomulik. Ära lisa kontrollimata eluloolisi või perekondlikke väiteid.",
        },
        {
          role: "user",
          content:
            `Kirjuta austav mälestuskuulutuse tekst inimesele ${victim.name}. Väljasta ainult JSON väljadega topText, poem, bottomText. topText kuni 100 märki, poem kuni 300 märki, bottomText kuni 100 märki. Ära väida, et tekst pärineb omastelt.`,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "obituary",
          schema: {
            type: "object",
            additionalProperties: false,
            required: ["topText", "poem", "bottomText"],
            properties: {
              topText: { type: "string", maxLength: 100 },
              poem: { type: "string", maxLength: 300 },
              bottomText: { type: "string", maxLength: 100 },
            },
          },
          strict: true,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`);
  }

  const payload = (await response.json()) as OpenAIResponse;
  const outputText = getOutputText(payload);

  if (!outputText) {
    throw new Error("OpenAI response did not include text output");
  }

  return parseGeneratedAd(outputText, victim);
}

function generationKey(runDate: string, runId?: string) {
  return `${runDate}:${runId?.trim() || "manual"}`;
}

export async function generateDailyAiObituary(runId?: string) {
  const runDate = todayKey();
  const aiGenerationKey = generationKey(runDate, runId);
  const existingAd = await findAiGeneratedAdByKey(aiGenerationKey);

  if (existingAd) {
    return { created: false as const, ad: existingAd };
  }

  const values = await generateAdValues(selectVictim(aiGenerationKey));

  return createAiGeneratedAd(values, runDate, aiGenerationKey);
}

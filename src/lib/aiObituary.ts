import { validateAdForm, type AdFormValues } from "./adValidation";
import { createAiGeneratedAd, findAiGeneratedAdByKey } from "./ads";

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

function parseGeneratedAd(text: string): AdFormValues {
  const json = JSON.parse(text) as Partial<AdFormValues>;
  const parsed = validateAdForm({
    name: json.name,
    email: GENERATED_EMAIL,
    birthYear: json.birthYear,
    deathYear: json.deathYear,
    poem: json.poem ?? "",
    topText: json.topText,
    bottomText: json.bottomText,
  });

  if (!parsed.success) {
    throw new Error("Generated obituary did not match the ad form schema");
  }

  return parsed.data;
}

async function generateAdValues() {
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
            "Kirjuta ainult korrektne JSON. Sisu peab olema eestikeelne, austav, loomulik ja väljamõeldud.",
        },
        {
          role: "user",
          content:
            "Loo üks realistlik väljamõeldud Eesti surmakuulutus. Väljasta ainult JSON väljadega name, birthYear, deathYear, topText, poem, bottomText. birthYear ja deathYear peavad olema kujul YYYY-MM-DD. name kuni 100 märki, topText kuni 100 märki, poem kuni 300 märki, bottomText kuni 100 märki. Ära kasuta päris avaliku elu tegelasi.",
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "obituary",
          schema: {
            type: "object",
            additionalProperties: false,
            required: [
              "name",
              "birthYear",
              "deathYear",
              "topText",
              "poem",
              "bottomText",
            ],
            properties: {
              name: { type: "string", maxLength: 100 },
              birthYear: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
              deathYear: { type: "string", pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
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

  return parseGeneratedAd(outputText);
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

  const values = await generateAdValues();

  return createAiGeneratedAd(values, runDate, aiGenerationKey);
}

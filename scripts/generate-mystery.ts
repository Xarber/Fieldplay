// SPDX-License-Identifier: AGPL-3.0-only
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";

const text = z.string().trim().min(12).max(4000);
const character = z.object({
  name: z.string().trim().min(2).max(60),
  background: text,
  objective: text,
  introduction: text,
});
const story = z.object({
  title: z.string().trim().min(4).max(100),
  opening: text,
  discovery: text,
  clues: z.array(text).length(3),
  solution: text,
  characters: z.tuple([
    character,
    character,
    character,
    character,
    character,
    character,
  ]),
});
const roles = [
  "Assassino",
  "Ispettore",
  "Aiutante",
  "Testimone",
  "Ospite",
  "Confidente",
];
const [directory, setting = "Una cena in un rifugio di montagna"] =
  process.argv.slice(2);
if (!directory)
  throw new Error(
    "Uso: npx tsx scripts/generate-mystery.ts CARTELLA_NUOVA [ambientazione]",
  );
const schema = z.toJSONSchema(story);
const response = await fetch("http://127.0.0.1:11434/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  signal: AbortSignal.timeout(180_000),
  body: JSON.stringify({
    model: process.env.FIELDPLAY_MYSTERY_MODEL ?? "qwen2.5:0.5b",
    stream: false,
    format: schema,
    options: { temperature: 0.4, num_ctx: 4096 },
    messages: [
      {
        role: "user",
        content: `Scrivi in italiano una cena con delitto fittizia e non grafica. Ambientazione: ${setting.slice(0, 300)}. Sei personaggi, in ordine: ${roles.join(", ")}. Usa nomi distinti. Solo il primo è il colpevole. Ogni introduzione è pubblica e non rivela segreti. Dai un obiettivo privato a ciascuno. Il master annuncia la scoperta dopo le presentazioni, rivela tre indizi durante l'indagine e legge la soluzione dopo le accuse. Ogni indizio deve indicare quando rivelarlo. La soluzione deve collegare gli indizi e nominare il colpevole. Schema: ${JSON.stringify(schema)}`,
      },
    ],
  }),
});
if (!response.ok) throw new Error(`Ollama ha risposto HTTP ${response.status}`);
const envelope = z
  .object({ message: z.object({ content: z.string() }) })
  .parse(await response.json());
const kit = story.parse(JSON.parse(envelope.message.content));
if (new Set(kit.characters.map((c) => c.name.toLowerCase())).size !== 6) {
  throw new Error("Il modello ha ripetuto un nome. Genera di nuovo.");
}
await mkdir(directory, { mode: 0o700 });
const sheets = kit.characters.map(
  (c, i) =>
    `# Ti chiami ${c.name}\n\nRuolo privato: ${roles[i]} (${i < 3 ? "principale" : "secondario"})\n\nPresentati così: ${c.introduction}\n\nIl tuo passato: ${c.background}\n\nNella storia il tuo obiettivo è: ${c.objective}\n\nRiferisci al master gli eventi rilevanti e tieni privata la scheda.\n`,
);
await Promise.all([
  writeFile(
    join(directory, "master.md"),
    `# ${kit.title}\n\nRileggi storia, indizi e schede prima di distribuirle.\n\n## Presentazioni\n${kit.opening}\n\n## Scoperta\n${kit.discovery}\n\n## Indagine\n${kit.clues.map((c) => "- " + c).join("\n")}\n\n## Accuse e soluzione\n${kit.solution}\n\n${sheets.join("\n")}\n`,
    { mode: 0o600, flag: "wx" },
  ),
  ...sheets.map((sheet, index) =>
    writeFile(join(directory, `personaggio-${index + 1}.md`), sheet, {
      mode: 0o600,
      flag: "wx",
    }),
  ),
]);
console.log(
  "Creati copione del master e sei schede. Controlla la coerenza prima di distribuirle.",
);

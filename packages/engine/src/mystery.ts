import { z } from "zod";
const text = z.string().trim().min(12).max(4000);
const character = z.object({
  name: z.string().trim().min(2).max(60),
  background: text,
  objective: text,
  introduction: text,
});
export const mysteryStory = z.object({
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
export const mysteryRoles = [
  "Assassino",
  "Ispettore",
  "Aiutante",
  "Testimone",
  "Ospite",
  "Confidente",
];
export const mysteryKit = z
  .object({ version: z.literal(1), story: mysteryStory })
  .refine(
    ({ story }) =>
      new Set(story.characters.map(({ name }) => name.toLowerCase())).size ===
      6,
    "Character names must be unique",
  );
export type MysteryKit = z.infer<typeof mysteryKit>;

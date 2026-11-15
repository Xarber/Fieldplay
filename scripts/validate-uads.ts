import { readFileSync, existsSync } from "node:fs";
import { resolve, sep } from "node:path";
import { z } from "zod";

const parse = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));
const id = z.string().regex(/^UADS-[A-Z]+-\d{3}$/);
const schema = z.strictObject({
  uadsBaseline: z.string().min(1),
  manifestVersion: z.literal(1),
  project: z.strictObject({
    name: z.string().min(1),
    repository: z.string().regex(/^[\w.-]+\/[\w.-]+$/),
    profiles: z
      .array(z.enum(["mobile-app", "web-app", "backend-service"]))
      .min(1),
    framework: z.string().min(1),
    platforms: z.array(z.enum(["ios", "android", "web"])).min(1),
    hosting: z.string().min(1),
  }),
  requirements: z
    .array(
      z.strictObject({
        id,
        applicability: z.literal("required"),
        status: z.enum(["pending", "passed", "failed", "blocked"]),
        evidence: z.array(z.string().min(1)),
      }),
    )
    .min(1),
  exceptions: z.tuple([]),
});
const jsonSchema = z.toJSONSchema(schema);
if (process.argv.includes("--schema")) {
  console.log(JSON.stringify(jsonSchema, null, 2));
} else {
  const checked = schema.parse(parse("uads.json"));
  const registry = z
    .record(
      id,
      z.object({
        section: z.number().int().positive(),
        title: z.string().min(1),
        verification: z.string().min(1),
      }),
    )
    .parse(parse("config/uads-requirements.json"));
  const declared = new Set<string>();
  for (const requirement of checked.requirements) {
    if (
      !Object.hasOwn(registry, requirement.id) ||
      declared.has(requirement.id)
    )
      throw new Error(`Unknown or duplicate requirement: ${requirement.id}`);
    declared.add(requirement.id);
    if (requirement.status === "passed" && !requirement.evidence.length)
      throw new Error(`Missing evidence: ${requirement.id}`);
    for (const file of requirement.evidence) {
      const path = resolve(file);
      if (!path.startsWith(process.cwd() + sep) || !existsSync(path))
        throw new Error(`Invalid evidence path: ${file}`);
    }
  }
  if (declared.size !== Object.keys(registry).length)
    throw new Error("Missing registry requirements");
  if (
    JSON.stringify(jsonSchema) !==
    JSON.stringify(parse("config/uads-schema.json"))
  )
    throw new Error("Manifest JSON Schema is out of sync");
  console.log(
    `Validated ${declared.size} declarations. Functional evidence is tracked separately.`,
  );
}

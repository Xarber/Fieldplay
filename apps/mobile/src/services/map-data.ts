// SPDX-License-Identifier: AGPL-3.0-only
import { offset, type Arena, type Point, type View } from "@fieldplay/engine";
import type { FeatureCollection, Feature, Polygon } from "geojson";
export type GameMapProps = {
  arena: Arena;
  view?: View;
  onPick?: (p: Point) => void;
  height?: number;
  selection?: Point;
  editor?: "center" | "polygon" | "exclude" | "checkpoint";
};
export const mapStyle =
  process.env.EXPO_PUBLIC_MAP_STYLE ??
  "https://tiles.openfreemap.org/styles/liberty";
const polygon = (points: Point[], color: string): Feature<Polygon> => ({
  type: "Feature",
  properties: { color },
  geometry: {
    type: "Polygon",
    coordinates: [[...points, points[0]].map((p) => [p.longitude, p.latitude])],
  },
});
const circle = (center: Point, radius: number, color: string) =>
  polygon(
    Array.from({ length: 64 }, (_, i) =>
      offset(center, radius, (i / 64) * Math.PI * 2),
    ),
    color,
  );
export function mapData({
  arena,
  view,
  selection,
}: GameMapProps): FeatureCollection {
  const features: Feature[] = [circle(arena.center, arena.radius, "#6269F5")];
  if (arena.polygon) features.push(polygon(arena.polygon, "#B2C8FF"));
  arena.exclusions.forEach((z) =>
    features.push(circle(z.center, z.radius, "#E56D88")),
  );
  if (view?.assignment?.zone)
    features.push(
      circle(
        view.assignment.zone.center,
        view.assignment.zone.radius,
        "#D9B458",
      ),
    );
  if (view?.survival)
    features.push(
      circle(view.survival.center, view.survival.radius, "#B1DD83"),
    );
  const marker = (p: Point, color: string, label: string) =>
    features.push({
      type: "Feature",
      properties: { color, label },
      geometry: { type: "Point", coordinates: [p.longitude, p.latitude] },
    });
  marker(arena.center, "#6269F5", "Start");
  view?.config.checkpoints.forEach((p, i) =>
    marker(
      p,
      view.checkpoints[i]?.owner === "lime" ? "#95BC6C" : "#6269F5",
      String(i + 1),
    ),
  );
  view?.players.forEach((p) => {
    if (p.location) {
      if (p.location.radius)
        features.push(
          circle(p.location.position, p.location.radius, "#BFA4E7"),
        );
      else
        marker(
          p.location.position,
          p.team === "lime" ? "#729D4B" : "#6269F5",
          p.name,
        );
    }
  });
  if (selection) marker(selection, "#E87B35", "Selected");
  return { type: "FeatureCollection", features };
}

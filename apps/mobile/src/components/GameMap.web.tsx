// SPDX-License-Identifier: AGPL-3.0-only
import React, { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import * as maplibregl from "maplibre-gl";
import type { GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { mapData, mapStyle, type GameMapProps } from "../services/map-data";
import { Txt } from "./ui";
export default function GameMap(props: GameMapProps) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const pick = useRef(props.onPick);
  pick.current = props.onPick;
  const [error, setError] = useState(false);
  const current = useRef(props);
  current.current = props;
  useEffect(() => {
    if (!el.current) return;
    const m = new maplibregl.Map({
      container: el.current,
      style: mapStyle,
      center: [props.arena.center.longitude, props.arena.center.latitude],
      zoom: 15,
      attributionControl: { compact: true },
    });
    map.current = m;
    m.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "top-right",
    );
    m.on("error", () => setError(true));
    m.on("load", () => {
      setError(false);
      m.addSource("game", { type: "geojson", data: mapData(current.current) });
      m.addLayer({
        id: "zone-fill",
        type: "fill",
        source: "game",
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: { "fill-color": ["get", "color"], "fill-opacity": 0.12 },
      });
      m.addLayer({
        id: "zone-line",
        type: "line",
        source: "game",
        filter: ["==", ["geometry-type"], "Polygon"],
        paint: {
          "line-color": ["get", "color"],
          "line-width": 2,
          "line-dasharray": [3, 2],
        },
      });
      m.addLayer({
        id: "markers",
        type: "circle",
        source: "game",
        filter: ["==", ["geometry-type"], "Point"],
        paint: {
          "circle-color": ["get", "color"],
          "circle-radius": 8,
          "circle-stroke-color": "white",
          "circle-stroke-width": 3,
        },
      });
      m.addLayer({
        id: "labels",
        type: "symbol",
        source: "game",
        filter: ["==", ["geometry-type"], "Point"],
        layout: {
          "text-field": ["get", "label"],
          "text-size": 12,
          "text-offset": [0, 1.6],
        },
        paint: {
          "text-color": "#292C42",
          "text-halo-color": "white",
          "text-halo-width": 2,
        },
      });
    });
    m.on("click", (e) =>
      pick.current?.({ latitude: e.lngLat.lat, longitude: e.lngLat.lng }),
    );
    return () => {
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const m = map.current;
    (m?.getSource("game") as GeoJSONSource | undefined)?.setData(
      mapData(props),
    );
  }, [props]);
  useEffect(() => {
    map.current?.jumpTo({
      center: [props.arena.center.longitude, props.arena.center.latitude],
    });
  }, [props.arena.center.latitude, props.arena.center.longitude]);
  return (
    <View
      style={{
        height: props.height ?? 360,
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#DDE3D8",
      }}
    >
      <div
        ref={el}
        style={{ width: "100%", height: "100%" }}
        aria-label="Game arena map"
      />
      {error && (
        <View
          style={{
            position: "absolute",
            left: 12,
            right: 50,
            bottom: 30,
            backgroundColor: "#171B30",
            padding: 10,
            borderRadius: 8,
          }}
        >
          <Txt color="white" size={12}>
            Map tiles unavailable. GPS and game rules continue; reconnect for
            map detail.
          </Txt>
        </View>
      )}
    </View>
  );
}

// SPDX-License-Identifier: AGPL-3.0-only
import React from "react";
import { View } from "react-native";
import {
  Map,
  Camera,
  GeoJSONSource,
  Layer,
} from "@maplibre/maplibre-react-native";
import { mapData, mapStyle, type GameMapProps } from "../services/map-data";
export default function GameMap(props: GameMapProps) {
  return (
    <View
      style={{
        height: props.height ?? 360,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      <Map
        style={{ flex: 1 }}
        mapStyle={mapStyle}
        onPress={(e) =>
          props.onPick?.({
            latitude: e.nativeEvent.lngLat[1],
            longitude: e.nativeEvent.lngLat[0],
          })
        }
      >
        <Camera
          center={[props.arena.center.longitude, props.arena.center.latitude]}
          zoom={15}
        />
        <GeoJSONSource id="game" data={mapData(props)}>
          <Layer
            id="zones"
            type="fill"
            filter={["==", ["geometry-type"], "Polygon"]}
            paint={{ "fill-color": ["get", "color"], "fill-opacity": 0.12 }}
          />
          <Layer
            id="boundaries"
            type="line"
            filter={["==", ["geometry-type"], "Polygon"]}
            paint={{
              "line-color": ["get", "color"],
              "line-width": 2,
              "line-dasharray": [3, 2],
            }}
          />
          <Layer
            id="markers"
            type="circle"
            filter={["==", ["geometry-type"], "Point"]}
            paint={{
              "circle-color": ["get", "color"],
              "circle-radius": 8,
              "circle-stroke-color": "white",
              "circle-stroke-width": 3,
            }}
          />
        </GeoJSONSource>
      </Map>
    </View>
  );
}

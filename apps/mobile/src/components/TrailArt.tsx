// SPDX-License-Identifier: AGPL-3.0-only
import React from "react";
import Svg, {
  Path,
  Rect,
  Circle,
  G,
  Ellipse,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from "react-native-svg";
export default function TrailArt({
  mode = "treasure",
  small = false,
}: {
  mode?: string;
  small?: boolean;
}) {
  const color =
    mode === "manhunt"
      ? "#F49BAD"
      : mode === "domination"
        ? "#C4EF9A"
        : mode === "smugglers"
          ? "#94D9EB"
          : "#C4EF9A";
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 540 390"
      accessibilityLabel="Decorative illustrated game map, not live player data"
      role="img"
    >
      <Defs>
        <LinearGradient id="terrain" x2="1" y2="1">
          <Stop stopColor="#2B3148" />
          <Stop offset="1" stopColor="#23283C" />
        </LinearGradient>
      </Defs>
      <G transform="translate(25 20) rotate(-8 245 175)">
        <Path
          d="M20 95 175 25 325 80 465 25 510 300 350 365 175 315 30 370Z"
          fill="url(#terrain)"
          stroke="#444A62"
          strokeWidth="1.5"
        />
        <Path
          d="m175 25 0 290m150-235 25 285"
          stroke="#474E66"
          strokeWidth="1"
        />
        <Path
          d="M30 310c100-90 80-80 180-90s160-115 295-70"
          fill="none"
          stroke="#536080"
          strokeWidth="24"
        />
        <Path
          d="M30 310c100-90 80-80 180-90s160-115 295-70"
          fill="none"
          stroke="#626F91"
          strokeWidth="10"
        />
        <Path
          d="M34 155c125 35 98 160 240 105S380 80 490 80"
          fill="none"
          stroke="#3B435E"
          strokeWidth="12"
        />
        <G fill="#354A43" stroke="#4C6252" strokeWidth="1">
          <Ellipse cx="120" cy="135" rx="58" ry="35" />
          <Ellipse cx="350" cy="265" rx="74" ry="48" />
          <Ellipse cx="392" cy="101" rx="40" ry="30" />
        </G>
        <G fill="#425C4A">
          <Path d="m89 127 12-24 12 24Zm30 18 12-24 12 24Zm246 112 12-24 12 24Zm-44 28 12-24 12 24Z" />
        </G>
        <Circle
          cx="289"
          cy="166"
          r="94"
          stroke={color}
          strokeOpacity=".3"
          fill={color}
          fillOpacity=".035"
          strokeDasharray="5 6"
        />
        <Circle
          cx="289"
          cy="166"
          r="63"
          stroke={color}
          strokeOpacity=".25"
          fill="none"
        />
        <Path
          d="M106 270c-10-65 127-22 121-86s79-74 92-62"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="2 9"
        />
        <Circle
          cx="106"
          cy="270"
          r="15"
          fill="#6269F5"
          stroke="#C4C7FF"
          strokeWidth="3"
        />
        <Circle cx="106" cy="270" r="4" fill="#FFF" />
        <G transform="translate(282 119)">
          <Path
            d="M0 43V-18m0 0c25-19 40 17 67-2v42c-26 19-42-17-67 2"
            fill={color}
            stroke={color}
            strokeWidth="5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <Ellipse
            cx="1"
            cy="48"
            rx="18"
            ry="6"
            fill={color}
            fillOpacity=".2"
          />
        </G>
        <G transform="translate(365 178)">
          <Rect width="123" height="45" rx="12" fill="#F1F0FC" />
          <SvgText x="14" y="28" fill="#25283A" fontSize="12" fontWeight="700">
            {mode === "treasure"
              ? "A little closer."
              : mode === "manhunt"
                ? "Stay out of sight."
                : mode === "domination"
                  ? "Hold your ground."
                  : "Special delivery."}
          </SvgText>
        </G>
      </G>
      <G transform="translate(460 322)" stroke="#A5ADC3" fill="none">
        <Circle r="22" />
        <Path d="m0-14 6 20-6-4-6 4Z" fill="#A5ADC3" />
      </G>
    </Svg>
  );
}

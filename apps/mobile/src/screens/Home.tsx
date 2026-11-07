// SPDX-License-Identifier: AGPL-3.0-only
import React from "react";
import { View, Pressable, useWindowDimensions } from "react-native";
import { MODES, type Mode } from "@fieldplay/engine";
import {
  Badge,
  Button,
  Card,
  Icon,
  Row,
  Section,
  Txt,
  useTheme,
  type IconName,
} from "../components/ui";
import TrailArt from "../components/TrailArt";
import type { RecentParty } from "../hooks/useGame";
export function ModeCard({
  mode,
  onPlay,
  favorite,
  onFavorite,
}: {
  mode: (typeof MODES)[number];
  onPlay: () => void;
  favorite?: boolean;
  onFavorite?: () => void;
}) {
  const t = useTheme();
  return (
    <Card
      style={{ flexGrow: 1, flexBasis: 245, padding: 0, overflow: "hidden" }}
    >
      <View
        style={{ height: 160, backgroundColor: "#232839", overflow: "hidden" }}
      >
        <TrailArt mode={mode.id} small />
        {onFavorite && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${favorite ? "Unfavorite" : "Favorite"} ${mode.name}`}
            onPress={onFavorite}
            style={{
              position: "absolute",
              right: 12,
              top: 12,
              padding: 10,
              backgroundColor: "#161A28",
              borderRadius: 30,
            }}
          >
            <Icon
              name="heart"
              color={favorite ? "#FC8A9D" : "#BFC4D8"}
              size={17}
            />
          </Pressable>
        )}
      </View>
      <View style={{ padding: 21, gap: 13 }}>
        <Txt
          size={10}
          weight="700"
          color={t.muted}
          style={{ letterSpacing: 1.5 }}
        >
          {mode.tags}
        </Txt>
        <Txt size={21} weight="700">
          {mode.name}
        </Txt>
        <Txt size={13} color={t.muted}>
          {mode.description}
        </Txt>
        <Row style={{ justifyContent: "space-between", marginTop: 6 }}>
          <Row style={{ gap: 6 }}>
            <Icon name="users" size={14} color={t.muted} />
            <Txt size={12} color={t.muted}>
              {mode.players} players
            </Txt>
          </Row>
          <Button
            label="Play"
            icon="arrow-up-right"
            kind="secondary"
            small
            onPress={onPlay}
          />
        </Row>
      </View>
    </Card>
  );
}
export default function Home({
  host,
  join,
  recent,
  joinRecent,
  games,
  info,
  favorites,
  toggleFavorite,
}: {
  host: (m?: Mode) => void;
  join: () => void;
  recent: RecentParty[];
  joinRecent: (p: RecentParty) => void;
  games: () => void;
  info: () => void;
  favorites: string[];
  toggleFavorite: (m: Mode) => void;
}) {
  const t = useTheme();
  const wide = useWindowDimensions().width > 1000;
  return (
    <View style={{ gap: 34 }}>
      <Row style={{ justifyContent: "space-between", alignItems: "flex-end" }}>
        <View style={{ gap: 8, flex: 1, minWidth: 0 }}>
          <Txt
            size={11}
            color={t.lime}
            weight="700"
            style={{ letterSpacing: 2 }}
          >
            OUTSIDE IS THE PLAYGROUND
          </Txt>
          <Txt size={wide ? 36 : 29} weight="700" style={{ letterSpacing: -1 }}>
            A little less screen. A lot more adventure.
          </Txt>
          <Txt color={t.muted}>
            Your friends. Your neighborhood. A whole new way to play.
          </Txt>
        </View>
      </Row>
      <View
        style={{
          borderRadius: 24,
          backgroundColor: "#262A43",
          borderWidth: 1,
          borderColor: "#3D4265",
          overflow: "hidden",
          flexDirection: wide ? "row" : "column",
        }}
      >
        <View
          style={{
            flex: 1,
            padding: wide ? 36 : 25,
            gap: 20,
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <Badge
            text="THE FIRST ADVENTURE"
            color="#C4EF9A"
            background="#1C2133"
          />
          <Txt
            size={wide ? 49 : 39}
            weight="700"
            color="#FFF"
            style={{ letterSpacing: -1.8, lineHeight: wide ? 55 : 45 }}
          >
            Find a secret.{`\n`}Make a memory.
          </Txt>
          <Txt color="#BEC2DB" size={15} style={{ maxWidth: 360 }}>
            Hide a treasure. Swap clues with friends. Turn a familiar place into
            an adventure.
          </Txt>
          <Row>
            <Button
              label="Host Treasure Hunt"
              onPress={() => host("treasure")}
              icon="plus"
            />
            <Button
              label="How it works"
              kind="secondary"
              onPress={info}
              icon="arrow-right"
            />
          </Row>
          <Row style={{ gap: 18, marginTop: 6 }}>
            <Row style={{ gap: 6 }}>
              <Icon name="users" size={14} color="#C4C8DF" />
              <Txt size={12} color="#C4C8DF">
                2–20 friends
              </Txt>
            </Row>
            <Row style={{ gap: 6 }}>
              <Icon name="clock" size={14} color="#C4C8DF" />
              <Txt size={12} color="#C4C8DF">
                Your pace, your rules
              </Txt>
            </Row>
          </Row>
        </View>
        <View
          style={{
            width: wide ? "46%" : "100%",
            height: wide ? 365 : 260,
            justifyContent: "center",
          }}
        >
          <TrailArt />
        </View>
      </View>
      <Row style={{ gap: 16 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Host a game"
          onPress={() => host()}
          style={({ pressed }) => ({
            flex: 1,
            minWidth: 210,
            backgroundColor: t.panel,
            borderWidth: 1,
            borderColor: t.line,
            borderRadius: 17,
            padding: 22,
            flexDirection: "row",
            alignItems: "center",
            gap: 17,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <View
            style={{
              backgroundColor: "#34345B",
              padding: 13,
              borderRadius: 13,
            }}
          >
            <Icon name="plus" color="#C4C5FF" size={23} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt weight="700" size={18}>
              Host a game
            </Txt>
            <Txt size={12} color={t.muted}>
              Gather your people. Set the rules.
            </Txt>
          </View>
          <Icon name="arrow-up-right" color={t.muted} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Join your friends"
          onPress={join}
          style={({ pressed }) => ({
            flex: 1,
            minWidth: 210,
            backgroundColor: t.panel,
            borderWidth: 1,
            borderColor: t.line,
            borderRadius: 17,
            padding: 22,
            flexDirection: "row",
            alignItems: "center",
            gap: 17,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <View
            style={{
              backgroundColor: "#2C3E39",
              padding: 13,
              borderRadius: 13,
            }}
          >
            <Icon name="log-in" color="#C4EF9A" size={23} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt weight="700" size={18}>
              Join your friends
            </Txt>
            <Txt size={12} color={t.muted}>
              Have an invite? You’re in.
            </Txt>
          </View>
          <Icon name="arrow-up-right" color={t.muted} />
        </Pressable>
      </Row>
      <View style={{ gap: 18 }}>
        <Row style={{ justifyContent: "space-between" }}>
          <View>
            <Txt size={24} weight="700">
              Pick your kind of outside
            </Txt>
            <Txt size={13} color={t.muted}>
              One map. Different ways to play.
            </Txt>
          </View>
          <Button
            label="All games"
            kind="ghost"
            icon="arrow-right"
            onPress={games}
            small
          />
        </Row>
        <Row style={{ alignItems: "stretch", gap: 18 }}>
          {MODES.slice(1).map((m) => (
            <ModeCard
              key={m.id}
              mode={m}
              onPlay={() => host(m.id)}
              favorite={favorites.includes(m.id)}
              onFavorite={() => toggleFavorite(m.id)}
            />
          ))}
        </Row>
      </View>
      <View style={{ gap: 16 }}>
        <Txt size={23} weight="700">
          Back to your people
        </Txt>
        {recent.length ? (
          <Row style={{ alignItems: "stretch" }}>
            {recent.slice(0, 3).map((p) => (
              <Card key={p.code} style={{ flex: 1, minWidth: 210 }}>
                <Row>
                  <Icon name="users" color={t.lime} />
                  <Txt weight="600">{p.name}</Txt>
                </Row>
                <Txt size={12} color={t.muted}>
                  Last visited {new Date(p.at).toLocaleDateString()}
                </Txt>
                <Button
                  label="Rejoin party"
                  onPress={() => joinRecent(p)}
                  kind="secondary"
                  small
                />
              </Card>
            ))}
          </Row>
        ) : (
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
            <Icon name="users" size={25} color={t.muted} />
            <View style={{ flex: 1 }}>
              <Txt weight="600">Good adventures start with good company.</Txt>
              <Txt size={13} color={t.muted}>
                Your recent parties will be right here after your first game.
              </Txt>
            </View>
          </Card>
        )}
      </View>
      <Row style={{ justifyContent: "space-between", paddingBottom: 12 }}>
        <Row style={{ gap: 7 }}>
          <Icon name="shield" size={14} color={t.muted} />
          <Txt size={12} color={t.muted}>
            Private by default. Only share when you play.
          </Txt>
        </Row>
        <Txt size={11} color={t.muted}>
          AN OPENRECODE PROJECT ↗
        </Txt>
      </Row>
    </View>
  );
}

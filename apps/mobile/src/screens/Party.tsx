// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from "react";
import { View, Share, Platform } from "react-native";
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import { MODES, type View as GameView } from "@fieldplay/engine";
import {
  Badge,
  Button,
  Card,
  Disclosure,
  Field,
  Icon,
  Row,
  Txt,
  useTheme,
} from "../components/ui";
import GameMap from "../components/GameMap";
import Scanner from "../components/Scanner";
import ArenaEditor from "./ArenaEditor";
import type { Game } from "../hooks/useGame";
export default function Party({
  game,
  server,
  openHost,
  openJoin,
}: {
  game: Game;
  server: string;
  openHost: () => void;
  openJoin: () => void;
}) {
  const t = useTheme();
  const v = game.view;
  const self = game.self;
  const [editor, setEditor] = useState(false);
  const [chat, setChat] = useState("");
  const [clue, setClue] = useState("");
  const [kind, setKind] = useState<"virtual" | "physical" | "qr">("qr");
  const [code, setCode] = useState("");
  const [scanner, setScanner] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [invite, setInvite] = useState(false);
  const [qr, setQR] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<string>();
  if (!v || !self)
    return (
      <View style={{ gap: 24 }}>
        <Txt size={32} weight="700">
          Better together.
        </Txt>
        <Card>
          <Icon name="users" size={36} color={t.lime} />
          <Txt size={22} weight="700">
            Your next party starts here
          </Txt>
          <Txt color={t.muted}>
            Host a private game or join friends with their invite code. No
            account required.
          </Txt>
          <Row>
            <Button label="Create a party" icon="plus" onPress={openHost} />
            <Button
              label="Join a party"
              kind="secondary"
              icon="log-in"
              onPress={openJoin}
            />
          </Row>
        </Card>
        {game.saved && (
          <Card>
            <Txt weight="600">Resume a saved private session</Txt>
            <Txt size={13} color={t.muted}>
              Sessions expire after six hours. A restarted host cannot recover
              hidden state.
            </Txt>
            <Button
              label="Reconnect saved session"
              onPress={() => {
                void game
                  .connect({
                    ...game.saved!,
                    operation: "resume",
                    code: game.saved!.credentials.code,
                  })
                  .catch((e) => game.report(e.message));
              }}
            />
          </Card>
        )}
      </View>
    );
  const host = v.hostId === self.id || v.cohosts.includes(self.id);
  const mode = MODES.find((m) => m.id === v.config.mode)!;
  const inviteLink = `fieldplay://join?server=${encodeURIComponent(server)}&code=${game.credentials!.code}`;
  const share = async () => {
    try {
      if (Platform.OS === "web") {
        await Clipboard.setStringAsync(inviteLink);
        game.report("Invite copied. Share it only with people you trust.");
      } else
        await Share.share({
          message: `Join my private Fieldplay party: ${inviteLink}`,
        });
    } catch (e) {
      game.report("Unable to share the invitation.");
    }
  };
  const verify = (raw: string) => {
    const token = raw.replace(/^fieldplay:treasure:/, "").trim();
    setCode(token);
    game.send({ type: "verify", code: token });
    setScanner(false);
  };
  const time = `${Math.floor(v.remaining / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(v.remaining % 60)
    .toString()
    .padStart(2, "0")}`;
  if (editor)
    return (
      <ArenaEditor
        initial={v.config}
        onSave={(config) => game.send({ type: "configure", config })}
        onClose={() => setEditor(false)}
        report={game.report}
      />
    );
  return (
    <View style={{ gap: 22 }}>
      <Row style={{ justifyContent: "space-between" }}>
        <View style={{ gap: 5 }}>
          <Badge
            text={v.phase === "lobby" ? "PRIVATE LOBBY" : v.phase.toUpperCase()}
          />
          <Txt size={31} weight="700">
            {v.name}
          </Txt>
          <Txt color={t.muted}>
            {mode.name} · {game.status.transport} · {v.players.length} players
          </Txt>
        </View>
        <Row>
          <Button
            label="Invite friends"
            icon="user-plus"
            kind="secondary"
            onPress={() => setInvite(!invite)}
          />
          <Button
            label="Leave"
            icon="log-out"
            kind="ghost"
            onPress={() => setLeaving(true)}
          />
        </Row>
      </Row>
      {leaving && (
        <Card>
          <Txt>
            Leave this party? Your location sharing stops immediately. An active
            match ends safely for everyone.
          </Txt>
          <Row>
            <Button
              label="Leave party now"
              kind="danger"
              onPress={() => {
                void game.leave();
                setLeaving(false);
              }}
            />
            <Button
              label="Stay in party"
              kind="secondary"
              onPress={() => setLeaving(false)}
            />
          </Row>
        </Card>
      )}
      {invite && (
        <Card>
          <Txt size={19} weight="600">
            Bring your people
          </Txt>
          <Txt size={12} color={t.muted}>
            Invite code · expires six hours after party creation
          </Txt>
          <Txt size={16} weight="700" style={{ letterSpacing: 1 }}>
            {game.credentials!.code}
          </Txt>
          <View
            style={{
              backgroundColor: "white",
              padding: 18,
              alignSelf: "flex-start",
              borderRadius: 14,
            }}
          >
            <QRCode value={inviteLink} size={170} />
          </View>
          <Row>
            <Button
              label="Share invitation"
              icon="share-2"
              onPress={() => {
                void share();
              }}
            />
            <Button
              label="Copy invite code"
              kind="secondary"
              onPress={() => {
                void Clipboard.setStringAsync(game.credentials!.code);
              }}
            />
          </Row>
          <Txt size={12} color={t.muted}>
            Server: {server}. Joining never starts GPS sharing.
          </Txt>
        </Card>
      )}
      {game.status.connection !== "connected" && (
        <Card>
          <Txt>{game.status.message}</Txt>
          <Button
            label="Reconnect"
            onPress={() => {
              void game
                .connect({ server, name: self.name, operation: "resume" })
                .catch((e) => game.report(e.message));
            }}
          />
        </Card>
      )}
      {v.phase === "finished" ? (
        <Card>
          <Icon name="award" color={t.lime} size={40} />
          <Txt size={29} weight="700">
            {v.winner}
          </Txt>
          <Txt color={t.muted}>
            That’s a wrap. Your location is no longer being shared.
          </Txt>
          {[...v.players]
            .sort((a, b) => b.score - a.score)
            .map((p, i) => (
              <Row key={p.id} style={{ justifyContent: "space-between" }}>
                <Txt>
                  {i + 1}. {p.name}
                </Txt>
                <Txt weight="700">{p.score} pts</Txt>
              </Row>
            ))}
          {host && (
            <Button
              label="Play another round"
              icon="rotate-ccw"
              onPress={() => game.send({ type: "replay" })}
            />
          )}
        </Card>
      ) : (
        <>
          {v.phase === "lobby" && (
            <>
              <Card>
                <Row style={{ justifyContent: "space-between" }}>
                  <View>
                    <Txt size={21} weight="700">
                      The playing field
                    </Txt>
                    <Txt size={13} color={t.muted}>
                      {Math.round(v.config.arena.radius)} m radius ·{" "}
                      {v.config.duration / 60} min ·{" "}
                      {v.config.checkpoints.length} checkpoints
                    </Txt>
                  </View>
                  {host && (
                    <Button
                      label="Edit arena & rules"
                      kind="secondary"
                      icon="sliders"
                      small
                      onPress={() => setEditor(true)}
                    />
                  )}
                </Row>
                <GameMap arena={v.config.arena} view={v} height={260} />
                <Txt size={12} color={t.muted}>
                  The starting area is host selected. Inspect the venue
                  together; never enter roads, restricted areas or unsafe
                  terrain.
                </Txt>
              </Card>
              <Card>
                <Row>
                  <Icon name="shield" color={t.lime} />
                  <Txt size={20} weight="600">
                    Your location, your choice
                  </Txt>
                </Row>
                <Txt size={14}>
                  Share location only for this private game. Exact GPS goes to
                  the{" "}
                  {game.credentials?.authority === "peer"
                    ? "trusted player host"
                    : "private game authority"}
                  ; other players receive only the information allowed by the
                  mode.
                </Txt>
                <Txt size={13} color={t.muted}>
                  Treasure Hunt hides other players. Team games share live
                  teammate positions and delayed approximate opponents. The host
                  can access authoritative secrets. Direct peer links can reveal
                  your network address. Play on foot, without contact, and stop
                  whenever you need.
                </Txt>
                <Button
                  label={
                    self.consent
                      ? "Stop location sharing"
                      : "I accept the game & location rules"
                  }
                  kind={self.consent ? "secondary" : "primary"}
                  icon={self.consent ? "map-pin" : "check-circle"}
                  onPress={() =>
                    self.consent
                      ? game.stop()
                      : game.send({ type: "consent", accepted: true })
                  }
                />
                <Txt size={12} color={t.muted}>
                  {game.gps}
                </Txt>
              </Card>
              {v.config.mode === "treasure" && (
                <Card>
                  <Txt size={21} weight="700">
                    Leave a little mystery
                  </Txt>
                  <Txt size={13} color={t.muted}>
                    Stand at your treasure’s safe outdoor position. Register it
                    using your current GPS, then leave the QR code or secret
                    verification code with the object.
                  </Txt>
                  <Field
                    label="A clue for the hunter"
                    placeholder="Look where the old tree meets the path…"
                    value={clue}
                    onChangeText={setClue}
                    maxLength={300}
                    multiline
                  />
                  <Row>
                    {(["qr", "physical", "virtual"] as const).map((k) => (
                      <Button
                        key={k}
                        label={`${kind === k ? "✓ " : ""}${k}`}
                        kind="secondary"
                        small
                        onPress={() => setKind(k)}
                      />
                    ))}
                  </Row>
                  <Button
                    label={
                      v.ownTreasure
                        ? "Replace my treasure"
                        : "Register treasure at my GPS"
                    }
                    icon="map-pin"
                    disabled={!game.sample || !self.consent}
                    onPress={() =>
                      game.send({
                        type: "treasure",
                        position: game.sample!,
                        clue,
                        kind,
                      })
                    }
                  />
                  {v.ownTreasure && (
                    <>
                      <Badge text="YOUR TREASURE IS REGISTERED" />
                      <Txt size={13}>{v.ownTreasure.clue}</Txt>
                      <Button
                        label={
                          qr ? "Hide verification QR" : "Show my treasure QR"
                        }
                        kind="secondary"
                        onPress={() => setQR(!qr)}
                      />
                      {qr && (
                        <>
                          <View
                            style={{
                              backgroundColor: "white",
                              padding: 18,
                              alignSelf: "flex-start",
                              borderRadius: 12,
                            }}
                          >
                            <QRCode
                              value={`fieldplay:treasure:${v.ownTreasure.code}`}
                              size={180}
                            />
                          </View>
                          <Txt size={12}>{v.ownTreasure.code}</Txt>
                          <Button
                            label="Copy my treasure code"
                            kind="ghost"
                            onPress={() => {
                              void Clipboard.setStringAsync(
                                v.ownTreasure!.code,
                              );
                            }}
                          />
                        </>
                      )}
                      <Txt size={12} color={t.muted}>
                        Do not send this code to the hunter before discovery.
                        Even virtual treasures require an owner-provided
                        verification code.
                      </Txt>
                    </>
                  )}
                </Card>
              )}
            </>
          )}
          {["return", "active", "paused"].includes(v.phase) && (
            <>
              <Row style={{ justifyContent: "space-between" }}>
                <Card style={{ flex: 1, minWidth: 180 }}>
                  <Txt color={t.muted} size={11}>
                    MATCH CLOCK
                  </Txt>
                  <Txt size={36} weight="700">
                    {time}
                  </Txt>
                </Card>
                <Card style={{ flex: 1, minWidth: 180 }}>
                  <Txt color={t.muted} size={11}>
                    YOUR ROLE
                  </Txt>
                  <Txt size={23} weight="700">
                    {v.config.mode === "treasure"
                      ? "Treasure hunter"
                      : self.team === "violet"
                        ? v.config.mode === "smugglers"
                          ? "Customs"
                          : v.config.mode === "domination"
                            ? "Violet team"
                            : "Hunter"
                        : v.config.mode === "domination"
                          ? "Lime team"
                          : "Runner / Courier"}
                  </Txt>
                  <Txt size={13} color={t.muted}>
                    {self.score} pts · {game.gps}
                  </Txt>
                </Card>
              </Row>
              <GameMap arena={v.config.arena} view={v} height={380} />
              {self.outsideSince && (
                <Txt color="#F49BAD">
                  Return inside the survival zone. You are eliminated after 30
                  seconds outside. Never cross unsafe terrain to stay in the
                  game.
                </Txt>
              )}
              {v.survival && (
                <Txt size={13} color={t.lime}>
                  Stay inside the survival boundary ·{" "}
                  {Math.round(v.survival.radius)} m radius
                </Txt>
              )}
              {v.phase === "return" && (
                <Card>
                  <Txt size={23} weight="700">
                    Back to the beginning
                  </Txt>
                  <Txt color={t.muted}>
                    Return to the starting area marked on your map. The hunt
                    starts once everyone has checked in.
                  </Txt>
                  <Button
                    label={
                      self.returned
                        ? "Checked in — waiting for friends"
                        : "I’m back at the starting area"
                    }
                    disabled={self.returned}
                    icon="flag"
                    onPress={() => game.send({ type: "returned" })}
                  />
                </Card>
              )}
              {v.phase === "paused" && (
                <Card>
                  <Txt size={23} weight="700">
                    Take a breather.
                  </Txt>
                  <Txt>
                    Location transmission is paused. Check everyone is safe
                    before resuming.
                  </Txt>
                  {!self.consent && (
                    <Button
                      label="Accept sharing again"
                      onPress={() =>
                        game.send({ type: "consent", accepted: true })
                      }
                    />
                  )}
                  {host && (
                    <Button
                      label="Resume match"
                      icon="play"
                      onPress={() => game.send({ type: "resume" })}
                    />
                  )}
                </Card>
              )}
              {v.phase === "active" && (
                <>
                  {v.assignment && (
                    <Card>
                      <Badge text="YOUR SECRET OBJECTIVE" />
                      <Txt size={25} weight="700">
                        Follow the clue
                      </Txt>
                      <Txt size={18}>{v.assignment.clue}</Txt>
                      <Txt size={13} color={t.muted}>
                        Search inside the amber circle ·{" "}
                        {Math.round(v.assignment.zone?.radius ?? 0)} m. Its
                        center is deliberately offset from the treasure.
                      </Txt>
                      {v.assignment.found ? (
                        <Badge text="TREASURE VERIFIED" />
                      ) : (
                        <>
                          <Field
                            label="Treasure verification code"
                            value={code}
                            onChangeText={setCode}
                            autoCapitalize="none"
                          />
                          <Row>
                            <Button
                              label="Verify discovery"
                              icon="check-circle"
                              onPress={() => verify(code)}
                            />
                            <Button
                              label="Scan treasure QR"
                              icon="camera"
                              kind="secondary"
                              onPress={() => setScanner(true)}
                            />
                          </Row>
                        </>
                      )}
                    </Card>
                  )}
                  {scanner && (
                    <Card>
                      <Scanner
                        onCode={verify}
                        onClose={() => setScanner(false)}
                      />
                    </Card>
                  )}
                  {v.config.mode === "domination" && (
                    <Card>
                      <Txt size={22} weight="700">
                        Hold your ground
                      </Txt>
                      <Txt size={13} color={t.muted}>
                        Stay at a checkpoint for three accurate samples spanning
                        five seconds. Claim four times, five seconds apart, to
                        take control.
                      </Txt>
                      {v.config.checkpoints.map((_, i) => (
                        <Row
                          key={i}
                          style={{ justifyContent: "space-between" }}
                        >
                          <Txt>
                            Checkpoint {i + 1} ·{" "}
                            {v.checkpoints[i]?.owner ?? "Neutral"} ·{" "}
                            {v.checkpoints[i]?.progress ?? 0}%
                          </Txt>
                          <Button
                            label={`Claim ${i + 1}`}
                            small
                            kind="secondary"
                            onPress={() =>
                              game.send({ type: "claim", checkpoint: i })
                            }
                          />
                        </Row>
                      ))}
                    </Card>
                  )}
                  {v.config.mode === "smugglers" && self.team === "lime" && (
                    <Card>
                      <Txt size={22} weight="700">
                        {self.cargo
                          ? "Keep the delivery quiet."
                          : "Your next package awaits."}
                      </Txt>
                      <Txt color={t.muted}>
                        Point 1: collect sealed cargo. Point 2: deliver. No
                        physical contact or vehicle pursuit.
                      </Txt>
                      <Button
                        label={
                          self.cargo
                            ? "Deliver cargo at point 2"
                            : "Collect cargo at point 1"
                        }
                        icon="package"
                        onPress={() =>
                          game.send({ type: self.cargo ? "deliver" : "pickup" })
                        }
                      />
                    </Card>
                  )}
                  {self.team === "violet" &&
                    ["manhunt", "smugglers"].includes(v.config.mode) && (
                      <Card>
                        <Txt size={22} weight="700">
                          Request a safe encounter
                        </Txt>
                        <Txt size={13} color={t.muted}>
                          Stand near the runner and ask for confirmation. GPS
                          alone never counts as a capture.
                        </Txt>
                        {v.players
                          .filter(
                            (p) =>
                              p.team !== self.team &&
                              !p.captured &&
                              !p.eliminated,
                          )
                          .map((p) => (
                            <Button
                              key={p.id}
                              label={`Request confirmation from ${p.name}`}
                              small
                              kind="secondary"
                              onPress={() =>
                                game.send({ type: "capture", target: p.id })
                              }
                            />
                          ))}
                      </Card>
                    )}
                  {v.interactions
                    .filter((i) => i.target === self.id)
                    .map((i) => (
                      <Card key={i.id}>
                        <Txt size={20} weight="600">
                          Confirm a non-contact encounter?
                        </Txt>
                        <Txt>
                          {v.players.find((p) => p.id === i.actor)?.name} is
                          requesting confirmation. Accept only if the encounter
                          actually happened safely.
                        </Txt>
                        <Button
                          label="Confirm this encounter"
                          onPress={() =>
                            game.send({ type: "confirm", interactionId: i.id })
                          }
                        />
                      </Card>
                    ))}
                  <Disclosure title="Tactical abilities">
                    <Txt size={13}>
                      Three charges per ability. Effects last 15 seconds, with a
                      60-second cooldown. The authority checks your role and
                      eligibility.
                    </Txt>
                    <Row>
                      {(
                        [
                          "scanner",
                          "radar",
                          "ghost",
                          "decoy",
                          "shield",
                          "rescue",
                          "jammer",
                          "proximity",
                        ] as const
                      ).map((a) => (
                        <Button
                          key={a}
                          label={`${a} (${self.abilities?.[a]?.charges ?? 3})`}
                          small
                          kind="secondary"
                          onPress={() =>
                            game.send({ type: "ability", ability: a })
                          }
                        />
                      ))}
                    </Row>
                    {v.proximity !== undefined && (
                      <Txt>{v.proximity} opponents detected within 100 m.</Txt>
                    )}
                  </Disclosure>
                  <Row>
                    <Button
                      label="Safety pause"
                      icon="pause"
                      kind="secondary"
                      onPress={() => game.send({ type: "pause" })}
                    />
                    <Button
                      label="Stop sharing now"
                      icon="slash"
                      kind="danger"
                      onPress={game.stop}
                    />
                    {host && (
                      <Button
                        label="End match"
                        kind="ghost"
                        onPress={() => game.send({ type: "end" })}
                      />
                    )}
                  </Row>
                </>
              )}
            </>
          )}
        </>
      )}
      <Card>
        <Row style={{ justifyContent: "space-between" }}>
          <Txt size={22} weight="700">
            The party
          </Txt>
          <Badge
            text={`${v.players.filter((p) => p.ready).length}/${v.players.length} READY`}
          />
        </Row>
        {v.players.map((p) => (
          <Row
            key={p.id}
            style={{
              justifyContent: "space-between",
              borderBottomWidth: 1,
              borderBottomColor: t.line,
              paddingBottom: 12,
            }}
          >
            <Row>
              <View
                style={{
                  height: 39,
                  width: 39,
                  borderRadius: 13,
                  backgroundColor: p.team === "lime" ? "#3D503B" : "#3C3D69",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Txt color="#FFF" weight="700">
                  {p.name.slice(0, 2).toUpperCase()}
                </Txt>
              </View>
              <View>
                <Txt weight="600">
                  {p.name}
                  {p.id === self.id ? " (you)" : ""}
                </Txt>
                <Txt size={11} color={t.muted}>
                  {p.id === v.hostId
                    ? "Host · "
                    : v.cohosts.includes(p.id)
                      ? "Co-host · "
                      : ""}
                  {p.connected ? "Connected" : "Disconnected"}
                  {p.captured
                    ? " · Captured"
                    : p.eliminated
                      ? " · Eliminated"
                      : ""}
                  {p.location
                    ? ` · ${p.location.kind} ±${Math.round(p.location.accuracy)} m · ${Math.max(0, Math.round((v.serverTime - p.location.timestamp) / 1000))}s old`
                    : ""}
                </Txt>
              </View>
            </Row>
            <Row>
              <Txt color={p.ready ? t.lime : t.muted} size={12}>
                {p.ready
                  ? "Ready"
                  : v.phase === "lobby"
                    ? "Getting ready"
                    : `${p.score} pts`}
              </Txt>
              {host && v.phase === "lobby" && (
                <Button
                  label={p.team}
                  small
                  kind="secondary"
                  onPress={() =>
                    game.send({
                      type: "team",
                      playerId: p.id,
                      team: p.team === "lime" ? "violet" : "lime",
                    })
                  }
                />
              )}
              {host && p.id !== v.hostId && v.phase === "lobby" && (
                <Button
                  label="Manage"
                  small
                  kind="ghost"
                  onPress={() => setPendingRemoval(p.id)}
                />
              )}
            </Row>
          </Row>
        ))}
        {pendingRemoval && (
          <View style={{ gap: 12 }}>
            <Txt>
              Manage {v.players.find((p) => p.id === pendingRemoval)?.name}
            </Txt>
            <Row>
              <Button
                label="Toggle co-host"
                small
                kind="secondary"
                onPress={() => {
                  game.send({ type: "cohost", playerId: pendingRemoval });
                  setPendingRemoval(undefined);
                }}
              />
              <Button
                label="Kick and ban identity"
                small
                kind="danger"
                onPress={() => {
                  game.send({
                    type: "kick",
                    playerId: pendingRemoval,
                    ban: true,
                  });
                  setPendingRemoval(undefined);
                }}
              />
              <Button
                label="Cancel"
                small
                kind="ghost"
                onPress={() => setPendingRemoval(undefined)}
              />
            </Row>
            <Txt size={12} color={t.muted}>
              Guests can create a new identity. Keep invite codes private.
            </Txt>
          </View>
        )}
        {v.phase === "lobby" && (
          <Row>
            <Button
              label={self.ready ? "Not ready" : "I’m ready"}
              icon="check"
              kind={self.ready ? "secondary" : "primary"}
              onPress={() => game.send({ type: "ready", ready: !self.ready })}
            />
            {host && (
              <Button
                label="Start match"
                icon="play"
                onPress={() => game.send({ type: "start" })}
              />
            )}
          </Row>
        )}
        {v.config.mode !== "treasure" && v.phase === "active" && (
          <Txt size={20} weight="700">
            Violet {Math.floor(v.teamScores.violet)} —{" "}
            {Math.floor(v.teamScores.lime)} Lime
          </Txt>
        )}
      </Card>
      <Disclosure title="Party chat">
        <View style={{ gap: 12 }}>
          {v.chat.map((c) => (
            <View key={c.id}>
              <Txt weight="600" size={12}>
                {c.player}
              </Txt>
              <Txt size={14}>{c.text}</Txt>
            </View>
          ))}
          {!v.chat.length && (
            <Txt size={13} color={t.muted}>
              Say hello before heading out.
            </Txt>
          )}
          <Field
            label="Message the party"
            value={chat}
            onChangeText={setChat}
            maxLength={500}
          />
          <Button
            label="Send message"
            icon="send"
            onPress={() => {
              game.send({ type: "chat", text: chat });
              setChat("");
            }}
          />
        </View>
      </Disclosure>
      <Disclosure title="Match events and integrity report">
        {v.events.map((e, i) => (
          <Txt key={i} size={12}>
            {new Date(e.at).toLocaleTimeString()} · {e.text}
          </Txt>
        ))}
        <Button
          label="Report an integrity concern"
          kind="secondary"
          small
          onPress={() =>
            game.send({
              type: "report",
              text: "Player requested a review of match integrity. Please pause and discuss.",
            })
          }
        />
      </Disclosure>
    </View>
  );
}

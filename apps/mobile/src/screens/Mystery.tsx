import React, { useState } from "react";
import { Card, Txt, Button, Field, Disclosure } from "../components/ui";
import { exportFile } from "../services/files";

const roles = [
  [
    "Ada",
    "Assassina · principale",
    "Gestisci la cantina e conosci il passaggio di servizio.",
    "Nascondi il registro delle consegne. Sostieni di essere stata in cucina.",
  ],
  [
    "Leone",
    "Ispettore · principale",
    "Vittorio ti aveva chiesto di controllare una vendita sospetta.",
    "Ricostruisci tre testimonianze e chiedi al master di confrontare chiave e registro.",
  ],
  [
    "Marta",
    "Aiutante dell’ispettore · principale",
    "Hai visto qualcuno usare la porta di servizio.",
    "Raccogli gli alibi senza mostrare subito la chiave che hai trovato.",
  ],
  [
    "Neri",
    "Sommelier · secondario",
    "Hai sentito discutere Ada e Vittorio del registro.",
    "Proteggi la reputazione della cantina, ma testimonia se interrogato.",
  ],
  [
    "Bianca",
    "Ospite · secondaria",
    "Vittorio ti doveva denaro. Eri a tavola quando si è assentato.",
    "Trova una persona che possa confermare il tuo alibi.",
  ],
  [
    "Elia",
    "Cuoco · secondario",
    "Ada non è entrata in cucina durante il brindisi.",
    "Controlla gli orari e riferisci al master quando scopri una contraddizione.",
  ],
];
const brief =
  "Durante il brindisi, Vittorio lascia il salone per controllare il registro. Il master annuncia che è stato trovato morto nella cantina. Ada è la responsabile: temeva che Vittorio rivelasse una vendita falsa. La chiave trovata da Marta apre il passaggio e il registro collega Ada alla vendita.";
const phases = [
  "Presentazioni e brindisi",
  "Scoperta del delitto",
  "Indagine",
  "Accuse e soluzione",
];
export default function Mystery() {
  const [phase, setPhase] = useState(0);
  const [report, setReport] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [error, setError] = useState("");
  async function download(name: string, content: string) {
    try {
      await exportFile(name, content, "text/markdown");
      setError("");
    } catch {
      setError("Impossibile esportare la scheda. Riprova.");
    }
  }
  return (
    <Card>
      <Txt size={24} weight="700">
        Cena con delitto
      </Txt>
      <Txt>Il brindisi in cantina · Un master e 6 giocatori</Txt>
      <Disclosure title="Apri la console riservata al master">
        <Txt>
          Consegna una scheda in privato a ciascun giocatore. Fate le
          presentazioni in personaggio e proseguite la cena. Quando emerge un
          indizio o si raggiunge un obiettivo, avvisate il master a voce.
        </Txt>
        <Disclosure title="Copione completo e soluzione">{brief}</Disclosure>
        <Button
          label="Esporta copione master"
          icon="download"
          onPress={() =>
            void download(
              "master.md",
              `# Il brindisi in cantina\n\n${brief}\n\n${phases.join("\n\n")}\n\n${roles.map((r) => r.join(" · ")).join("\n\n")}`,
            )
          }
        />
        {roles.map(([name, role, background, goal]) => (
          <Button
            key={name}
            label={`Scarica scheda di ${name}`}
            icon="download"
            kind="secondary"
            onPress={() =>
              void download(
                `${name}.md`,
                `# Ti chiami ${name}\n\nRuolo: ${role}\n\n${background}\n\nNella storia il tuo obiettivo è: ${goal}\n\nPresentati senza leggere ad alta voce i tuoi segreti. Segnala al master gli eventi rilevanti.`,
              )
            }
          />
        ))}
        <Txt weight="700">{phases[phase]}</Txt>
        <Txt>
          {
            [
              "Invita tutti a presentarsi e lascia iniziare le conversazioni.",
              "Annuncia che Vittorio è stato trovato morto in cantina.",
              "Rivela gli indizi quando i giocatori li scoprono o li chiedono.",
              "Raccogli un’accusa da ciascuno, poi leggi la soluzione.",
            ][phase]
          }
        </Txt>
        <Field
          label="Evento segnalato al master"
          value={report}
          onChangeText={setReport}
          maxLength={500}
        />
        <Button
          label="Registra annuncio"
          icon="volume-2"
          disabled={!report.trim()}
          onPress={() => {
            setEvents([...events, report.trim()]);
            setReport("");
          }}
        />
        {events.map((event, i) => (
          <Txt key={i}>{event}</Txt>
        ))}
        <Button
          label="Fase successiva"
          icon="arrow-right"
          disabled={phase === phases.length - 1}
          onPress={() => setPhase(phase + 1)}
        />
        {error && <Txt>{error}</Txt>}
      </Disclosure>
    </Card>
  );
}

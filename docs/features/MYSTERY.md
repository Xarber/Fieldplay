# Cena con delitto

Apri **Games → Cena con delitto** sul dispositivo del master. La storia inclusa, *Il brindisi in cantina*, richiede sei giocatori e un master. Esporta il copione e le sei schede Markdown individuali, poi consegna ciascuna scheda in privato. Su web il browser scarica i file. Su mobile l’app usa il servizio di esportazione condiviso con Ideas.

Il master guida presentazioni, scoperta, indagine e accuse. I giocatori segnalano gli eventi a voce. Il master li annota nella console e li annuncia al tavolo. Il copione e la soluzione si aprono separatamente. La console è pensata per il dispositivo del master, quindi le schede non vanno aperte sullo schermo condiviso.

La storia è scritta a mano e funziona senza server o modello. Fase e annunci vengono salvati sul dispositivo tramite lo storage condiviso. Dopo le accuse il master può azzerare esplicitamente la sessione. La consegna privata in rete resta da sviluppare.

TypeScript ed esportazione web sono passati. In Chromium a 390×844, il test `npx tsx scripts/mystery-test.ts` ha scaricato tutte e sei le schede e completato le quattro fasi con annunci inseriti da un test. Nessun errore JavaScript. Restano da verificare una cena con partecipanti reali, l'esportazione su dispositivi nativi e le altre modalità richieste.

## Generazione sul computer del master

Con Ollama già in esecuzione su loopback e il modello `qwen2.5:0.5b` disponibile, esegui `npx tsx scripts/generate-mystery.ts /percorso/cartella-nuova "Cena in un rifugio"`. Puoi scegliere un altro modello locale con `FIELDPLAY_MYSTERY_MODEL`. Il generatore valida la struttura della risposta, crea sette file Markdown e rifiuta una cartella esistente. Il master deve verificare coerenza degli indizi e segreti prima di distribuire le schede. Le schede generate si usano direttamente al tavolo. La console integrata gestisce ancora il copione incluso.

Il contratto HTTP è stato provato con una risposta sintetica su loopback e ha prodotto sette file. Su questo Mac Ollama non rispondeva, quindi non è stata verificata l’inferenza. Non sono stati installati modelli o runtime. [Output strutturato Ollama](https://docs.ollama.com/capabilities/structured-outputs).

# Cena con delitto

Apri **Games → Cena con delitto** sul dispositivo del master. La storia inclusa, *Il brindisi in cantina*, richiede sei giocatori e un master. Esporta il copione e le sei schede Markdown individuali, poi consegna ciascuna scheda in privato. Su web il browser scarica i file. Su mobile l’app usa il servizio di esportazione condiviso con Ideas.

Il master guida presentazioni, scoperta, indagine e accuse. I giocatori segnalano gli eventi a voce. Il master li annota nella console e li annuncia al tavolo. Il copione e la soluzione si aprono separatamente. La console è pensata per il dispositivo del master, quindi le schede non vanno aperte sullo schermo condiviso.

La storia è scritta a mano e funziona senza server o modello. La fase e gli annunci durano finché la schermata rimane montata. Generazione locale, salvataggio della sessione e consegna privata in rete restano da sviluppare.

TypeScript ed esportazione web sono passati. In Chromium a 390×844, il test `npx tsx scripts/mystery-test.ts` ha scaricato tutte e sei le schede e completato le quattro fasi con annunci inseriti da un test. Nessun errore JavaScript. Restano da verificare una cena con partecipanti reali, l'esportazione su dispositivi nativi e le altre modalità richieste.

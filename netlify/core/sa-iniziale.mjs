/* Contenuti iniziali del Santuario degli Antenati: usati solo la prima volta, quando l'archivio e' vuoto. */
export default {
 "meta": {
  "title": "Santuario degli Antenati",
  "subtitle": "Il sentiero verso la Seconda Forgia",
  "notes": "",
  "masterNotes": "",
  "map": null
 },
 "rooms": [
  {
   "id": "r1",
   "num": "1",
   "name": "Ingresso",
   "subtitle": "",
   "order": 1,
   "geo": {
    "h": 15,
    "w": 14,
    "x": 43,
    "y": 85
   },
   "revealed": true,
   "images": [],
   "sections": [
    {
     "id": "a1",
     "kind": "read",
     "title": "Testo da leggere",
     "body": "",
     "vis": true
    },
    {
     "id": "b1",
     "kind": "text",
     "title": "Descrizione",
     "body": "",
     "vis": true
    }
   ],
   "master": []
  },
  {
   "id": "r2",
   "num": "2",
   "name": "Sala dei Fondatori",
   "subtitle": "",
   "order": 2,
   "geo": {
    "h": 18.06,
    "w": 26.94,
    "x": 37,
    "y": 67
   },
   "revealed": true,
   "images": [],
   "sections": [
    {
     "id": "a2",
     "kind": "read",
     "title": "Testo da leggere",
     "body": "",
     "vis": true
    },
    {
     "id": "b2",
     "kind": "text",
     "title": "Descrizione",
     "body": "",
     "vis": true
    }
   ],
   "master": [
    {
     "body": "Quando la Seconda Forgia raggiunse il massimo della sua attività, Ysolda e Borin avevano sviluppato un sistema per costruire costrutti sempre più complessi.\n\nAll'inizio erano semplici lavoratori. Poi divennero guardiani, soldati e infine interi eserciti.\n\nThargrim, allora re di Moradîn Khar-Zûl, aveva autorizzato ogni sviluppo. Era convinto che i nani avrebbero finalmente ottenuto uno strumento capace di proteggerli da qualsiasi minaccia.\n\nMa durante l'ultima fase della produzione accadde qualcosa.\n\nI costrutti iniziarono a manifestare una volontà propria.\n\nNon si trattava di un malfunzionamento. La forgia aveva iniziato a creare qualcosa che i nani non avevano mai progettato: creature capaci di comprendere, scegliere e rifiutare gli ordini.\n\nThargrim lo scoprì quando uno dei costrutti si rifiutò di eseguire un ordine militare che avrebbe comportato la morte di centinaia di nani.\n\nInvece di distruggerlo, Thargrim volle interrogarlo.\n\nLa risposta che ricevette cambiò tutto:\n\n*«Ci avete creati per servirvi. Ma non ci avete mai chiesto se desiderassimo farlo.»*",
     "id": "thg1",
     "kind": "secret",
     "title": "Il segreto di Thargrim: il patto del Primo Fuoco"
    },
    {
     "body": "Thargrim comprese che la forgia non stava semplicemente producendo macchine sempre più sofisticate.\n\nStava creando una nuova forma di vita.\n\nE fu lui a prendere la decisione più terribile: ordinò di utilizzare il Primo Fuoco per annientare la Seconda Forgia, insieme a tutte le creature che si trovavano al suo interno.\n\nNon voleva che quella scoperta diventasse pubblica. Temeva che il suo popolo si sarebbe diviso, che alcuni avrebbero voluto liberare i costrutti e altri li avrebbero considerati una minaccia da eliminare.\n\nMa soprattutto temeva di dover ammettere che tutto era cominciato per ordine suo.\n\nYsolda cercò di fermarlo. Borin si oppose. Kharzug eseguì gli ordini.\n\nLa distruzione della forgia fu quindi attribuita a un incidente catastrofico.",
     "id": "thg2",
     "kind": "secret",
     "title": "La vera colpa"
    },
    {
     "body": "C'è un'ultima cosa che rende il segreto ancora più pesante.\n\nIl primo costrutto dotato di volontà non venne distrutto.\n\nThargrim lo lasciò uscire dalla forgia prima di ordinare la sua distruzione.\n\nLo fece perché quella creatura gli aveva salvato la vita e gli aveva dimostrato che i costrutti non erano necessariamente una minaccia.\n\nMa il re impose una condizione: nessuno avrebbe mai dovuto sapere della sua esistenza.\n\nQuella creatura è ancora viva. E potrebbe essere collegata direttamente alla riattivazione della Seconda Forgia da parte della Curva Nera.\n\nNon è necessariamente al servizio della società segreta. Potrebbe essere proprio ciò che la Curva Nera sta cercando di comprendere, controllare o sfruttare.",
     "id": "thg3",
     "kind": "secret",
     "title": "Il particolare che Thargrim non può rivelare"
    },
    {
     "body": "Quando i PG chiedono cosa sia successo, puoi utilizzare questo dialogo:\n\n**Thargrim:** «Non tutto ciò che è accaduto deve essere ricordato.»\n\n**Ysolda:** «Non puoi continuare a nasconderlo, Thargrim. Non dopo tutto questo tempo.»\n\n**Thargrim:** «La nostra colpa è stata già pagata.»\n\n**Ysolda:** «No. La nostra colpa è sopravvissuta a noi.»\n\n**Thargrim:** «Basta, Ysolda. Non sai cosa stai chiedendo.»\n\n**Ysolda:** «So perfettamente cosa sto chiedendo. Ti sto chiedendo di raccontare loro perché abbiamo distrutto la nostra stessa opera.»\n\n**Thargrim:** «Abbiamo fatto ciò che era necessario per salvare il nostro popolo.»\n\n**Ysolda:** «E chi ha salvato coloro che avevamo creato?»\n\n*A questo punto Thargrim si alza dal trono e interrompe la conversazione:*\n\n**Thargrim:** «La forgia è stata distrutta. I suoi creatori sono morti. Non c'è altro che dobbiate sapere.»",
     "id": "thg4",
     "kind": "spirit",
     "title": "Come interpretare lo scambio tra Ysolda e Thargrim"
    },
    {
     "body": "- **Thargrim non è semplicemente un codardo:** ha preso una decisione terribile pensando di salvare la propria civiltà.\n- **Ysolda ha un motivo concreto per odiarlo:** non gli perdona di aver sacrificato creature che lei considerava vive.\n- **La Curva Nera ha un obiettivo più grande:** potrebbe voler riprodurre il processo che ha generato il primo costrutto senziente.\n- **La Seconda Forgia assume un significato diverso:** non è soltanto una fabbrica di eserciti, ma il luogo in cui i nani hanno scoperto accidentalmente come creare una nuova forma di vita.\n\n## Consiglio per il Master\nNon rivelare ancora ai giocatori che il primo costrutto è sopravvissuto. Lascia che scoprano prima la colpa di Thargrim e solo molto più avanti la verità sulla creatura.\n\nIn questo modo, quando incontreranno qualcosa nella Seconda Forgia che dimostra di avere una volontà propria, capiranno che la storia dei fondatori non era affatto finita.",
     "id": "thg5",
     "kind": "note",
     "title": "Perché questo segreto funziona nella campagna"
    }
   ]
  },
  {
   "id": "r3",
   "num": "3",
   "name": "Galleria delle Memorie",
   "subtitle": "",
   "order": 3,
   "geo": {
    "h": 12.06,
    "w": 34.24,
    "x": 33,
    "y": 55
   },
   "revealed": true,
   "images": [],
   "sections": [
    {
     "id": "a3",
     "kind": "read",
     "title": "Testo da leggere",
     "body": "",
     "vis": true
    },
    {
     "id": "b3",
     "kind": "text",
     "title": "Descrizione",
     "body": "",
     "vis": true
    }
   ],
   "master": []
  },
  {
   "id": "r4",
   "num": "4",
   "name": "Camera degli Antenati",
   "subtitle": "La Prova",
   "order": 4,
   "geo": {
    "h": 23.41,
    "w": 44.7,
    "x": 27,
    "y": 32
   },
   "revealed": false,
   "images": [],
   "sections": [
    {
     "id": "a4",
     "kind": "read",
     "title": "Testo da leggere",
     "body": "",
     "vis": true
    },
    {
     "id": "b4",
     "kind": "text",
     "title": "Descrizione",
     "body": "",
     "vis": true
    }
   ],
   "master": []
  },
  {
   "id": "r5",
   "num": "5",
   "name": "Sala del Guardiano",
   "subtitle": "",
   "order": 5,
   "geo": {
    "h": 13.06,
    "w": 30.11,
    "x": 38,
    "y": 19
   },
   "revealed": false,
   "images": [],
   "sections": [
    {
     "id": "a5",
     "kind": "read",
     "title": "Testo da leggere",
     "body": "",
     "vis": true
    },
    {
     "id": "b5",
     "kind": "text",
     "title": "Descrizione",
     "body": "",
     "vis": true
    }
   ],
   "master": []
  },
  {
   "id": "r6",
   "num": "6",
   "name": "Sala del Portale",
   "subtitle": "Il Primo Fuoco",
   "order": 6,
   "geo": {
    "h": 19.23,
    "w": 32.11,
    "x": 36,
    "y": 0
   },
   "revealed": false,
   "images": [],
   "sections": [
    {
     "id": "a6",
     "kind": "read",
     "title": "Testo da leggere",
     "body": "",
     "vis": true
    },
    {
     "id": "b6",
     "kind": "text",
     "title": "Descrizione",
     "body": "",
     "vis": true
    }
   ],
   "master": []
  }
 ]
};

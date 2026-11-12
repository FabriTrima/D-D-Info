# Karak-Dûran

- `/` pagina per i giocatori (sola lettura, si aggiorna da sola)
- `/master` pagina del Master (password, modifiche, pulsanti "Rivela")
- I dati stanno in Netlify Blobs; la password è la variabile `MASTER_PASSWORD` su Netlify.
- In questo repository (pubblico) non ci sono segreti.

# Zhar-Khazad (azer, Piano del Fuoco)

- `/zhar-khazad/` pagina per i giocatori (sola lettura, si aggiorna da sola ogni 15 secondi)
- `/zhar-khazad/master` pagina del Master: stessa password (`MASTER_PASSWORD`), modifiche con salvataggio automatico
- Ogni scheda, voce e segreto ha il suo interruttore "visibile ai PG"; le note del Master non escono mai dal server
- Dati in Netlify Blobs (archivio `zhar-khazad`); alla prima apertura il sito si riempie con i contenuti iniziali

# Santuario degli Antenati (dungeon verso la Seconda Forgia)

- `/santuario/` pagina per i giocatori (sola lettura, si aggiorna da sola ogni 10 secondi): vede solo le stanze rivelate, con la nebbia sul resto della mappa
- `/santuario/master` pagina del Master: stessa password (`MASTER_PASSWORD`), modifiche con salvataggio automatico
- Ogni stanza ha il pulsante "Rivela ai giocatori"; ogni sezione e immagine ha la spunta "PG"; le sezioni "Solo Master" non escono mai dal server
- Dati in Netlify Blobs (archivio `santuario-antenati`); alla prima apertura il sito si riempie con i contenuti iniziali

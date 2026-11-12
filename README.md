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

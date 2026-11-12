/* Contenuti iniziali di Zhar-Khazad: usati solo la prima volta, quando l'archivio e' vuoto. */
const it = (o) => Object.assign({ sub: '', text: '', secret: '', secretVis: false, notes: '', photo: null, vis: true }, o);

export default {
  meta: {
    title: 'Zhar-Khazad',
    subtitle: 'La Cittadella delle Sette Incudini',
    tagline: 'Dove il fuoco non si spegne mai, gli azer battono il metallo e mantengono la parola data.',
    city: 'La città degli azer',
    cityText: "Una fortezza d'ottone su un altopiano di basalto, circondata da fiumi di lava nel cuore del Piano Elementale del Fuoco.",
    motto: 'Il fuoco forgia, la parola lega',
    tabs: [
      { id: 'citta', name: 'La Città', kind: 'map', vis: true, map: { url: '/zhar-khazad/mappa.jpg' },
        intro: "Zhar-Khazad sorge su un altopiano di basalto nero, cinta da mura d'ottone e da un anello di lava che nessun esercito ha mai attraversato senza il permesso del Concilio. Un'unica strada lastricata, a sud-est, la collega al resto del Piano." },
      { id: 'societa', name: 'Società', kind: 'ladder', vis: true, map: null,
        intro: 'La società azer è rigida e ordinata come una lega ben fusa. Ogni azer nasce in una casta, riconoscibile dal metallo del kilt che indossa, e la propria posizione si cambia solo con il lavoro, il merito o un giuramento mantenuto per generazioni.' },
      { id: 'concilio', name: 'Il Concilio', kind: 'people', vis: true, map: null,
        intro: "Il governo di Zhar-Khazad. Ogni Maestro-Forgia custodisce una delle sette incudini sacre conservate nella Corona di Ottone e risponde dell'ambito della vita cittadina che essa rappresenta. Le leggi passano solo all'unanimità: un solo martello che tace blocca la decisione." },
      { id: 'cultura', name: 'Cultura e Fede', kind: 'cards', vis: true, map: null,
        intro: 'Ciò che ogni azer impara prima ancora di saper tenere un martello.' },
      { id: 'piano', name: 'Il Piano del Fuoco', kind: 'cards', vis: true, map: null,
        intro: 'Zhar-Khazad non è sola: intorno alle sue mura il Piano Elementale del Fuoco brulica di poteri antichi, nemici e viaggiatori.' },
      { id: 'segreti', name: 'Segreti del Master', kind: 'cards', vis: false, map: null,
        intro: 'Scheda riservata: i PG non la vedono finché non la riveli. Usala per appunti, agganci e verità nascoste.' }
    ]
  },
  data: {
    citta: [
      it({ id: 'corona', name: 'La Corona di Ottone', sub: 'Sede del Concilio', type: 'governo', x: 48.8, y: 18, text: "Il palazzo-fortezza più alto della città, interamente rivestito di lastre d'ottone lucidato. Qui si riunisce il Concilio delle Sette Incudini, sotto una cupola dove arde la Fiamma del Giuramento: ogni legge di Zhar-Khazad viene pronunciata davanti a essa." }),
      it({ id: 'piazza', name: 'La Piazza della Colata', sub: 'Crocevia della città', type: 'sacro', x: 48.5, y: 30.5, text: "Lo spiazzo all'incrocio delle strade principali, ai piedi della Corona. Durante le feste vi si versano colate rituali di metallo fuso e vi si proclamano le decisioni del Concilio." }),
      it({ id: 'incudini', name: 'Il Quartiere delle Incudini', sub: 'Fonderie e officine', type: 'industria', x: 25.5, y: 32, text: 'Il cuore produttivo della città: altiforni, crogioli e officine che non si fermano mai. Il fragore dei martelli è così costante che gli azer del quartiere comunicano a gesti e con segnali di fiamma.' }),
      it({ id: 'golarossa', name: 'La Gola Rossa', sub: 'Miniere e industria', type: 'industria', x: 66, y: 41, text: 'Una fenditura nel basalto dove gli azer estraggono metalli che esistono solo nel Piano del Fuoco. Torri di sollevamento, carrelli e argani scendono verso vene incandescenti; la casta di rame vi presta la maggior parte dei turni.' }),
      it({ id: 'scorie', name: 'Il Distretto delle Scorie', sub: 'Abitazioni e botteghe', type: 'residenza', x: 21, y: 54, text: 'Il quartiere più popoloso, costruito sui cumuli di scorie delle prime fonderie. Case a cupola, botteghe di artigiani minori, mercati e taverne dove si serve metallo fuso aromatizzato.' }),
      it({ id: 'memorie', name: 'La Sala delle Memorie', sub: 'Archivio e biblioteca', type: 'sapere', x: 49.5, y: 52, text: 'Un edificio circolare illuminato da fiamme azzurre, le uniche fredde della città. Custodisce le tavole incise con la storia del popolo azer, i registri dei giuramenti e le genealogie di ogni famiglia.' }),
      it({ id: 'ponte', name: 'Il Ponte Orientale', sub: 'Passaggio sulla lava', type: 'ingresso', x: 88, y: 37, text: 'Un ponte di bronzo ad arcate che scavalca le cascate di lava a est della città. È riservato ai convogli delle miniere e viene chiuso al calare dei turni.' }),
      it({ id: 'porta', name: 'La Porta del Crogiolo', sub: 'Ingresso sud-est', type: 'ingresso', x: 74.5, y: 81, text: "L'unico ingresso della cittadella aperto agli stranieri: una porta d'ottone sorvegliata senza sosta. Da qui la strada scende verso la Gola del Crogiolo Muto." }),
      it({ id: 'crogiolo', name: 'La Gola del Crogiolo Muto', sub: 'Fuori dalle mura', type: 'pericolo', x: 80.5, y: 95, vis: false, text: 'Una gola oltre la porta della città dove, si dice, il fuoco brucia senza alcun suono. Gli azer la evitano e non ne parlano volentieri.', notes: 'Da completare: cosa si trova davvero nella gola e il Varco delle Braci Quietate.' })
    ],
    societa: [
      it({ id: 's1', name: 'Il Concilio delle Sette Incudini', sub: 'Governo', text: "Sette Maestri-Forgia, ciascuno custode di un'Incudine, cioè di un ambito della vita cittadina. Le decisioni si prendono all'unanimità o non si prendono." }),
      it({ id: 's2', name: "La Casta d'Ottone", sub: "Kilt d'ottone", text: 'Magistrati, sacerdoti della fiamma e capifamiglia delle stirpi più antiche. Amministrano la legge, custodiscono i giuramenti e siedono nei consigli minori.' }),
      it({ id: 's3', name: 'La Casta di Bronzo', sub: 'Kilt di bronzo', text: 'Maestri artigiani, ingegneri, ufficiali e guerrieri della guardia. È la casta da cui escono i migliori fabbri del Piano.' }),
      it({ id: 's4', name: 'La Casta di Rame', sub: 'Kilt di rame', text: 'Minatori, fonditori, portatori e apprendisti. Lavorano nella Gola Rossa e nelle fonderie; con anni di servizio fedele una famiglia di rame può essere elevata al bronzo.' }),
      it({ id: 's5', name: 'Le Braci Spente', sub: 'Senza casta', text: 'Azer che hanno infranto un giuramento, fuggiaschi tornati dalla schiavitù degli efreeti o debitori insolventi. Non portano kilt di metallo e vivono ai margini del Distretto delle Scorie.' })
    ],
    concilio: [
      it({ id: 'c1', sub: 'Incudine della Legge', name: 'Maestro-Forgia Durrak Voce-di-Brace', role: 'Custode dei Giuramenti', age: '', domain: 'legge, giuramenti e giustizia', motto: 'Ciò che è giurato è fuso', text: 'Presiede i processi davanti alla Fiamma del Giuramento. Severo e paziente, ascolta tutti fino in fondo prima di parlare, e quando parla la sentenza è già decisa.' }),
      it({ id: 'c2', sub: 'Incudine dello Scudo', name: 'Maestra-Forgia Hezra Murodorato', role: 'Comandante delle Mura', age: '', domain: 'difesa, mura e guardia', motto: 'Nessuna crepa nel metallo', text: "Comanda la guardia e le difese dell'altopiano. Ha combattuto le salamandre per tutta la vita e diffida di chiunque arrivi dalla strada del sud-est." }),
      it({ id: 'c3', sub: 'Incudine del Martello', name: 'Maestro-Forgia Thurgan Mezzofuso', role: 'Signore delle Fonderie', age: '', domain: 'fonderie e officine del Quartiere delle Incudini', motto: 'Il martello non mente', text: 'Il più grande fabbro vivente di Zhar-Khazad. Parla poco e con frasi brevi; giudica gli altri dalla qualità di ciò che sanno costruire.' }),
      it({ id: 'c4', sub: 'Incudine della Profondità', name: 'Maestro-Forgia Ozzrak Venarossa', role: 'Signore delle Miniere', age: '', domain: 'miniere della Gola Rossa', motto: 'Più giù, più caldo, più vero', text: "Viene dalla casta di rame ed è salito al Concilio con il lavoro. È molto amato dai minatori e poco dai nobili d'ottone." }),
      it({ id: 'c5', sub: 'Incudine della Memoria', name: 'Maestra-Forgia Velka Fiammazzurra', role: 'Custode della Sala delle Memorie', age: '', domain: 'archivi, storia e genealogie', motto: 'Il metallo ricorda', text: 'Custodisce le tavole incise della Sala delle Memorie. Conosce la storia di ogni famiglia della città e non dimentica mai un debito o un torto.' }),
      it({ id: 'c6', sub: 'Incudine dello Scambio', name: 'Maestro-Forgia Kelzûr Bilanciadottone', role: 'Signore dei Commerci', age: '', domain: 'commercio e rapporti con gli altri popoli del Piano', motto: 'Ogni peso trova il suo contrappeso', text: 'Tratta con mercanti, viaggiatori e, quando serve, con gli emissari dei popoli del fuoco. Il più diplomatico dei sette, e per questo il meno amato dai tradizionalisti.' }),
      it({ id: 'c7', sub: 'Incudine della Fiamma', name: 'Maestra-Forgia Ardha Cuoredicrogiolo', role: 'Prima Sacerdotessa del Fuoco', age: '', domain: 'culto del fuoco, riti e feste', motto: 'Finché arde, viviamo', text: 'Guida i riti della Piazza della Colata e custodisce la Fiamma del Giuramento. Crede che ogni azer porti in sé una scintilla del Piano che va onorata con il lavoro.' })
    ],
    cultura: [
      it({ id: 'k1', name: 'Il Fuoco Interiore', sub: 'Corpo e anima', text: 'Gli azer hanno pelle color bronzo e capelli e barba fatti di fiamme vive. Credono che ognuno porti in sé una scintilla del Piano: un azer che si spegne muore, e il freddo è per loro la paura più antica.' }),
      it({ id: 'k2', name: 'La Parola Data', sub: 'Il giuramento', text: 'Un giuramento azer vale più di qualsiasi contratto. Chi lo infrange perde la casta e diventa una Brace Spenta. Gli azer giurano poco, ma quando lo fanno mantengono fino all\'ultimo.' }),
      it({ id: 'k3', name: 'Il Lavoro come Preghiera', sub: 'Fede', text: 'Forgiare è il modo più alto di onorare il fuoco. Ogni azer impara un mestiere da bambino e porta con sé, come firma, il segno del maestro che lo ha istruito.' }),
      it({ id: 'k4', name: 'I Kilt di Metallo', sub: 'Abbigliamento', text: 'Gli azer vestono kilt di metallo lavorato: ottone, bronzo o rame secondo la casta. Le incisioni raccontano famiglia, mestiere e imprese di chi li porta.' }),
      it({ id: 'k5', name: 'La Notte delle Sette Colate', sub: 'Festa', text: 'La festa più importante dell\'anno: i sette Maestri-Forgia versano insieme il metallo fuso nella Piazza della Colata e il popolo rinnova i giuramenti verso la città.' }),
      it({ id: 'k6', name: 'Lingua e scrittura', sub: 'Ignan', text: 'Gli azer parlano l\'ignan, la lingua del Piano del Fuoco, e molti conoscono il comune per il commercio. Scrivono incidendo il metallo: nella Sala delle Memorie non c\'è un solo foglio di carta.' })
    ],
    piano: [
      it({ id: 'p1', name: 'Gli Efreeti e la Città di Ottone', sub: 'Antichi padroni', text: "Per secoli gli efreeti hanno ridotto in schiavitù interi clan azer. Zhar-Khazad nacque da azer fuggiti, e libera è rimasta; l'odio verso gli efreeti è profondo e ogni azer libero lo eredita." }),
      it({ id: 'p2', name: 'Le Salamandre', sub: 'Nemici', text: 'Predatrici crudeli che assaltano carovane e miniere isolate. Tra azer e salamandre non esiste pace, solo tregue brevi.' }),
      it({ id: 'p3', name: 'Elementali e mephit del fuoco', sub: 'Vicini', text: 'Creature del Piano con cui gli azer convivono senza amicizia. Alcuni elementali vengono legati con patti per alimentare gli altiforni.' }),
      it({ id: 'p4', name: 'Viaggiatori del Piano Materiale', sub: 'Ospiti rari', text: 'Gli stranieri che arrivano vivi a Zhar-Khazad sono pochi. Gli azer li accolgono con sospetto, ma rispettano chi mantiene la parola e chi sa riconoscere un buon lavoro di forgia.' }),
      it({ id: 'p5', name: 'Regole del Piano (D&D 3.5)', sub: 'Per i giocatori', text: 'Elemental Plane of Fire traits: normal gravity, normal time, infinite, fire-dominant, enhanced magic (fire), impeded magic (water), mildly neutral-aligned.\nFire-dominant: creatures without fire resistance or immunity take 3d10 fire damage each round; unprotected flammable items catch fire.\nEnhanced magic: spells and spell-like abilities with the fire descriptor are maximized and enlarged.\nImpeded magic: spells that use or create water require a Spellcraft check (DC 20 + spell level) or fail.' }),
      it({ id: 'p6', name: 'Gli Azer (D&D 3.5)', sub: 'Statistiche di base', text: 'Azer: Medium Outsider (Extraplanar, Fire, Lawful), CR 2.\nHeat: a hit with an unarmed strike or a metal weapon deals +1d6 fire damage.\nImmunity to fire, vulnerability to cold, SR 13.\nUsually lawful neutral. Speak Ignan and Common.' })
    ],
    segreti: []
  }
};

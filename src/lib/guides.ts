import type { Language } from "../context/language";
import { englishGuides, englishSourceLabels } from "./guides.en";

export interface Guide {
  slug: string;
  title: string;
  summary: string;
  reviewed: string;
  paragraphs: string[];
  points: string[];
  sections?: { heading: string; paragraphs: string[] }[];
  links?: { label: string; href: string }[];
  sources: { label: string; url: string }[];
}

export const guides: Guide[] = [
  {
    slug: "lahedase-surm",
    title: "Mida teha lähedase surma korral?",
    summary: "Tegevuskava esimestest toimingutest matuste, toetuste ja pärimiseni.",
    reviewed: "19.10.2026",
    paragraphs: ["Tee esmased otsused ükshaaval. Hädaolukorras helista 112; muul juhul järgi haigla, hoolekandeasutuse või tervishoiuteenuse osutaja juhiseid. Seejärel korralda surmatõend, matused, vajalikud teavitused ning kontrolli toetuste ja pärimise võimalusi."],
    points: [],
    sections: [
      {
        heading: "Esimesed toimingud pärast surma",
        paragraphs: ["Kui inimene on teadvuseta ega hinga normaalselt, helista kohe 112. Ütle täpne asukoht, kirjelda hingamist ja järgi häirekeskuse juhiseid. Ära oota perearsti, raviarsti või muu tavapärase tervishoiuteenuse vastust.", "Kui inimene suri kodus pärast oodatud haiguse kulgu ja olukord ei ole hädaolukord, võta ühendust perearstikeskusega või inimesega tegelenud raviarstiga. Raviarst tähendab siin arsti, kes inimest selle haiguse või olukorra tõttu ravis; ta ei pea olema sama inimene mis perearst. Küsi, kuidas surm tuvastatakse ja kellelt saad esmase surmatõendi.", "Kui inimesel ei olnud perearsti, teadaolevat haigust või raviarsti, või perearst ei ole kättesaadav, käsitle ootamatut surma hädaabikõnena: helista 112, kirjelda olukorda ja ütle, et lähedasel ei olnud raviarsti. Häirekeskus korraldab edasise abi ning ütleb, mida oodata ja mida teha. Ära liiguta surnut ega korralda transporti omal käel.", "Kui inimene suri haiglas või hoolekandeasutuses, küsi töötajalt, millal väljastatakse esmane surmatõend, kes korraldab surnu üleandmise ja kellega saad matuste korraldamist jätkata.", "Ootamatu, vägivaldse, kahtlase või muul viisil ebaselge surma korral helista 112 ning järgi politsei ja häirekeskuse juhiseid. Ära puutu sündmuskohta, liiguta surnut ega korista ruumi enne pädeva asutuse juhist."]
      },
      {
        heading: "Surma registreerimine ja surmatõend",
        paragraphs: ["Tervishoiuteenuse osutaja edastab surma andmed üldjuhul rahvastikuregistrisse ning väljastab esmase surmatõendi. Sellisel juhul ei pea lähedane surma perekonnaseisuasutuses eraldi registreerima.", "Kui erand nõuab perekonnaseisuasutuses registreerimist, esita avaldus seitsme päeva jooksul surmast või sellest teada saamisest. Kaasa avaldus, arstlik surmateatis ja avaldaja isikut tõendav dokument. Asutus registreerib surma kolme tööpäeva jooksul ning riigilõivu ei võeta.", "Välismaal surnud inimese puhul küsi perekonnaseisuasutuselt, kas surm on seal juba registreeritud ja kuidas dokument Eestis esitada. Tõlke, apostilli või legaliseerimise vajadus sõltub dokumendist ja riigist."]
      },
      {
        heading: "Matuste korraldamine",
        paragraphs: ["Kui surmatõend on olemas, lepi perega kokku matmine või tuhastamine ning võta ühendust matusebürooga. Küsi, kas büroo korraldab surnu transpordi, urni või kirstu ja tseremoonia.", "Võta ühendust valitud kalmistu haldajaga. Hauaplatsi, urnimatmise ja matmise tingimused sõltuvad kalmistust ning kalmistu eeskirjast.", "Enne tellimist küsi kirjalik hinnapakkumine, teenuste loetelu, lisatasud ja arvelduse kord."]
      },
      {
        heading: "Lähedaste ja asutuste teavitamine",
        paragraphs: ["Teavita lähedasi ja lepi pere sees kokku üks inimene, kes hoiab dokumente ning suhtleb matusebüroo ja kalmistuga.", "Vajaduse korral anna surmast teada tööandjale, pangale, kindlustusandjale ning eluaseme, elektri ja side teenusepakkujatele. Küsi igalt asutuselt eraldi, millist dokumenti nad vajavad."]
      },
      {
        heading: "Toetused ja rahaasjad",
        paragraphs: ["Matusetoetus sõltub omavalitsusest. Tallinnas tuleb matuse korraldajal taotlus esitada kuue kuu jooksul lahkunu surmapäevast; mujal kontrolli oma omavalitsuse tingimusi ja tähtaega.", "Kui perre jäi laps või muu võimalik õigustatud isik, vaata Sotsiaalkindlustusameti toitjakaotustoetuse ja toitjakaotuspensioni juhiseid. Õigus sõltub taotleja olukorrast, seega küsi ametilt konkreetse juhtumi kohta.", "Teavita panka ja kindlustusandjat, kuid ära lõpeta lepinguid enne, kui oled kontrollinud võimalikke kohustusi ja pärimisasju."]
      },
      {
        heading: "Pärimisasjade korraldamine",
        paragraphs: ["Pärimismenetluse algatamiseks võta ühendust ükskõik millise notaribürooga ja broneeri aeg. Üldist kolmekuulist algatamistähtaega ei ole; kui keegi on menetluse juba algatanud, ei pea kaaspärija uut avaldust esitama.", "Pärandist loobumise avaldus tuleb üldjuhul esitada kolme kuu jooksul hetkest, mil pärija sai või pidi saama teada nii pärandaja surmast kui ka oma pärimisõigusest. Täpse tähtaja hindab notar asjaolude põhjal.", "Valmista ette isikut tõendav dokument, info sugulussuhte kohta, testament või koduse testamendi originaal, kui see on sinu käes, ning teadaolev info vara ja kohustuste kohta."]
      },
    ],
    sources: [
      { label: "Siseministeerium: surma registreerimine", url: "https://www.siseministeerium.ee/surma-registreerimine" },
      { label: "Riigi Teataja: surma põhjuse tuvastamise seadus", url: "https://www.riigiteataja.ee/akt/117032026011" },
      { label: "Riigi Teataja: kalmistuseadus", url: "https://www.riigiteataja.ee/akt/410062014055" },
      { label: "Tallinn: matusetoetus", url: "https://www.tallinn.ee/et/teenused/matusetoetus" },
      { label: "Notarite Koda: pärimise protsess", url: "https://parimine.notar.ee/parimine/parimise-protsess/" },
      { label: "Sotsiaalkindlustusamet: toitjakaotustoetus", url: "https://sotsiaalkindlustusamet.ee/perehuvitised-ja-muud-toetused/peretoetused/toitjakaotustoetus" },
      { label: "Sotsiaalkindlustusamet: toitjakaotuspension", url: "https://sotsiaalkindlustusamet.ee/pension-ja-seotud-huvitised/pensioni-liigid/toitjakaotuspension" },
    ],
  },
  {
    slug: "matuste-korraldamine",
    title: "Kuidas korraldada matuseid?",
    summary: "Ülevaade matuste korraldamise peamistest valikutest.",
    reviewed: "19.10.2026",
    paragraphs: ["Matuste korraldamisel lepi perega kokku soovid, eelarve ja ajakava. Matusebüroo saab aidata transpordi, kirstu või urni, tseremoonia ning hauaplatsi korraldamisel.", "Küsi teenuste ja lisakulude kohta kirjalik hinnapakkumine. Tseremoonia võib olla ilmalik või usutalitusega ning matmine või tuhastamine sõltub lahkunu ja pere soovidest.", "Matusetoetus ei ole üks üleriigiliselt ühesugune toetus. Näiteks Tallinna matusetoetust saab taotleda matuse korraldaja, kes katab kulud, kuue kuu jooksul lahkunu surmapäevast; tingimused on Tallinna-põhised."],
    points: ["Pane kirja pere soovid, eelarve ja soovitud kuupäev.", "Vali matusebüroo ning küsi teenuste täpne loetelu.", "Lepi kokku tseremoonia, ärasaatmise ja hauaplatsi üksikasjad.", "Kui taotled Tallinna toetust, esita taotlus kuue kuu jooksul ja hoia alles kuludokumendid."],
    sections: [
      { heading: "Pärast surma kinnitamist", paragraphs: ["Küsi surmatõendit väljastavalt tervishoiuteenuse osutajalt, millal saab surnu üle anda matusebüroole. Matusebüroo korraldab tavaliselt transpordi, kuid lepi see enne tellimist kirjalikult kokku."] },
      { heading: "Matusebüroo ja hinnapakkumine", paragraphs: ["Küsi kirjalikku pakkumist, kus on eraldi välja toodud transport, kirst või urn, riietamine, hoiustamine, tseremoonia, lilled ja muud teenused. Küsi ka lisatasude, maksetähtaja ja muutmistingimuste kohta."] },
      { heading: "Matmine või tuhastamine", paragraphs: ["Matmine tähendab hauaplatsi kasutamist; tuhastamise korral tuleb eraldi kokku leppida urni üleandmine ja urnimatmine või muu tuha säilitamise viis. Kalmistu haldaja ütleb, milliseid dokumente ja kooskõlastusi konkreetne kalmistu nõuab."] },
      { heading: "Tseremoonia ja kontrollnimekiri", paragraphs: ["Vali ärasaatmise aeg, koht ja vorm ning lepi kokku, kes korraldab teavitused. Enne kinnitamist kontrolli teenuste loetelu, lõpphinda, kalmistu tingimusi ja arve saajat."] },
    ],
    sources: [
      { label: "Tallinn: matusetoetus", url: "https://www.tallinn.ee/et/teenused/matusetoetus" },
      { label: "Tallinn: matusetoetuse taotlemine", url: "https://taotlen.tallinn.ee/matusetoetus" },
    ],
  },
  {
    slug: "surmakuulutuse-kirjutamine",
    title: "Kuidas kirjutada surmakuulutust?",
    summary: "Praktiline struktuur väärika ja selge kuulutuse jaoks.",
    reviewed: "19.10.2026",
    paragraphs: ["Surmakuulutus võiks olla selge, väärikas ja perega kooskõlastatud. Tavaliselt sisaldab see lahkunu nime, kuupäevi, teadet surmast ning lähedaste nimed või perekonna ühise hüvastijätu.", "Vali sõnastus, mis vastab pere soovile. Ärasaatmise aeg ja koht lisa ainult siis, kui pere soovib neid avaldada.", "Enne avaldamist loe kuulutus vähemalt üks kord rahulikult üle. Kontrolli nimesid, kuupäevi, kohti ja kontaktandmeid ning veendu, et avaldatud info ei rikuks kellegi privaatsust."],
    points: ["Alusta lühikese teatega ja lisa lahkunu nimi.", "Lisa soovi korral sünni- ja surmakuupäev.", "Lisa ärasaatmise info ainult pere nõusolekul.", "Lõpeta lähedaste nimede või ühise mälestuslausega."],
    sections: [
      { heading: "Põhiinfo", paragraphs: ["Lisa teade surmast, lahkunu nimi ning soovi korral sünni- ja surmakuupäev. Lähedaste nimed lisa perega kooskõlastatult."] },
      { heading: "Sõnastus ja privaatsus", paragraphs: ["Hoia tekst lühike ja väärikas. Ära avalda aadressi, telefoninumbrit, isikukoodi ega ärasaatmise üksikasju, kui pere ei soovi neid jagada."] },
      { heading: "Näited", paragraphs: ["Lühike: „Teatame kurbusega, et lahkus meie kallis [nimi]. Leinavad lähedased.“", "Traditsiooniline: „Meie hulgast on lahkunud [nimi] ([sünniaasta–surmaaasta]). Mälestavad perekond ja sõbrad.“", "Tseremooniaga: „Jätame [nimi] hüvasti [kuupäeval] kell [aeg] [kohas]. Oodatud on kõik, kes soovivad mälestust jagada.“ Kõik näited on väljamõeldud."] },
      { heading: "Enne avaldamist", paragraphs: ["Kontrolli nimed, kuupäevad ja kohad. Surmakuulutuse avaldamiseks kasuta Surmakuulutus.ee vormi: /lisa-kuulutus."] },
    ],
    links: [{ label: "Ava surmakuulutuse vorm", href: "/lisa-kuulutus" }],
    sources: [],
  },
  {
    slug: "matusetoetused-eestis",
    title: "Matusetoetused Eestis",
    summary: "Kust kontrollida matusetoetuse tingimusi ja taotlemist.",
    reviewed: "19.10.2026",
    paragraphs: ["Matusetoetuse tingimused võivad sõltuda kohaliku omavalitsuse korrast ja taotleja olukorrast. Kõige täpsema vastuse annab lahkunu või taotleja elukohajärgne omavalitsus.", "Enne taotluse esitamist kontrolli ametlikust allikast toetuse saajad, tähtajad, summa ja nõutavad dokumendid. Ära eelda, et ühe omavalitsuse kord kehtib kogu Eestis.", "Küsi alati, kas taotlus tuleb esitada enne kulu tegemist või pärast seda ning millisel kujul tuleb esitada surmatõend ja kuludokumendid."],
    points: ["Võta ühendust kohaliku omavalitsuse sotsiaalosakonnaga.", "Küsi toetuse saaja, summa ja tähtaja kohta.", "Kontrolli, milliseid dokumente ja arveid tuleb esitada.", "Hoia alles esitatud taotlus ja vastus."],
    sections: [
      { heading: "Mis toetus see on?", paragraphs: ["Matusetoetus on kohaliku omavalitsuse toetus, mille tingimused, summa, tähtajad ja taotleja võivad omavalitsuseti erineda. Seda ei tohi segi ajada toitjakaotustoetuse või toitjakaotuspensioniga."] },
      { heading: "Kuhu pöörduda?", paragraphs: ["Alusta omavalitsusest, kelle korras on lahkunu või taotlejaga seotud tingimus. Kontrolli ametlikku veebilehte või helista omavalitsuse sotsiaalosakonda; ära eelda, et alati vastutab taotleja praegune elukoht."] },
      { heading: "Taotlemine", paragraphs: ["Küsi enne esitamist, kas taotlus esitatakse veebis, teeninduses või e-posti teel. Valmista tavaliselt ette isikut tõendav dokument, surmatõend ja matuse kuludokumendid, kuid täpse loetelu annab toetust menetlev omavalitsus."] },
      { heading: "Kui infot ei leia", paragraphs: ["Võta ühendust omavalitsuse sotsiaalosakonnaga ja palu kirjalikku juhist taotleja, tähtaja, dokumentide ja esitamise viisi kohta. Vajadusel küsi abi kohaliku omavalitsuse teenindusest või sotsiaaltöötajalt."] },
    ],
    sources: [
      { label: "Tallinn: matusetoetus", url: "https://www.tallinn.ee/et/teenused/matusetoetus" },
      { label: "Tallinn: matusetoetuse taotlemine", url: "https://taotlen.tallinn.ee/matusetoetus" },
      { label: "Sotsiaalkindlustusamet: toitjakaotustoetus", url: "https://www.sotsiaalkindlustusamet.ee/perehuvitised-ja-muud-toetused/peretoetused/toitjakaotustoetus" },
      { label: "Sotsiaalkindlustusamet: toitjakaotuspension", url: "https://sotsiaalkindlustusamet.ee/pension-ja-seotud-huvitised/pensioni-liigid/toitjakaotuspension" },
    ],
  },
  {
    slug: "parimine-parast-surma",
    title: "Pärimine pärast lähedase surma",
    summary: "Esimesed sammud pärimisasjade korraldamisel.",
    reviewed: "19.10.2026",
    paragraphs: ["Pärimismenetluse algatamiseks tuleb notaribürooga ühendust võtta ja aeg broneerida. Avalduse võib esitada ükskõik millisele notarile; kui keegi teine on menetluse juba algatanud, ei pea kaaspärija uut avaldust esitama.", "Pärandist loobumise avaldus tuleb Notarite Koja juhendi järgi esitada kolme kuu jooksul hetkest, kui pärija sai teada või pidi teada saama oma pärimisõigusest. Pärimise vastuvõtmise või loobumise otsus vajab hoolikat kaalumist, sest pärandiga võivad kaasneda kohustused.", "Kogu kokku testament, sugulust tõendavad dokumendid, vara puudutav info ja teadaolevad kohustused. Notar selgitab menetluse käiku, kontrollib pärimisregistri andmeid ning piisavalt tõendatud pärimisõiguse korral koostab pärimistunnistuse."],
    points: ["Võta ühendust notaribürooga ja broneeri aeg.", "Kontrolli pärimisregistrist, kas menetlus on juba algatatud.", "Esita vajadusel koduse testamendi originaal ja muud vajalikud dokumendid.", "Kui loobud pärandist, esita avaldus kolme kuu jooksul pärimisõigusest teada saamisest."],
    sections: [
      { heading: "Mis on pärand?", paragraphs: ["Pärandisse võivad kuuluda lahkunu vara, õigused ja kohustused. Pärijad võivad olla seaduse või testamendi alusel; konkreetse olukorra selgitab notar."] },
      { heading: "Menetluse algatamine", paragraphs: ["Võta ühendust ükskõik millise notariga. Üldist tähtaega pärimismenetluse algatamiseks ei ole, kuid kiire pöördumine aitab välja selgitada pärijad, testamendi ja kohustused."] },
      { heading: "Vastuvõtmine, loobumine ja inventuur", paragraphs: ["Pärandiga võivad kaasneda võlad. Küsi notarilt inventuuri kohta, kui vara ja kohustuste ulatus ei ole teada; notar selgitab, milline otsus sobib sinu olukorda.", "Pärandist loobumise avaldus tuleb üldjuhul esitada kolme kuu jooksul hetkest, mil pärija sai või pidi saama teada nii surmast kui oma pärimisõigusest. Tähtaja hindab notar konkreetsete asjaolude põhjal."] },
      { heading: "Mida notarile kaasa võtta?", paragraphs: ["Võta kaasa isikut tõendav dokument, info sugulussuhte kohta, testament või koduse testamendi originaal ning teadaolev info vara ja kohustuste kohta. Õiguslikult siduva nõu annab notar, mitte käesolev üldjuhend."] },
    ],
    sources: [
      { label: "Notarite Koda: pärimise protsess", url: "https://parimine.notar.ee/parimine/parimise-protsess/" },
    ],
  },
];

export function getGuides(language: Language = "et"): Guide[] {
  if (language === "et") return guides;
  return guides.map((guide) => ({
    ...guide,
    ...englishGuides[guide.slug as keyof typeof englishGuides],
    sources: guide.sources.map((source) => ({
      ...source,
      label: englishSourceLabels[source.label],
    })),
  }));
}

export function getGuide(slug: string, language: Language = "et") {
  return getGuides(language).find((guide) => guide.slug === slug);
}

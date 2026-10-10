import { createContext, useContext } from "react";

export const languages = ["et", "en"] as const;

export type Language = (typeof languages)[number];

export const translations = {
  "nav.home": {
    et: "Avaleht",
    en: "Home",
  },
  "nav.ads": {
    et: "Surmakuulutused",
    en: "Obituaries",
  },
  "nav.addAd": {
    et: "Lisa kuulutus",
    en: "Add obituary",
  },
  "nav.lightMode": {
    et: "Hele",
    en: "Light",
  },
  "nav.darkMode": {
    et: "Tume",
    en: "Dark",
  },
  "home.title": {
    et: "Surmakuulutused",
    en: "Obituaries",
  },
  "home.empty": {
    et: "Kuulutusi pole veel lisatud.",
    en: "No obituaries have been added yet.",
  },
  "home.loadError": {
    et: "Kuulutuste laadimine ebaõnnestus.",
    en: "Failed to load obituaries.",
  },
  "home.loadConfigError": {
    et: "Kuulutuste laadimine ebaõnnestus",
    en: "Failed to load obituaries.",
  },
  "home.addAdHeading": {
    et: "Lisa kuulutus",
    en: "Add obituary",
  },
  "home.addAdCta": {
    et: "Lisa kuulutus",
    en: "Add obituary",
  },
  "home.addAdIntro": {
    et: "Avalda mälestuskuulutus väärikas vormis",
    en: "Publish a memorial notice in a quiet, dignified form.",
  },
  "home.searchPlaceholder": {
    et: "Otsi nime järgi",
    en: "Search by name",
  },
  "home.searchLabel": {
    et: "Otsi nime järgi",
    en: "Search by name",
  },
  "home.sortLabel": {
    et: "Sorteeri kuulutusi",
    en: "Sort obituaries",
  },
  "home.sortNewest": {
    et: "Uuemad",
    en: "Newest",
  },
  "home.sortOldest": {
    et: "Vanemad",
    en: "Oldest",
  },
  "home.resultCount": {
    et: "kuulutust",
    en: "obituaries",
  },
  "home.noSearchResults": {
    et: "Selle nimega kuulutusi ei leitud.",
    en: "No obituaries match that name.",
  },
  "home.clearSearch": {
    et: "Tühjenda otsing",
    en: "Clear search",
  },
  "home.sectionHeading": {
    et: "Viimased kuulutused",
    en: "Latest notices",
  },
  "detail.backToList": {
    et: "Tagasi kuulutuste juurde",
    en: "Back to notices",
  },
  "share.button": {
    et: "Kopeeri kuulutuse link",
    en: "Copy obituary link",
  },
  "share.copied": {
    et: "Link kopeeritud",
    en: "Link copied",
  },
  "share.copyFailed": {
    et: "Linki ei õnnestunud kopeerida",
    en: "Failed to copy link",
  },
  "form.pageTitle": {
    et: "Lisa surmakuulutus",
    en: "Add obituary",
  },
  "form.pageIntro": {
    et: "Koosta mälestuskuulutus väärikas vormis.",
    en: "Create a memorial notice in a calm and dignified form.",
  },
  "form.previewTitle": {
    et: "Eelvaade",
    en: "Preview",
  },
  "form.requiredNote": {
    et: "Tärniga väljad on kohustuslikud.",
    en: "Fields marked with an asterisk are required.",
  },

  "form.successTitle": {
    et: "Kuulutus on avaldatud",
    en: "Obituary published",
  },
  "form.successMessage": {
    et: "Teie mälestuskuulutus on edukalt lisatud ja nüüd kõigile nähtav.",
    en: "Your memorial notice has been added and is now visible.",
  },
  "form.viewAd": {
    et: "Vaata kuulutust",
    en: "View obituary",
  },
  "form.backHome": {
    et: "Tagasi avalehele",
    en: "Back to home",
  },
  "form.publishedAd": {
    et: "Avaldatud mälestuskuulutus",
    en: "Published memorial notice",
  },
  "form.thankYou": {
    et: "Täname, et jagasite mälestust.",
    en: "Thank you for sharing a memory.",
  },
  "form.createAnother": {
    et: "Lisa uus kuulutus",
    en: "Create another",
  },
  "form.poem": {
    et: "Luuletus",
    en: "Poem",
  },
  "form.poemPlaceholder": {
    et: `Mälestusteks tuhmunud me aeg.
Pisarateks Sinu kaunis naer.
Tühjuseks on roogitud mu hing.
Ja südames vaid igatsen ma Sind.`,
    en: `Time faded into memories.
Your beautiful laugh into tears.
My soul has emptied into silence.
My heart still longs for you.`,
  },
  "form.topText": {
    et: "Tekst enne lahkunu nime",
    en: "Text before the deceased's name",
  },
  "form.topTextPlaceholder": {
    et: "Teatame kurbusega, et lahkus meie kallis",
    en: "With sadness we announce the passing of our dear",
  },
  "form.name": {
    et: "Lahkunu Nimi",
    en: "Name of the deceased",
  },
  "form.namePlaceholder": {
    et: "ema",
    en: "mother",
  },
  "form.birthDate": {
    et: "Sünniaeg",
    en: "Date of birth",
  },
  "form.birthDatePlaceholder": {
    et: "19.01.1992",
    en: "19.01.1992",
  },
  "form.deathDate": {
    et: "Surmaaeg",
    en: "Date of death",
  },
  "form.deathDatePlaceholder": {
    et: "23.03.2026",
    en: "23.03.2026",
  },
  "form.mourners": {
    et: "Leinajad",
    en: "Mourners",
  },
  "form.mournersPlaceholder": {
    et: "Leinab Rein perega",
    en: "Mourned by Rein and family",
  },
  "form.email": {
    et: "Kuulutuse lisaja e-mail",
    en: "Submitter email",
  },
  "form.emailPlaceholder": {
    et: "nimi@gmail.com",
    en: "name@gmail.com",
  },
  "form.save": {
    et: "Avalda kuulutus",
    en: "Publish obituary",
  },
  "form.serverFallback": {
    et: "Midagi läks valesti",
    en: "Something went wrong",
  },
  "form.genericError": {
    et: "Midagi läks valesti! Proovi uuesti.",
    en: "Something went wrong! Try again.",
  },
  "card.crossAlt": {
    et: "rist",
    en: "cross",
  },
  "validation.nameRequired": {
    et: "Nimi on kohustuslik",
    en: "Name is required",
  },
  "validation.nameMax": {
    et: "Nimi võib olla kuni 100 tähemärki",
    en: "Name can be up to 100 characters",
  },
  "validation.emailInvalid": {
    et: "Sisesta kehtiv e-mail",
    en: "Enter a valid email",
  },
  "validation.emailMax": {
    et: "E-mail võib olla kuni 254 tähemärki",
    en: "Email can be up to 254 characters",
  },
  "validation.poemMax": {
    et: "Luuletus võib olla kuni 300 tähemärki",
    en: "Poem can be up to 300 characters",
  },
  "validation.topTextMax": {
    et: "Tekst enne lahkunu nime võib olla kuni 100 tähemärki",
    en: "Text before the deceased's name can be up to 100 characters",
  },
  "validation.bottomTextMax": {
    et: "Leinajad võivad olla kuni 100 tähemärki",
    en: "Mourners can be up to 100 characters",
  },
  "validation.birthDateInvalid": {
    et: "Sisesta kehtiv sünniaeg",
    en: "Enter a valid date of birth",
  },
  "validation.deathDateInvalid": {
    et: "Sisesta kehtiv surmaaeg",
    en: "Enter a valid date of death",
  },
  "validation.deathBeforeBirth": {
    et: "Surmaaeg peab olema hilisem kui sünniaeg",
    en: "Date of death must be after date of birth",
  },
  "validation.generic": {
    et: "Andmed ei ole õiged",
    en: "The data is invalid",
  },
} as const satisfies Record<string, Record<Language, string>>;

export type TranslationKey = keyof typeof translations;

export interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

export const LanguageContext = createContext<LanguageContextValue | null>(null);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}

import { createContext, useContext } from "react";

export type Language = "et" | "en";

export type TranslationKey =
  | "nav.home"
  | "nav.ads"
  | "nav.addAd"
  | "nav.lightMode"
  | "nav.darkMode"
  | "home.title"
  | "home.empty"
  | "home.loadError"
  | "home.loadConfigError"
  | "home.addAdHeading"
  | "home.addAdCta"
  | "home.addAdIntro"
  | "home.searchPlaceholder"
  | "home.searchLabel"
  | "home.sortLabel"
  | "home.sortNewest"
  | "home.sortOldest"
  | "home.resultCount"
  | "home.noSearchResults"
  | "home.clearSearch"
  | "home.sectionHeading"
  | "detail.backToList"
  | "share.button"
  | "share.copied"
  | "share.copyFailed"
  | "form.pageTitle"
  | "form.pageIntro"
  | "form.previewTitle"
  | "form.requiredNote"
  | "form.optional"
  | "form.emailHelp"
  | "form.successTitle"
  | "form.successMessage"
  | "form.viewAd"
  | "form.createAnother"
  | "form.poem"
  | "form.poemPlaceholder"
  | "form.topText"
  | "form.topTextPlaceholder"
  | "form.name"
  | "form.namePlaceholder"
  | "form.birthDate"
  | "form.birthDatePlaceholder"
  | "form.deathDate"
  | "form.deathDatePlaceholder"
  | "form.mourners"
  | "form.mournersPlaceholder"
  | "form.email"
  | "form.emailPlaceholder"
  | "form.save"
  | "form.serverFallback"
  | "form.genericError"
  | "card.crossAlt"
  | "validation.nameRequired"
  | "validation.nameMax"
  | "validation.emailInvalid"
  | "validation.emailMax"
  | "validation.poemMax"
  | "validation.topTextMax"
  | "validation.bottomTextMax"
  | "validation.birthDateInvalid"
  | "validation.deathDateInvalid"
  | "validation.deathBeforeBirth"
  | "validation.generic";

export const translations: Record<Language, Record<TranslationKey, string>> = {
  et: {
    "nav.home": "Avaleht",
    "nav.ads": "Surmakuulutused",
    "nav.addAd": "Lisa kuulutus",
    "nav.lightMode": "Hele",
    "nav.darkMode": "Tume",
    "home.title": "Surmakuulutused",
    "home.empty": "Kuulutusi pole veel lisatud.",
    "home.loadError": "Kuulutuste laadimine ebaõnnestus.",
    "home.loadConfigError":
      "Kuulutuste laadimine ebaõnnestus. Kontrolli, et MONGO_URI on .env.local failis olemas.",
    "home.addAdHeading": "Lisa kuulutus",
    "home.addAdCta": "Lisa kuulutus",
    "home.addAdIntro": "Avalda mälestuskuulutus väärikas ja rahulikus vormis.",
    "home.searchPlaceholder": "Otsi nime järgi",
    "home.searchLabel": "Otsi nime järgi",
    "home.sortLabel": "Sorteeri kuulutusi",
    "home.sortNewest": "Uuemad",
    "home.sortOldest": "Vanemad",
    "home.resultCount": "kuulutust",
    "home.noSearchResults": "Selle nimega kuulutusi ei leitud.",
    "home.clearSearch": "Tühjenda otsing",
    "home.sectionHeading": "Viimased kuulutused",
    "detail.backToList": "Tagasi kuulutuste juurde",
    "share.button": "Kopeeri kuulutuse link",
    "share.copied": "Link kopeeritud",
    "share.copyFailed": "Linki ei õnnestunud kopeerida",
    "form.pageTitle": "Lisa surmakuulutus",
    "form.pageIntro": "Koosta mälestuskuulutus rahulikus ajalehevormis.",
    "form.previewTitle": "Eelvaade",

    "form.optional": "valikuline",
    "form.emailHelp": "E-maili ei kuvata avalikus kuulutuses.",
    "form.successTitle": "Kuulutus avaldatud",
    "form.successMessage": "Mälestuskuulutus on lisatud.",
    "form.viewAd": "Vaata kuulutust",
    "form.createAnother": "Lisa uus kuulutus",
    "form.poem": "Luuletus",
    "form.poemPlaceholder": `Mälestusteks tuhmunud me aeg.
Pisarateks Sinu kaunis naer.
Tühjuseks on roogitud mu hing.
Ja südames vaid igatsen ma Sind.`,
    "form.topText": "Tekst enne lahkunu nime",
    "form.topTextPlaceholder": "Teatame kurbusega, et lahkus meie kallis",
    "form.name": "Nimi",
    "form.namePlaceholder": "ema",
    "form.birthDate": "Sünniaeg",
    "form.birthDatePlaceholder": "19.01.1992",
    "form.deathDate": "Surmaaeg",
    "form.deathDatePlaceholder": "23.03.2026",
    "form.mourners": "Leinajad",
    "form.mournersPlaceholder": "Leinab Rein perega",
    "form.email": "Kuulutuse lisaja e-mail",
    "form.emailPlaceholder": "nimi@gmail.com",
    "form.save": "Avalda kuulutus",
    "form.serverFallback": "Midagi läks valesti",
    "form.genericError": "Midagi läks valesti! Proovi uuesti.",
    "card.crossAlt": "rist",
    "validation.nameRequired": "Nimi on kohustuslik",
    "validation.nameMax": "Nimi võib olla kuni 100 tähemärki",
    "validation.emailInvalid": "Sisesta kehtiv e-mail",
    "validation.emailMax": "E-mail võib olla kuni 254 tähemärki",
    "validation.poemMax": "Luuletus võib olla kuni 300 tähemärki",
    "validation.topTextMax":
      "Tekst enne lahkunu nime võib olla kuni 100 tähemärki",
    "validation.bottomTextMax": "Leinajad võivad olla kuni 100 tähemärki",
    "validation.birthDateInvalid": "Sisesta kehtiv sünniaeg",
    "validation.deathDateInvalid": "Sisesta kehtiv surmaaeg",
    "validation.deathBeforeBirth": "Surmaaeg peab olema hilisem kui sünniaeg",
    "validation.generic": "Andmed ei ole õiged",
  },
  en: {
    "nav.home": "Home",
    "nav.ads": "Obituaries",
    "nav.addAd": "Add obituary",
    "nav.lightMode": "Light",
    "nav.darkMode": "Dark",
    "home.title": "Obituaries",
    "home.empty": "No obituaries have been added yet.",
    "home.loadError": "Failed to load obituaries.",
    "home.loadConfigError":
      "Failed to load obituaries. Check that MONGO_URI exists in .env.local.",
    "home.addAdHeading": "Add obituary",
    "home.addAdCta": "Add obituary",
    "home.addAdIntro": "Publish a memorial notice in a quiet, dignified form.",
    "home.searchPlaceholder": "Search by name",
    "home.searchLabel": "Search by name",
    "home.sortLabel": "Sort obituaries",
    "home.sortNewest": "Newest",
    "home.sortOldest": "Oldest",
    "home.resultCount": "obituaries",
    "home.noSearchResults": "No obituaries match that name.",
    "home.clearSearch": "Clear search",
    "home.sectionHeading": "Latest notices",
    "detail.backToList": "Back to notices",
    "share.button": "Copy obituary link",
    "share.copied": "Link copied!",
    "share.copyFailed": "Failed to copy link",
    "form.pageTitle": "Add obituary",
    "form.pageIntro": "Create a memorial notice in a calm newspaper form.",
    "form.previewTitle": "Preview",

    "form.optional": "optional",
    "form.emailHelp": "The email address is not shown publicly.",
    "form.successTitle": "Obituary published",
    "form.successMessage": "The memorial notice has been added.",
    "form.viewAd": "View obituary",
    "form.createAnother": "Create another",
    "form.poem": "Poem",
    "form.poemPlaceholder": `Time faded into memories.
Your beautiful laugh into tears.
My soul has emptied into silence.
My heart still longs for you.`,
    "form.topText": "Text before the deceased's name",
    "form.topTextPlaceholder":
      "With sadness we announce the passing of our dear",
    "form.name": "Name",
    "form.namePlaceholder": "mother",
    "form.birthDate": "Date of birth",
    "form.birthDatePlaceholder": "19.01.1992",
    "form.deathDate": "Date of death",
    "form.deathDatePlaceholder": "23.03.2026",
    "form.mourners": "Mourners",
    "form.mournersPlaceholder": "Mourned by Rein and family",
    "form.email": "Submitter email",
    "form.emailPlaceholder": "name@gmail.com",
    "form.save": "Publish obituary",
    "form.serverFallback": "Something went wrong",
    "form.genericError": "Something went wrong! Try again.",
    "card.crossAlt": "cross",
    "validation.nameRequired": "Name is required",
    "validation.nameMax": "Name can be up to 100 characters",
    "validation.emailInvalid": "Enter a valid email",
    "validation.emailMax": "Email can be up to 254 characters",
    "validation.poemMax": "Poem can be up to 300 characters",
    "validation.topTextMax":
      "Text before the deceased's name can be up to 100 characters",
    "validation.bottomTextMax": "Mourners can be up to 100 characters",
    "validation.birthDateInvalid": "Enter a valid date of birth",
    "validation.deathDateInvalid": "Enter a valid date of death",
    "validation.deathBeforeBirth": "Date of death must be after date of birth",
    "validation.generic": "The data is invalid",
  },
};

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

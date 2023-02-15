import config from "../../config";
// import i18n from ".";
import { get_lang_data, language_exists, label } from ".";
import { ts2date } from "./time";
import i18n_languages from "./languages.json";

describe("I18N Tests", () => {

    it("Checks i18n data exists for the default language", async () => {

        const i18n_data = get_lang_data(config.i18n.default_language);

        expect(Object.keys(i18n_data).length === 0).toBe(false);

    });

    it("Returns an error for a non existent language", async () => {

        expect(language_exists("xx")).toBe(false);

    });

    it("Checks is i18n data has all languages", async () => {

        for (const languages_data of i18n_languages) {

            const lang_code = languages_data[2] as string;

            expect(language_exists(lang_code)).toBe(true);

        }

    });

    it("Checks a label in all languages", async () => {

        expect(label("en", "YES")).toMatch("Yes");
        expect(label("es", "YES")).toMatch("Si");
        expect(label("zh", "YES")).toMatch("是的");
        expect(label("pt", "YES")).toMatch("Sim");
        expect(label("fr", "YES")).toMatch("Oui");
        expect(label("de", "YES")).toMatch("Ja");
        expect(label("it", "YES")).toMatch("Sì");
        expect(label("ko", "YES")).toMatch("네");
        expect(label("ja", "YES")).toMatch("あり");
        expect(label("he", "YES")).toMatch("כן");
        expect(label("ru", "YES")).toMatch("Да");

    });

    it("Returns timestamp formated to date", async () => {

        const timestamp = 1612025044000;

        const date = ts2date({timestamp});

        expect(date).toMatch("Saturday, January 30 2021, 13:44:04");

    });

    it("Checks Full ICU is on the server", async () => {

        const january = new Date(9e8);
        const spanish = new Intl.DateTimeFormat("es", { month: "long" });

        expect(spanish.format(january)).toMatch("enero");

    });

    it("Checks a label that is not on the i18n data", async () => {

        expect(label("en", "13291887A9D75B55B1AABD87")).toMatch("[13291887A9D75B55B1AABD87]");

    });

});

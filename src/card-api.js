// card-api.ts
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { openDB } from 'idb';
let dbInstance = null;
/**
 * Initializes the card database.
 * @returns {Promise<IDBPDatabase<CardDataSchema>>} The database instance.
 */
function initDB() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!dbInstance) {
            dbInstance = yield openDB('YuGiOhDB', 1, {
                upgrade(db) {
                    db.createObjectStore('cards');
                    db.createObjectStore('images');
                },
            });
        }
        return dbInstance;
    });
}
/**
 * Fetches card information from the Yu-Gi-Oh! API.
 * @param url The URL to fetch the card information from.
 * @param db The database to store the card information in.
 * @param fetcher The fetch function to use.
 * @returns {Promise<CardInformation | null>} The card information.
 */
function getCardInformation(url_1, db_1) {
    return __awaiter(this, arguments, void 0, function* (url, db, fetcher = fetch) {
        try {
            const response = yield fetcher(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = yield response.json();
            if (data.data && data.data.length > 0) {
                const card = data.data[0];
                yield db.put('cards', card, card.id.toString());
                yield db.put('cards', card, card.name);
                return card;
            }
            else {
                console.error(`No card found at ${url}`);
                return null;
            }
        }
        catch (error) {
            console.error('Error fetching card data:', error);
            return null;
        }
    });
}
/**
 * Gets card information by ID.
 * @param id The ID of the card.
 * @param fetcher The fetch function to use.
 * @param dbFactory The database factory function.
 * @returns {Promise<CardInformation | null>} The card information.
 */
export function getCardById(id_1) {
    return __awaiter(this, arguments, void 0, function* (id, fetcher = fetch, dbFactory = initDB) {
        var _a;
        const db = yield dbFactory();
        const cachedCard = (_a = yield db.get('cards', id.toString())) !== null && _a !== void 0 ? _a : null;
        if (cachedCard)
            return cachedCard;
        const url = new URL('https://db.ygoprodeck.com/api/v7/cardinfo.php');
        url.searchParams.append('id', id.toString());
        return yield getCardInformation(url, db, fetcher);
    });
}
/**
 * Gets card information by name.
 * @param name The name of the card.
 * @param fetcher The fetch function to use.
 * @param dbFactory The database factory function.
 * @returns {Promise<CardInformation | null>} The card information.
 */
export function getCardByName(name_1) {
    return __awaiter(this, arguments, void 0, function* (name, fetcher = fetch, dbFactory = initDB) {
        var _a;
        const db = yield dbFactory();
        const cachedCard = (_a = yield db.get('cards', name)) !== null && _a !== void 0 ? _a : null;
        if (cachedCard)
            return cachedCard;
        const url = new URL('https://db.ygoprodeck.com/api/v7/cardinfo.php');
        url.searchParams.append('name', encodeURIComponent(name));
        return yield getCardInformation(url, db, fetcher);
    });
}
/**
 * Searches for cards using a fuzzy search query.
 * @param query The query to search for.
 * @param fetcher The fetch function to use.
 * @param dbFactory The database factory function.
 * @returns {Promise<CardInformation[]>} The card information.
 */
export function fuzzySearchCard(query_1) {
    return __awaiter(this, arguments, void 0, function* (query, fetcher = fetch, dbFactory = initDB) {
        const db = yield dbFactory();
        const url = new URL('https://db.ygoprodeck.com/api/v7/cardinfo.php');
        url.searchParams.append('fname', encodeURIComponent(query));
        try {
            const response = yield fetcher(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = yield response.json();
            if (data.data && data.data.length > 0) {
                yield Promise.all(data.data.map((card) => __awaiter(this, void 0, void 0, function* () {
                    yield db.put('cards', card, card.id.toString());
                    yield db.put('cards', card, card.name);
                })));
                return data.data;
            }
            else {
                console.error(`No cards found matching query ${query}`);
                return [];
            }
        }
        catch (error) {
            console.error('Error fetching card data:', error);
            return [];
        }
    });
}
/**
 * Gets the image of a card by ID or name.
 * @param idOrName The ID or name of the card.
 * @param fetcher The fetch function to use.
 * @param dbFactory The database factory function.
 * @returns {Promise<Blob | null>} The card image.
 */
export function getCardImage(idOrName_1) {
    return __awaiter(this, arguments, void 0, function* (idOrName, fetcher = fetch, dbFactory = initDB) {
        const db = yield dbFactory();
        let card;
        if (typeof idOrName === 'number') {
            card = yield getCardById(idOrName, fetcher, dbFactory);
        }
        else {
            card = yield getCardByName(idOrName, fetcher, dbFactory);
        }
        if (!card) {
            console.error(`No card found for ${idOrName}`);
            return null;
        }
        const imageUrl = card.card_images[0].image_url;
        const cachedImage = yield db.get('images', imageUrl);
        if (cachedImage)
            return cachedImage;
        try {
            const response = yield fetcher(imageUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const imageBlob = yield response.blob();
            yield db.put('images', imageBlob, imageUrl);
            return imageBlob;
        }
        catch (error) {
            console.error('Error fetching image:', error);
            return null;
        }
    });
}
/**
 * Clears the card database.
 * @param dbFactory The database factory function.
 */
export function clearCardDatabase() {
    return __awaiter(this, arguments, void 0, function* (dbFactory = initDB) {
        const db = yield dbFactory();
        yield db.clear('cards');
        yield db.clear('images');
    });
}

export default class User {
    static storeKey = "user";
    static storage = sessionStorage;

    #name;
    #publicKey;
    #secretKey;

    constructor(name, publicKey, secretKey) {
        this.#name = name;
        this.#publicKey = publicKey;
        this.#secretKey = secretKey;
    }

    static tryLoad() {
        let userFromStorage = User.load(User.storage);
        if (userFromStorage) {
            return userFromStorage;
        }
        const keyPair = nacl.sign.keyPair();
        const { publicKey, secretKey } = keyPair;
        const name = nacl.util.encodeBase64(publicKey).slice(0, 9);
        const user = new User(name, publicKey, secretKey);
        User.store(user);
        return user;
    }

    static load(storage) {
        const userValue = storage.getItem(User.storeKey);
        if (!userValue) {
            return null;
        }
        const data = JSON.parse(userValue);
        if (!data) {
            return null;
        }
        return new User(data.name, new Uint8Array(data.publicKey), new Uint8Array(data.secretKey));
    }

    static store(user) {
        const data = {
            name: user.#name,
            publicKey: Array.from(user.#publicKey),
            secretKey: Array.from(user.#secretKey),
        };
        User.storage.setItem(User.storeKey, JSON.stringify(data));
    }

    getName() {
        return this.#name;
    }

    setName(name) {
        this.#name = name;
        User.store(this);
    }

    getPublicKey() {
        return this.#publicKey;
    }

    getId() {
        let encoded = nacl.util.encodeBase64(this.#publicKey);
        encoded = encoded.replace(/\W/g, "");
        return encoded.slice(0, 16);
    }
}
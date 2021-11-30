export class Author {
    constructor(first = 'John', last = 'Doe') {
        this.first_name = first;
        this.last_name = last;
        this._id = generateRandom(32);
    }
}

export class Book {
    constructor(name = 'Default', isbn = 'Unknown', author_id) {
        this.name = name;
        this.isbn = isbn;
        this.author = author_id;
        this._id = generateRandom(32);
    }
}

function generateRandom(charLength) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < charLength; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

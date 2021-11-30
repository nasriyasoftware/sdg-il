/* This is a JavaScript web module (JSW).
   The reason the file is names with the (.js) extetion instead of the (.jsw) is only for styling purposes */
import data from 'wix-data';

export function isValidAuthorID(id) {
    if (id.length !== 32) { return false }
    return getAuthor(id).then((author) => { return author ? true : false })
}

export function getBook(id) {
    return data.query('Books').eq('_id', id).include('author').limit(1).find({ suppressAuth: true }).then((x) => { return x.items[0] });
}

export function getAuthor(id) {
    return data.get('Authors', id, { suppressAuth: true });
}

export function deleteBook(id) {
    return data.remove('Books', id, { suppressAuth: true });
}

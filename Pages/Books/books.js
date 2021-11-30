import { fetch } from 'wix-fetch';
import { deleteBook } from 'backend/functions.jsw';

$w.onReady(function () {
    $w('#booksRep').onItemReady(($n, data, i) => {
        $n('#bookName').label = data.name;
        $n('#bookName, #view').link = `/book/${data._id}`;
        $n('#edit').link = `/book/${data._id}/edit`;
        $n('#bookName, #view, #edit').target = '_self';
        $n('#delete').onClick(() => {
            const items = $w('#booksRep').data;
            items.splice(i, 1);
            $w('#booksRep').data = items;
            deleteBook(data._id);
            if (items.length === 0) { $w('#app').changeState('noData') }
        })
    })

    $w('#errTrigger').onClick(() => updateBooks());
    $w('#new').link = '/books/new';
    updateBooks();
});

async function updateBooks() {
    try {
        $w('#app').changeState('placeholder');
        const result = await retrieveBooks();

        if (result.type === 'books') {
            $w('#booksRep').data = result.books;
            $w('#app').changeState(result.books.length > 0 ? 'data' : 'noData');
        } else {
            throw { message: 'Unexpected result!', result }
        }
    } catch (err) {
        console.error(err);
        $w('#app').changeState('error');
    }
}

function retrieveBooks() {
    const url = 'https://nasriyasoftware.wixsite.com/sdg-il/_functions/books';
    const options = {
        method: 'GET',
        headers: { accept: 'application/json' }
    }

    return fetch(url, options).then(async (httpResponse) => {
        if (httpResponse.ok) {
            return httpResponse.json().catch(() => { return null });
        } else {
            const error = await httpResponse.json().catch(() => { return null });
            throw error;
        }
    }).catch(err => {
        console.error(err)
        if (err?.type === 'error') { return Promise.reject(err) }
        return Promise.reject({ type: 'error', error: err, message: 'Unable to retrieve items.' })
    })
}

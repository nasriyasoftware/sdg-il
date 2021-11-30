import { getRouterData as getData, browserLocale } from 'wix-window';
import { to as navigate } from 'wix-location';
import { deleteBook } from 'backend/functions.jsw';

const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }

$w.onReady(function () {
    const book = getData();

	$w('#creation').text = `Created on: ${new Date(book._createdDate.$date).toLocaleDateString(browserLocale, dateOptions)} | Last Update: ${new Date(book._updatedDate.$date).toLocaleDateString(browserLocale, dateOptions)}`;
    $w('#nameH2, #name').text = book.name;
    $w('#isbn').text = book.isbn;
    $w('#author').text = `${book.author.first_name} ${book.author.last_name}`;
    $w('#edit').link = `/book/${book._id}/edit`;
    $w('#delete').onClick(() => {
		deleteBook(book._id);
		navigate('/books');
    })
});

import { fetch } from 'wix-fetch';
import { getRouterData as getData } from 'wix-window';

const form = {
    savedData: { name: null, isbn: null, author: null },
    data: { _id: null, name: null, isbn: null, author: null },
    save: async () => {},
    send: async () => { return Promise.resolve({ _id: '', name: null, isbn: null, author: null }) },
    reset: () => {},
    areSameValues: () => { return false },
    validity: {
        valid: false,
        validate: () => { return false }
    }
}

$w.onReady(function () {
    ini_page();
    ini_form();
    ini_events_handlers();
    $w('#app').changeState('form');
});

function ini_page() {
    const data = getData();
    form.data._id = data?._id;
    $w('#name').value = form.savedData.name = form.data.name = data?.name;
    $w('#isbn').value = form.savedData.isbn = form.data.isbn = data?.isbn;
    $w('#author').value = form.savedData.author = form.data.author = data?.author._id;
}

function ini_form() {
    form.areSameValues = () => {
        const same = [];
        for (const prop in form.savedData) {
            if (form.savedData[prop] === form.data[prop]) { same.push(prop) }
        }

        return same.length === Object.keys(form.savedData).length ? true : false;
    }

    form.validity.validate = () => {
        form.validity.valid = false;
        $w('#nameError, #isbnError, #authorError, #mainError').collapse();
        $w('#saveBtn').disable();
        let errorMsg = '';
        let validFields = [];

        const fields = ['name', 'isbn', 'author'];
        for (const field of fields) {
            const $field = $w(`#${field}`);
            if (!$field.valid) {
                form.data[field] = null;
                if (!errorMsg) { errorMsg = $field.validationMessage }
                $w(`#${field}Error`).expand();
            } else {
                form.data[field] = $field.value;
                validFields.push(field);
            }
        }

        if (validFields.length === fields.length) {
            form.validity.valid = true;
            if (form.areSameValues()) {
                $w('#saveBtn').disable();
            } else {
                $w('#saveBtn').enable();
            }
        } else {
            $w('#mainError').text = errorMsg || 'An error occurred!';
            $w('#mainError').expand();
        }

        return form.validity.valid;
    }

    form.reset = () => {
        $w('#name, #isbn, #author').value = '';
        $w('#name, #isbn, #author').resetValidityIndication();
        $w('#nameError, #isbnError, #authorError, #mainError').collapse();
        $w('#saveBtn').disable();
        $w('#app').changeState('form');
    }

    form.save = () => {
        $w('#loadingMsg').text = 'Saving..';
        $w('#app').changeState('placeholder');

        return form.send().then((new_book) => {
            $w('#name').value = form.savedData.name = form.data.name = new_book.name;
            $w('#isbn').value = form.savedData.isbn = form.data.isbn = new_book.isbn;
            $w('#author').value = form.savedData.author = form.data.author = new_book.author;

            form.validity.validate();
            $w('#savedMsg').expand()
            $w('#app').changeState('form').then(() => {
                setTimeout(() => $w('#savedMsg').collapse(), 5e3);
            })
        }).catch(err => {
            console.error(err);
            $w('#submitError').text = err.message;
            $w('#app').changeState('error').then(() => setTimeout(() => { form.reset() }, 10e3))
        })
    }

    form.send = () => {
        const url = `https://nasriyasoftware.wixsite.com/sdg-il/_functions/book/${form.data._id}`;
        const options = {
            method: 'PUT',
            headers: { accept: 'application/json' },
            body: JSON.stringify(form.data)
        }

        return fetch(url, options).then(async (httpResponse) => {
            if (httpResponse.ok) {
                const json = await httpResponse.json().catch(err => { return {} });
                return Promise.resolve(json.book);
            } else {
                const error = await httpResponse.json().catch(() => { return null });
                throw error;
            }
        }).catch(err => {
            return Promise.reject(err);
        })
    }
}

function ini_events_handlers() {
    $w('#name').onCustomValidation((value, reject) => {
        if (typeof value === 'string' && value.length > 0) {
            if (value.length < 3) { reject('The book name is too short.') }
        } else {
            reject('Please enter the name of the book.')
        }
    })

    $w('#isbn').onCustomValidation((value, reject) => {
        if (typeof value === 'string' && value.length > 0) {
            if (value.length < 5) { reject('The book isbn is too short.') }
        } else {
            reject('Please enter the isbn of the book.')
        }
    })

    $w('#author').onCustomValidation((value, reject) => {
        if (typeof value === 'string' && value.length > 0) {
            if (value.length !== 32) { return reject(`The author ID should be 32 characters long.${value.length < 32 ? ` ${32 - value.length} characters left` : ` Delete ${value.length - 32} characters.`}`) }
        } else {
            reject('Please enter the isbn of the book.')
        }
    })

    $w('#name, #isbn, #author').onInput(event => {
        const value = event.target.value;
        event.target.value = value;
        form.validity.validate();
    })

    $w('#saveBtn').onClick(() => form.save());
    $w('#explore').link = '/books';
    $w('#view').link = `/book/${form.data._id}`;
}

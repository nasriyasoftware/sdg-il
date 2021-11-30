import { fetch } from 'wix-fetch';

const form = {
    data: { name: null, isbn: null, author: null },
    submit: async () => {},
    send: async () => { return Promise.resolve({ _id: '' }) },
    reset: () => {},
    validity: {
        valid: false,
        validate: () => { return false }
    }
}

$w.onReady(function () {
    ini_form();
    ini_events_handlers();
    $w('#app').changeState('form');
});

function ini_form() {
    form.validity.validate = () => {
        form.validity.valid = false;
        $w('#nameError, #isbnError, #authorError, #mainError').collapse();
        $w('#createBtn').disable();
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
            $w('#createBtn').enable();
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
        $w('#createBtn').disable();
        $w('#app').changeState('form');
    }

    form.submit = () => {
        $w('#loadingMsg').text = 'Creating a new book ..';
        $w('#app').changeState('placeholder');
        
        return form.send().then((new_book) => {
            $w('#view').link = `/book/${new_book._id}`;
            $w('#app').changeState('success');
        }).catch(err => {
            console.error(err);
            $w('#submitError').text = err.message;
            $w('#app').changeState('error').then(() => setTimeout(() => { form.reset() }, 10e3))
        })
    }

    form.send = () => {
        const url = 'https://nasriyasoftware.wixsite.com/sdg-il/_functions/book';
        const options = {
            method: 'POST',
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
            reject('Please enter the author ID.')
        }
    })

    $w('#name, #isbn, #author').onInput(event => {
        const value = event.target.value;
        event.target.value = value;
        form.validity.validate();
    })

    $w('#done').onClick(() => form.reset());
    $w('#createBtn').onClick(() => form.submit());
    $w('#explore').link = '/books';
}

import { fetch } from 'wix-fetch';

const form = {
    data: { first_name: null, last_name: null },
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
        $w('#firstError, #lastError, #mainError').collapse();
        $w('#createBtn').disable();
        let errorMsg = '';
        let validFields = [];

        const fields = ['first', 'last'];
        for (const field of fields) {
            const $field = $w(`#${field}`);
            if (!$field.valid) {
                form.data[`${field}_name`] = null;
                if (!errorMsg) { errorMsg = $field.validationMessage }
                $w(`#${field}Error`).expand();
            } else {
                form.data[`${field}_name`] = $field.value;
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
        $w('#first, #last').value = '';
        $w('#first, #last').resetValidityIndication();
        $w('#firstError, #lastError, #mainError').collapse();
        $w('#createBtn').disable();
        $w('#app').changeState('form');
    }

    form.submit = () => {
        $w('#loadingMsg').text = 'Creating a new author ..';
        $w('#app').changeState('placeholder');
        
        return form.send().then((new_author) => {
            $w('#authorID').text = `Author ID:\n${new_author._id}.`;
            $w('#app').changeState('success');
        }).catch(err => {
            console.error(err);
            $w('#submitError').text = err.message;
            $w('#app').changeState('error').then(() => setTimeout(() => { form.reset() }, 10e3))
        })
    }

    form.send = () => {
        const url = 'https://nasriyasoftware.wixsite.com/sdg-il/_functions/author';
        const options = {
            method: 'POST',
            headers: { accept: 'application/json' },
            body: JSON.stringify(form.data)
        }

        return fetch(url, options).then(async (httpResponse) => {
            if (httpResponse.ok) {
                const json = await httpResponse.json().catch(err => { return {} });
                return Promise.resolve(json.author);
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
    $w('#first').onCustomValidation((value, reject) => {
        if (typeof value === 'string' && value.length > 0) {
            if (value.length < 3) { reject('The author\'s first name is too short.') }
        } else {
            reject('Please enter the author\'s first name.')
        }
    })

    $w('#last').onCustomValidation((value, reject) => {
        if (typeof value === 'string' && value.length > 0) {
            if (value.length < 3) { reject('The author\'s last name is too short.') }
        } else {
            reject('Please enter the author\'s last name.')
        }
    })   

    $w('#first, #last').onInput(event => {
        const value = event.target.value;
        event.target.value = value;
        form.validity.validate();
    })

    $w('#done').onClick(() => form.reset());
    $w('#createBtn').onClick(() => form.submit());
}

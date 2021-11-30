import { ok, badRequest, serverError, notFound, created } from 'wix-http-functions';
import { isValidAuthorID, getBook, getAuthor } from 'backend/functions.jsw';
import { Book, Author } from 'public/classes.js';
import data from 'wix-data';

const response = {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    body: {}
}

/**
 * @param {wix_http_functions.WixHttpFunctionRequest} request
 */

export async function use_author(request) {
    if (!isValidAccept(request)) {
        response.body = {
            type: 'Bad Request',
            message: 'Your "accept" header specifies a non supported response by this endpoint',
            code: 400
        }
        return badRequest(response);
    }

    const method = request.method;
    const author_id = request.path[0];

    if (method === 'GET' || method === 'PUT' || method === 'POST') {
        if (method === 'POST') {
            const reqObj = await request.body.json().catch(() => { return null }).catch(() => { return null });

            if (reqObj && typeof reqObj === 'object' && Object.keys(reqObj).length > 0) {
                if (reqObj.first_name && reqObj.last_name) {
                    const new_author = new Author(reqObj.first_name, reqObj.last_name);
                    return data.insert('Authors', new_author, { suppressAuth: true }).then(() => {
                        response.body = { type: 'Created', author: new_author }
                        return created(response);
                    }).catch(error => {
                        response.body = {
                            type: 'Server Error',
                            code: 500,
                            message: 'Unable to create a new author.',
                            error
                        }

                        return serverError(response);
                    })
                } else {
                    response.body = {
                        type: 'Bad Request',
                        code: 400,
                        message: 'The request body is missing some or all of the required fields.',
                        data: {
                            request_data: reqObj,
                            required_fields: 'The author\'s "first_name", and "last_name".'
                        }
                    }

                    return badRequest(response);
                }
            }

            response.body = {
                type: 'Bad Request',
                code: 400,
                message: 'The request body is missing or invalid!'
            }

            return badRequest(response);
        }

        if (author_id && author_id.length === 32) {
            if (method === 'GET') {
                const author = await getAuthor(author_id);
                if (author) {
                    response.body = { type: 'author', author }
                    return ok(response);
                } else {
                    response.body = {
                        type: 'Not Found',
                        code: 404,
                        message: `Unable to find an author with the ID of ${author_id}`
                    }
                    return notFound(response);
                }
            }

            if (method === 'PUT') {
                const author = await getAuthor(author_id);
                if (author) {
                    const reqObj = await request.body.json().catch(() => { return null });

                    if (reqObj && typeof reqObj === 'object' && Object.keys(reqObj).length > 0) {
                        let has_valid_properties = false;
                        if (reqObj.first_name) {
                            author.first_name = reqObj.first_name;
                            has_valid_properties = true
                        }
                        if (reqObj.last_name) {
                            author.last_name = reqObj.last_name;
                            has_valid_properties = true
                        }

                        if (has_valid_properties) {
                            return data.update('Authors', author, { suppressAuth: true }).then((item) => {
                                response.body = {
                                    type: 'author',
                                    last_update: item._updatedDate.toISOString(),
                                    author: item
                                }

                                return ok(response);
                            }).catch(error => {
                                response.body = {
                                    type: 'Server Error',
                                    code: 500,
                                    message: 'Unable to update the author.',
                                    error
                                }

                                return serverError(response);
                            })
                        } else {
                            response.body = {
                                type: 'Bad Request',
                                code: 400,
                                message: 'The request body has no valid properties to update!'
                            }

                            return badRequest(response);
                        }
                    }

                    response.body = {
                        type: 'Bad Request',
                        code: 400,
                        message: 'The request body is missing or invalid!'
                    }

                    return badRequest(response);

                } else {
                    response.body = {
                        type: 'Not Found',
                        code: 404,
                        message: `Unable to find an author with the ID of ${author_id}`
                    }
                    return notFound(response);
                }
            }
        } else {
            response.body = {
                type: 'Bad Request',
                code: 400
            }

            if (!author_id && !response.body.message) { response.body.message = 'The author ID is missing.' }
            if (author_id.length !== 32 && !response.body.message) { response.body.message = 'The author ID should be 32 characters long.' }
            return badRequest(response);
        }
    } else {
        response.body = {
            type: 'Bad Request',
            code: 400,
            message: `The method "${method}" is not supported on this endpoint.`
        }

        return badRequest(response);
    }
}

export async function use_book(request) {
    if (!isValidAccept(request)) {
        response.body = {
            type: 'Bad Request',
            message: 'Your "accept" header specifies a non supported response by this endpoint',
            code: 400
        }
        return badRequest(response);
    }

    const method = request.method;
    const book_id = request.path[0];

    if (method === 'GET' || method === 'PUT' || method === 'POST') {
        if (method === 'POST') {
            const reqObj = await request.body.json().catch(() => { return null }).catch(() => { return null });

            if (reqObj && typeof reqObj === 'object' && Object.keys(reqObj).length > 0) {
                const checkAuthorID = async (id) => {
                    if (reqObj.author.length !== 32) {
                        response.body = { type: 'Bad Request', code: 400, message: `The author ID should be 32 characters long, but got one with ${id.length}` }
                        return { code: 400 }
                    }

                    if (await isValidAuthorID(reqObj.author)) {
                        return { code: 200 }
                    } else {
                        response.body = { type: 'Bad Request', code: 400, message: `Unable to create a book with this author ID "${id}" - No author was found with this ID.` }
                        return { code: 400 }
                    }
                }

                const item = {}
                if (reqObj.name) { item.name = reqObj.name }
                if (reqObj.isbn) { item.isbn = reqObj.isbn }
                if (reqObj.author) {
                    if (typeof reqObj.author === 'string') {
                        const check = await checkAuthorID(reqObj.author);
                        if (check.code === 200) { item.author = reqObj.author } else { return badRequest(response) }
                    }

                    if (reqObj.author.id && typeof reqObj.author.id === 'string') {
                        const check = await checkAuthorID(reqObj.author.id);
                        if (check.code === 200) { item.author = reqObj.author.id } else { return badRequest(response) }
                    }
                }

                if (Object.keys(item).length === 3) {
                    const new_book = new Book(item.name, item.isbn, item.author);
                    return data.insert('Books', new_book, { suppressAuth: true }).then(() => {
                        response.body = { type: 'Created', book: new_book }
                        return created(response);
                    }).catch(error => {
                        response.body = {
                            type: 'Server Error',
                            code: 500,
                            message: 'Unable to create a new book.',
                            error
                        }

                        return serverError(response);
                    })
                } else {
                    response.body = {
                        type: 'Bad Request',
                        code: 400,
                        message: 'The request body is missing some or all of the required fields.',
                        data: {
                            request_data: reqObj,
                            required_fields: 'The books\'s "name", "isbn", and the "author" ID.'
                        }
                    }

                    return badRequest(response);
                }
            }

            response.body = {
                type: 'Bad Request',
                code: 400,
                message: 'The request body is missing or invalid!'
            }

            return badRequest(response);
        }

        if (book_id && book_id.length === 32) {
            if (method === 'GET') {
                const book = await getBook(book_id);
                if (book) {
                    response.body = { type: 'book', book }
                    return ok(response);
                } else {
                    response.body = {
                        type: 'Not Found',
                        code: 404,
                        message: `Unable to find a book with the ID of ${book_id}`
                    }
                    return notFound(response);
                }
            }

            if (method === 'PUT') {
                const book = await getBook(book_id);
                if (book) {
                    const reqObj = await request.body.json().catch(() => { return null });

                    if (reqObj && typeof reqObj === 'object' && Object.keys(reqObj).length > 0) {
                        let has_valid_properties = false;
                        if (reqObj.name) {
                            book.name = reqObj.name;
                            has_valid_properties = true
                        }
                        if (reqObj.isbn) {
                            book.isbn = reqObj.isbn;
                            has_valid_properties = true
                        }
                        if (reqObj.author) {
                            const valid = await isValidAuthorID(reqObj.author);
                            if (valid) {
                                book.author = reqObj.author;
                                has_valid_properties = true
                            } else {
                                response.body = { type: 'Bad Request', code: 400, message: 'Unable to update the book because the passed author ID didn\'t match any author.' }
                                return badRequest(response);
                            }
                        }

                        if (has_valid_properties) {
                            return data.update('Books', book, { suppressAuth: true }).then((item) => {
                                response.body = {
                                    type: 'book',
                                    last_update: item._updatedDate.toISOString(),
                                    book: item
                                }

                                return ok(response);
                            }).catch(error => {
                                response.body = {
                                    type: 'Server Error',
                                    code: 500,
                                    message: 'Unable to update the book.',
                                    error
                                }

                                return serverError(response);
                            })
                        } else {
                            response.body = {
                                type: 'Bad Request',
                                code: 400,
                                message: 'The request body has no valid properties to update!'
                            }

                            return badRequest(response);
                        }
                    }

                    response.body = {
                        type: 'Bad Request',
                        code: 400,
                        message: 'The request body is missing or invalid!'
                    }

                    return badRequest(response);

                } else {
                    response.body = {
                        type: 'Not Found',
                        code: 404,
                        message: `Unable to find a book with the ID of ${book_id}`
                    }
                    return notFound(response);
                }
            }
        } else {
            response.body = {
                type: 'Bad Request',
                code: 400
            }

            if (!book_id && !response.body.message) { response.body.message = 'The book ID is missing.' }
            if (book_id.length !== 32 && !response.body.message) { response.body.message = 'The book ID should be 32 characters long.' }
            return badRequest(response);
        }
    } else {
        response.body = {
            type: 'Bad Request',
            code: 400,
            message: `The method "${method}" is not supported on this endpoint.`
        }

        return badRequest(response);
    }
}

export async function use_authors(request) {
    if (!isValidAccept(request)) {
        response.body = {
            type: 'Bad Request',
            message: 'Your "accept" header specifies a non supported response by this endpoint',
            code: 400
        }
        return badRequest(response);
    }

    if (request.method === 'GET') {
        try {
            const authors = await data.query('Authors').limit(1000).find({ suppressAuth: true }).then((res) => { return res.items });
            response.body = { type: 'authors', authors }
            return ok(response);
        } catch (error) {
            console.error(error)
            response.body = {
                type: 'Server Error',
                code: 500,
                message: 'Unable to retrieve the authors from the database.',
                error
            }

            return serverError(response);
        }
    }

    response.body = {
        type: 'Bad Request',
        code: 400,
        message: `The method "${request.method}" is not supported on this endpoint.`
    }

    return badRequest(response);
}

export async function use_books(request) {
    if (!isValidAccept(request)) {
        response.body = {
            type: 'Bad Request',
            message: 'Your "accept" header specifies a non supported response by this endpoint',
            code: 400
        }
        return badRequest(response);
    }

    if (request.method === 'GET') {
        try {
            const books = await data.query('Books').limit(1000).find({ suppressAuth: true }).then((res) => { return res.items });
            for (const book of books) {
                delete book.author;
            }

            response.body = { type: 'books', books }
            return ok(response);
        } catch (error) {
            console.error(error)
            response.body = {
                type: 'Server Error',
                code: 500,
                message: 'Unable to retrieve the books from the database.',
                error
            }

            return serverError(response);
        }
    }

    response.body = {
        type: 'Bad Request',
        code: 400,
        message: `The method "${request.method}" is not supported on this endpoint.`
    }

    return badRequest(response);
}

// Helpers functions
function isValidAccept(request) {
    const accept = request.headers.accept;
    return accept && accept !== '*/*' && !accept.includes('application/json') ? false : true;
}

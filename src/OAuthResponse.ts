import {ResponseOptions} from "./contract/ResponseOptions";

export class OAuthResponse {
    body = {};
    headers = {};
    status = 200;

    constructor(options:ResponseOptions = {}) {

        this.body = options.body || {};
        this.headers = {};
        this.status = 200;

        // Store the headers in lower case.
        for (let field in options.headers) {
            if (options.headers.hasOwnProperty(field)) {
                this.headers[field.toLowerCase()] = options.headers[field];
            }
        }

        // Store additional properties of the response object passed in
        for (let property in options) {
            if (options.hasOwnProperty(property) && !this[property]) {
                this[property] = options[property];
            }
        }
    }

    get(field) {
        return this.headers[field.toLowerCase()];
    }

    redirect(url) {
        this.set('Location', url);
        this.status = 302;
    }

    set(field, value) {
        this.headers[field.toLowerCase()] = value;
    }
}
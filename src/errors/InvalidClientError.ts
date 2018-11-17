import {OAuthError} from "./OAuthError";

export class InvalidClientError extends OAuthError {
    constructor(message?,code?){
        super(code || 400,message);
    }
}
import {OAuthError} from "./OAuthError";

export class InvalidTokenError extends OAuthError {
    constructor(message?){
        super(401,message);
    }
}
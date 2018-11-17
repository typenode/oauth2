import {OAuthError} from "./OAuthError";

export class InvalidScopeError extends OAuthError {
    constructor(message?){
        super(400,message);
    }
}
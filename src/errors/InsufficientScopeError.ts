import {OAuthError} from "./OAuthError";

export class InsufficientScopeError extends OAuthError {
    constructor(message?){
        super(403,message);
    }
}
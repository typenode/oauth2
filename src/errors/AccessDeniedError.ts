import {OAuthError} from "./OAuthError";

export class AccessDeniedError extends OAuthError {
    constructor(message?){
        super(400,message);
    }
}
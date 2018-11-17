import {OAuthError} from "./OAuthError";

export class InvalidGrantError extends OAuthError {
    constructor(message?){
        super(400,message);
    }
}
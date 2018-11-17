import {OAuthError} from "./OAuthError";

export class UnsupportedGrantTypeError extends OAuthError {
    constructor(message?){
        super(400,message);
    }
}
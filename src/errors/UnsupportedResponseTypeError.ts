import {OAuthError} from "./OAuthError";

export class UnsupportedResponseTypeError extends OAuthError {
    constructor(message?){
        super(400,message);
    }
}
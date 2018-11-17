import {OAuthError} from "./OAuthError";

export class InvalidArgumentError extends OAuthError {
    constructor(message?){
        super(500,message);
    }
}
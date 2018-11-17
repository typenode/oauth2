import {OAuthError} from "./OAuthError";

export class InvalidRequestError extends OAuthError {
    constructor(message?){
        super(400,message);
    }
}
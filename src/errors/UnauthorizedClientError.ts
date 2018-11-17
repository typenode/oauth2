import {OAuthError} from "./OAuthError";

export class UnauthorizedClientError extends OAuthError {
    constructor(message?){
        super(400,message);
    }
}
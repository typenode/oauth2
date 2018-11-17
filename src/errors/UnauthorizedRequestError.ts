import {OAuthError} from "./OAuthError";

export class UnauthorizedRequestError extends OAuthError {
    constructor(message?){
        super(401,message);
    }
}
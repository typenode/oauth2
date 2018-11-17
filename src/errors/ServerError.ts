import {OAuthError} from "./OAuthError";

export class ServerError extends OAuthError {
    constructor(message?){
        super(503,message);
    }
}
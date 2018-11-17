import * as codes from '../codes.json';

export class OAuthError extends Error{
    code:number;
    constructor(httpCode = 500,message?) {
        if( !message ){
            message = codes[httpCode];
        }
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.code = httpCode;
        this.name = new.target.name;
    }
}
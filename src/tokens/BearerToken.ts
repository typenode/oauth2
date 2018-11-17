import {TokenModel} from "../models/TokenModel";

export class BearerToken {
    constructor(protected token:TokenModel){}
    valueOf() {
        const object:any = {
            access_token: this.token.accessToken,
            token_type: 'Bearer'
        };

        if (this.token.accessTokenLifetime) {
            object.expires_in = this.token.accessTokenLifetime;
            object.expires_at = this.token.accessTokenExpiresAt;
        }

        if (this.token.refreshToken) {
            object.refresh_token = this.token.refreshToken;
        }

        if (this.token.refreshToken) {
            object.refresh_token = this.token.refreshToken;
        }

        if (this.token.scope) {
            object.scope = this.token.scope;
        }

        return object;
    }
}
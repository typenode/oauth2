import {TokenContract} from "../contract/TokenContract";

export class TokenModel implements TokenContract{
    accessToken: string;
    accessTokenExpiresAt: Date;
    authorizationCode: string;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
    scope: string;
    client:any;
    user:any;
    accessTokenLifetime:number;
    constructor(data:TokenContract){
        this.accessToken = data.accessToken;
        this.accessTokenExpiresAt = data.accessTokenExpiresAt;
        this.client = data.client;
        this.refreshToken = data.refreshToken;
        this.refreshTokenExpiresAt = data.refreshTokenExpiresAt;
        this.scope = data.scope;
        this.user = data.user;

        if(this.accessTokenExpiresAt) {
            this.accessTokenLifetime = Math.floor((this.accessTokenExpiresAt.getTime() - new Date().getTime()) / 1000);
        }
    }
}
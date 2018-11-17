import {Model}               from "./Model";
import {TokenContract}       from "../contract/TokenContract";
import {OAuthClientContract} from "../contract/OAuthClientContract";
import {OAuthCodeContract}   from "../contract/OAuthCodeContract";
import {sign, verify}        from 'jsonwebtoken';
import {AbstractGrantType}   from "../grants/AbstractGrantType";
import {InvalidTokenError}   from "../errors/InvalidTokenError";
import {InvalidClientError}  from "../errors/InvalidClientError";

export abstract class JwtModel extends Model {
    constructor(
        protected accessTokenSecret:string,
        protected refreshTokenSecret:string,
        protected authorizationCodeSecret?:string
    ){
        super();
    }
    async getAccessToken(bearerToken: string): Promise<TokenContract> {
        let jwt;
        try {
            jwt = await verify(bearerToken, this.accessTokenSecret);
        } catch (e) {
            throw new InvalidTokenError();
        }

        if ( jwt.type !== 'access_token') {
            throw new InvalidTokenError();
        }

        let token = {
            accessToken: bearerToken,
            accessTokenExpiresAt: new Date(jwt.exp * 1000),
            scope:jwt.scope,
            user:jwt.user
        };

        let client;
        if (jwt.aud) {
            client = await this.getClient(jwt.aud, null);
            if( !client ){
                throw new InvalidClientError();
            }
            token['client'] = client;
        }

        return token;

    }

    async getAuthorizationCode(code: string): Promise<OAuthCodeContract> {
        return undefined;
    }

    async getClient(clientId: string, clientSecret: string): Promise<OAuthClientContract> {
        return null;
    }

    async getRefreshToken(refreshToken: string): Promise<TokenContract> {
        let jwt;
        try {
            jwt = await verify(refreshToken, this.refreshTokenSecret);
        } catch (e) {
            throw new InvalidTokenError();
        }

        if ( jwt.type !== 'refresh_token') {
            throw new InvalidTokenError();
        }

        let token = {
            refreshToken: refreshToken,
            refreshTokenExpiresAt: new Date(jwt.exp * 1000),
            scope:jwt.scope,
            user:jwt.user
        };

        let client;
        if (jwt.aud) {
            client = await this.getClient(jwt.aud, null);
            if( !client ){
                throw new InvalidClientError();
            }
            token['client'] = client;
        }

        return token;
    }

    async getUserFromClient(client: OAuthClientContract): Promise<any> {
        return undefined;
    }

    async revokeAuthorizationCode(code: string): Promise<any> {
        return true;
    }

    async revokeToken(token: string): Promise<any> {
        return true;
    }

    async saveAuthorizationCode(code, client: OAuthClientContract, user): Promise<any> {
        return null;
    }

    async saveToken(token: TokenContract, client: OAuthClientContract, user): Promise<any> {
        return token;
    }

    async abstract validateScope(user, client: OAuthClientContract, scope): Promise<boolean>;

    async abstract verifyScope(token, scope): Promise<boolean>

    async createSubject<G extends AbstractGrantType>(client: OAuthClientContract, user, scope, grantType: G){
        return user.id;
    }

    async createPayload<G extends AbstractGrantType>(client: OAuthClientContract, user, scope, grantType: G){
        let payload = {
            user:{id:user.id}
        };
        if( client && client.id ){
            payload['aud'] = client.id;
        }
        return payload;
    }

    async generateAccessToken<G extends AbstractGrantType>(client: OAuthClientContract, user, scope, grantType: G) {
        return sign({
            exp: Math.floor(new Date(grantType.getAccessTokenExpiresAt()).getTime() / 1000),
            iat:Math.floor(Date.now() / 1000),
            sub:await this.createSubject(client,user,scope,grantType),
            scope:scope,
            type:'access_token',
            ...await this.createPayload(client,user,scope,grantType)
        },this.accessTokenSecret)
    }

    async generateRefreshToken<G extends AbstractGrantType>(client, user, scope, grantType: G) {
        return sign({
            exp: Math.floor(new Date(grantType.getRefreshTokenExpiresAt()).getTime() / 1000),
            iat:Math.floor(Date.now() / 1000),
            sub:await this.createSubject(client,user,scope,grantType),
            scope:scope,
            type:'refresh_token',
            ...await this.createPayload(client,user,scope,grantType)
        },this.refreshTokenSecret);
    }

}
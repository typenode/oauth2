import * as crypto           from 'crypto';
import {TokenContract}       from "../contract/TokenContract";
import {OAuthClientContract} from "../contract/OAuthClientContract";
import {OAuthCodeContract}   from "../contract/OAuthCodeContract";
import {AbstractGrantType}   from "../grants/AbstractGrantType";

export abstract class Model {
    abstract async getAccessToken(bearerToken:string):Promise<TokenContract>;
    abstract async getAuthorizationCode(code:string):Promise<OAuthCodeContract>;
    abstract async getClient(clientId:string,clientSecret:string):Promise<OAuthClientContract>;
    abstract async getRefreshToken(refreshToken:string):Promise<TokenContract>;
    abstract async getUser(username:string, password:string);
    abstract async getUserFromClient(client:OAuthClientContract);
    abstract async revokeAuthorizationCode(code:string);
    abstract async revokeToken(token:string);
    abstract async saveToken(token:TokenContract, client:OAuthClientContract, user);
    abstract async saveAuthorizationCode(code, client:OAuthClientContract, user);
    abstract async validateScope(user, client:OAuthClientContract, scope):Promise<boolean>;
    abstract async verifyScope(token, scope):Promise<boolean>;
    async generateRandomToken(){
        return crypto
            .createHash('sha1')
            .update(crypto.randomBytes(256))
            .digest('hex');
    }
    async generateAccessToken<G extends AbstractGrantType>(client:OAuthClientContract,user,scope,grantType:G){
        return this.generateRandomToken();
    }
    async generateRefreshToken<G extends AbstractGrantType>(client,user,scope,grantType:G){
        return await this.generateRandomToken();
    }
    async generateAuthorizationCode<G extends AbstractGrantType>(client,user,scope){
        return await this.generateRandomToken();
    }
}
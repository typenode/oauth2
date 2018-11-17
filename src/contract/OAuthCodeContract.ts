import {OAuthClientContract} from "./OAuthClientContract";

export interface OAuthCodeContract {
    client:OAuthClientContract;
    user:any;
    expiresAt:Date;
    redirectUri:string;
    scope:string;
    authorizationCode:string;
}
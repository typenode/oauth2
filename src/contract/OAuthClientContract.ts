export interface OAuthClientContract {
    id:string|number;
    secret:string;
    redirectUri:string;
    grants:string[];
}
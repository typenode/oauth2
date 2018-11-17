export interface AuthenticateHandlerOptions {
    addAcceptedScopesHeader?:boolean
    addAuthorizedScopesHeader?:boolean
    allowBearerTokensInQueryString?:boolean
    scope?:string;
}
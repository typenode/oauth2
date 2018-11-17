export interface TokenHandlerOptions {
    accessTokenLifetime:number;
    refreshTokenLifetime:number;
    allowExtendedTokenAttributes?:boolean;
    requireClientAuthentication?:any;
    alwaysIssueNewRefreshToken?:boolean;
}
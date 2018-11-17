export interface TokenContract {
    accessToken?:  string,
    authorizationCode?: string,
    accessTokenExpiresAt?: Date,
    refreshToken?: string,
    refreshTokenExpiresAt?: Date,
    scope: string;
    client?: any;
    user?: any;
}
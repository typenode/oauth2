import {AbstractGrantType}   from "./AbstractGrantType";
import {OAuthRequest}        from "../OAuthRequest";
import {InvalidRequestError} from "../errors/InvalidRequestError";
import {InvalidGrantError}   from "../errors/InvalidGrantError";
import {ServerError}         from "../errors/ServerError";
import {TokenContract}       from "../contract/TokenContract";

export class RefreshTokenGrantType extends AbstractGrantType{
    async handle(request:OAuthRequest, client) {
        const token = await this.getRefreshToken(request, client);
        await this.revokeToken(token);
        return await this.saveToken(token.user, client, token.scope)
    };

    async getRefreshToken(request, client) {
        if (!request.body.refresh_token) {
            throw new InvalidRequestError('Missing parameter: `refresh_token`');
        }
        const token = await this.model.getRefreshToken(request.body.refresh_token);
        if (!token) {
            throw new InvalidGrantError('Invalid grant: refresh token is invalid');
        }

        if (token.client && token.client.id !== client.id) {
            throw new InvalidGrantError('Invalid grant: refresh token is invalid');
        }

        if (!token.user) {
            throw new ServerError('Server error: `getRefreshToken()` did not return a `user` object');
        }

        if (token.refreshTokenExpiresAt && !(token.refreshTokenExpiresAt instanceof Date)) {
            throw new ServerError('Server error: `refreshTokenExpiresAt` must be a Date instance');
        }

        if (token.refreshTokenExpiresAt && token.refreshTokenExpiresAt < new Date()) {
            throw new InvalidGrantError('Invalid grant: refresh token has expired');
        }
        return token;
    };

    async revokeToken(token) {
        if (this.alwaysIssueNewRefreshToken === false) {
            return token;
        }
        const status = await this.model.revokeToken(token);
        if (!status) {
            throw new InvalidGrantError('Invalid grant: refresh token is invalid');
        }
        return token;
    };

    async saveToken(user, client, scope) {
        const token:TokenContract = {
            accessToken: await this.generateAccessToken(client, user, scope),
            accessTokenExpiresAt: this.getAccessTokenExpiresAt(),
            scope: scope,
        };
        if (this.alwaysIssueNewRefreshToken !== false) {
            token.refreshToken = await this.generateRefreshToken(client, user, scope);
            token.refreshTokenExpiresAt = this.getRefreshTokenExpiresAt();
        }
        return this.model.saveToken(token,client,user);
    };
}
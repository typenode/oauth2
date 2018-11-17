import {AbstractGrantType}   from "./AbstractGrantType";
import {OAuthRequest}        from "../OAuthRequest";
import {InvalidRequestError} from "../errors/InvalidRequestError";
import {InvalidGrantError}   from "../errors/InvalidGrantError";
import {ServerError}         from "../errors/ServerError";
import {OAuthClientContract} from "../contract/OAuthClientContract";

export class AuthorizationCodeGrantType extends AbstractGrantType {
    async handle(request: OAuthRequest, client) {
        const code = await this.getAuthorizationCode(request, client);
        this.validateRedirectUri(request, code);
        await this.revokeAuthorizationCode(code);
        return await this.saveToken(code.user, client, code.scope, code.authorizationCode);
    };

    async getAuthorizationCode(request: OAuthRequest, client: OAuthClientContract) {
        if (!request.body.code) {
            throw new InvalidRequestError('Missing parameter: `code`');
        }

        if (!/^[\u0020-\u007E]+$/.test(request.body.code)) {
            throw new InvalidRequestError('Invalid parameter: `code`');
        }
        const code = await this.model.getAuthorizationCode(request.body.code);
        if (!code) {
            throw new InvalidGrantError('Invalid grant: authorization code is invalid');
        }
        if (!code.client) {
            throw new ServerError('Server error: `getAuthorizationCode()` did not return a `client` object');
        }
        if (!code.user) {
            throw new ServerError('Server error: `getAuthorizationCode()` did not return a `user` object');
        }

        if (code.client.id !== client.id) {
            throw new InvalidGrantError('Invalid grant: authorization code is invalid');
        }

        if (!(code.expiresAt instanceof Date)) {
            throw new ServerError('Server error: `expiresAt` must be a Date instance');
        }

        if (code.expiresAt < new Date()) {
            throw new InvalidGrantError('Invalid grant: authorization code has expired');
        }

        if (code.redirectUri && !/^[a-zA-Z][a-zA-Z0-9+.-]+:/.test(code.redirectUri)) {
            throw new InvalidGrantError('Invalid grant: `redirect_uri` is not a valid URI');
        }
        return code;
    };

    validateRedirectUri(request: OAuthRequest, code) {
        if (!code.redirectUri) {
            return;
        }

        const redirectUri = request.body.redirect_uri || request.query.redirect_uri;

        if (!/^[a-zA-Z][a-zA-Z0-9+.-]+:/.test(redirectUri)) {
            throw new InvalidRequestError('Invalid request: `redirect_uri` is not a valid URI');
        }

        if (redirectUri !== code.redirectUri) {
            throw new InvalidRequestError('Invalid request: `redirect_uri` is invalid');
        }
    };

    async revokeAuthorizationCode(code) {
        const status = await this.model.revokeAuthorizationCode(code);
        if (!status) {
            throw new InvalidGrantError('Invalid grant: authorization code is invalid');
        }
        return code;
    };

    async saveToken(user, client, scope, authorizationCode) {
        await this.validateScope(user, client, scope);
        return this.model.saveToken({
            accessToken: await this.generateAccessToken(client, user, scope),
            authorizationCode: authorizationCode,
            accessTokenExpiresAt: this.getAccessTokenExpiresAt(),
            refreshToken: await this.generateRefreshToken(client, user, scope),
            refreshTokenExpiresAt: this.getRefreshTokenExpiresAt(),
            scope: scope
        }, client, scope)
    };
}
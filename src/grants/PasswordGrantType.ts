import {AbstractGrantType}   from "./AbstractGrantType";
import {OAuthRequest}        from "../OAuthRequest";
import {InvalidRequestError} from "../errors/InvalidRequestError";
import {InvalidGrantError}   from "../errors/InvalidGrantError";

export class PasswordGrantType extends AbstractGrantType {
    async handle(request: OAuthRequest, client) {

        const scope = this.getScope(request);
        return await this.saveToken(await this.getUser(request), client, scope);
    };

    async getUser(request: OAuthRequest) {
        if (!request.body.username) {
            throw new InvalidRequestError('Missing parameter: `username`');
        }

        if (!request.body.password) {
            throw new InvalidRequestError('Missing parameter: `password`');
        }
        const user = await this.model.getUser(request.body.username, request.body.password);
        if (!user) {
            throw new InvalidGrantError('Invalid grant: user credentials are invalid');
        }
        return user;
    };

    async saveToken(user, client, scope) {
        await this.validateScope(user, client, scope);

        return await this.model.saveToken({
            accessToken: await this.generateAccessToken(client, user, scope),
            accessTokenExpiresAt:  this.getAccessTokenExpiresAt(),
            refreshToken: await this.generateRefreshToken(client, user, scope),
            refreshTokenExpiresAt: this.getRefreshTokenExpiresAt(),
            scope: scope
        },client,user);
    };
}
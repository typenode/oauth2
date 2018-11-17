import {AbstractGrantType}   from "./AbstractGrantType";
import {OAuthRequest}        from "../OAuthRequest";
import {InvalidGrantError}   from "../errors/InvalidGrantError";
import {OAuthClientContract} from "../contract/OAuthClientContract";

export class ClientCredentialsGrantType extends AbstractGrantType {
    async handle(request: OAuthRequest, client) {
        let scope = this.getScope(request);
        return await this.saveToken(await this.getUserFromClient(client), client, scope)
    };

    async getUserFromClient(client:OAuthClientContract) {
        const user = await this.model.getUserFromClient(client);
        if (!user) {
            throw new InvalidGrantError('Invalid grant: user credentials are invalid');
        }
        return user;
    };

    async saveToken(user, client, scope) {
        await this.validateScope(user, client, scope);
        return await this.model.saveToken({
            accessToken:  await this.generateAccessToken(client, user, scope),
            accessTokenExpiresAt: this.getAccessTokenExpiresAt(),
            scope: scope
        },client,user);
    }
}
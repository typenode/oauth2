import {InvalidArgumentError}     from "../errors/InvalidArgumentError";
import {AbstractGrantTypeOptions} from "../contract/AbstractGrantTypeOptions";
import {Model}                    from "../models/Model";
import {OAuthRequest}             from "../OAuthRequest";
import {InvalidScopeError}        from "../errors/InvalidScopeError";

export abstract class AbstractGrantType<T extends Model = Model> {
    public accessTokenLifetime: number;
    public refreshTokenLifetime: number;
    public alwaysIssueNewRefreshToken: boolean;
    public model: T;

    protected constructor(options: AbstractGrantTypeOptions<T>) {

        if (!options.accessTokenLifetime) {
            throw new InvalidArgumentError('Missing parameter: `accessTokenLifetime`');
        }

        if (!options.model) {
            throw new InvalidArgumentError('Missing parameter: `model`');
        }

        this.accessTokenLifetime = options.accessTokenLifetime;
        this.model = options.model;
        this.refreshTokenLifetime = options.refreshTokenLifetime;
        this.alwaysIssueNewRefreshToken = options.alwaysIssueNewRefreshToken;
    }

    async generateAccessToken(client, user, scope) {
        return await this.model.generateAccessToken(client, user, scope,this);
    };

    /**
     * Generate refresh token.
     */

    async generateRefreshToken(client, user, scope) {
        return await this.model.generateRefreshToken(client, user, scope,this);
    };

    /**
     * Get access token expiration date.
     */

    getAccessTokenExpiresAt() {
        let expires = new Date();

        expires.setSeconds(expires.getSeconds() + this.accessTokenLifetime);

        return expires;
    };

    /**
     * Get refresh token expiration date.
     */

    getRefreshTokenExpiresAt() {
        let expires = new Date();

        expires.setSeconds(expires.getSeconds() + this.refreshTokenLifetime);

        return expires;
    };

    /**
     * Get scope from the request body.
     */

    getScope(request: OAuthRequest) {
        return request.body.scope;
    };

    /**
     * Validate requested scope.
     */
    async validateScope(user, client, scope) {
        const isValid = await this.model.validateScope(user, client, scope);
        if( !isValid ){
            throw new InvalidScopeError('Invalid scope: Requested scope is invalid');
        }
    };

    abstract async saveToken(user, client, scope, authorizationCode?);

    abstract async handle(request: OAuthRequest, client);
}
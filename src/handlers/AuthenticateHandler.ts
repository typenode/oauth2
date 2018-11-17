import {AuthenticateHandlerOptions} from "../contract/AuthenticateHandlerOptions";
import {Model}                    from "../models/Model";
import {InvalidArgumentError}     from "../errors/InvalidArgumentError";
import {OAuthRequest}             from "../OAuthRequest";
import {OAuthResponse}            from "../OAuthResponse";
import {InvalidRequestError}      from "../errors/InvalidRequestError";
import {InvalidTokenError}        from "../errors/InvalidTokenError";
import {ServerError}              from "../errors/ServerError";
import {TokenContract}            from "../contract/TokenContract";
import {InsufficientScopeError}   from "../errors/InsufficientScopeError";
import {UnauthorizedRequestError} from "../errors/UnauthorizedRequestError";
import {OAuthError}               from "../errors/OAuthError";

export class AuthenticateHandler<M extends Model> implements AuthenticateHandlerOptions {
    addAcceptedScopesHeader: boolean;
    addAuthorizedScopesHeader: boolean;
    allowBearerTokensInQueryString: boolean;
    model: M;
    scope: string;

    constructor(model:M,options: AuthenticateHandlerOptions) {

        if (options.scope && undefined === options.addAcceptedScopesHeader) {
            throw new InvalidArgumentError('Missing parameter: `addAcceptedScopesHeader`');
        }

        if (options.scope && undefined === options.addAuthorizedScopesHeader) {
            throw new InvalidArgumentError('Missing parameter: `addAuthorizedScopesHeader`');
        }

        this.addAcceptedScopesHeader = options.addAcceptedScopesHeader;
        this.addAuthorizedScopesHeader = options.addAuthorizedScopesHeader;
        this.allowBearerTokensInQueryString = options.allowBearerTokensInQueryString;
        this.model = model;
        this.scope = options.scope;
    }

    async handle(request:OAuthRequest, response:OAuthResponse) {
        try {
            const token = this.getTokenFromRequest(request);
            const accessToken = await this.getAccessToken(token);
            this.validateAccessToken(accessToken);
            if (this.scope) {
                await this.verifyScope(accessToken);
            }
            this.updateResponse(response, accessToken);
            return accessToken;
        }catch (e) {
            if (e instanceof UnauthorizedRequestError) {
                response.set('WWW-Authenticate', 'Bearer realm="Service"');
            }

            if (!(e instanceof OAuthError)) {
                throw new ServerError(e);
            }

            throw e;
        }
    };

    getTokenFromRequest(request: OAuthRequest) {
        let headerToken = request.get('Authorization');
        let queryToken = request.query.access_token;
        let bodyToken = request.body.access_token;

        if (headerToken) {
            return this.getTokenFromRequestHeader(request);
        }

        if (queryToken) {
            return this.getTokenFromRequestQuery(request);
        }

        if (bodyToken) {
            return this.getTokenFromRequestBody(request);
        }

        throw new UnauthorizedRequestError('Unauthorized request: no authentication given');
    };


    getTokenFromRequestHeader(request: OAuthRequest) {
        let token = request.get('Authorization');
        let matches = token.match(/Bearer\s(\S+)/);

        if (!matches) {
            throw new InvalidRequestError('Invalid request: malformed authorization header');
        }

        return matches[1];
    };

    getTokenFromRequestQuery(request: OAuthRequest) {
        if (!this.allowBearerTokensInQueryString) {
            throw new InvalidRequestError('Invalid request: do not send bearer tokens in query URLs');
        }

        return request.query.access_token;
    };


    getTokenFromRequestBody(request: OAuthRequest) {
        if (request.method === 'GET') {
            throw new InvalidRequestError('Invalid request: token may not be passed in the body when using the GET verb');
        }

        if (request.headers['content-type'] !== 'application/x-www-form-urlencoded') {
            throw new InvalidRequestError('Invalid request: content must be application/x-www-form-urlencoded');
        }

        return request.body.access_token;
    };

    async getAccessToken(token) {
        const accessToken = await this.model.getAccessToken(token);
        if (!accessToken) {
            throw new InvalidTokenError('Invalid token: access token is invalid');
        }
        if (!accessToken.user) {
            throw new ServerError('Server error: `getAccessToken()` did not return a `user` object');
        }
        return accessToken;
    };

    validateAccessToken(accessToken: TokenContract) {
        if (!(accessToken.accessTokenExpiresAt instanceof Date)) {
            throw new ServerError('Server error: `accessTokenExpiresAt` must be a Date instance');
        }

        if (accessToken.accessTokenExpiresAt < new Date()) {
            throw new InvalidTokenError('Invalid token: access token has expired');
        }

        return accessToken;
    };

    async verifyScope(accessToken) {
        const scope = await this.model.verifyScope(accessToken, this.scope);
        if (!scope) {
            throw new InsufficientScopeError('Insufficient scope: authorized scope is insufficient');
        }
        return scope;
    };

    updateResponse(response:OAuthResponse, accessToken:TokenContract) {
        if (this.scope && this.addAcceptedScopesHeader) {
            response.set('X-Accepted-OAuth-Scopes', this.scope);
        }

        if (this.scope && this.addAuthorizedScopesHeader) {
            response.set('X-OAuth-Scopes', accessToken.scope);
        }
    };
}
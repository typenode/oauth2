import {AuthorizeHandlerOptions} from "../contract/AuthorizeHandlerOptions";
import {Model}                   from "../models/Model";
import {AuthenticateHandler}     from "./AuthenticateHandler";
import {OAuthRequest}            from "../OAuthRequest";
import {OAuthResponse}           from "../OAuthResponse";
import {AccessDeniedError}       from "../errors/AccessDeniedError";
import {InvalidRequestError}     from "../errors/InvalidRequestError";
import {InvalidClientError}      from "../errors/InvalidClientError";
import {UnauthorizedClientError} from "../errors/UnauthorizedClientError";
import {ServerError}             from "../errors/ServerError";
import * as url                  from "url";
import {OAuthError}              from "../errors/OAuthError";
import {OAuthClientContract}     from "../contract/OAuthClientContract";

export class AuthorizeHandler<M extends Model> implements AuthorizeHandlerOptions {
    allowEmptyState: boolean;
    authenticateHandler: AuthenticateHandler<M>;
    authorizationCodeLifetime: number;
    model: M;

    constructor(model:M,options: AuthorizeHandlerOptions) {
        this.allowEmptyState = options.allowEmptyState;
        this.authenticateHandler = new AuthenticateHandler(model,{
            scope: options.scope
        });
        this.authorizationCodeLifetime = options.authorizationCodeLifetime;
        this.model = model;
    }

    async handle(request: OAuthRequest, response: OAuthResponse) {
        if ('false' === request.query.allowed) {
            throw new AccessDeniedError('Access denied: user denied access to application')
        }
        let uri,state;
        try {
            const expiresAt = this.getAuthorizationCodeLifetime()
            const client = await this.getClient(request);
            const user = await this.getUser(request, response);
            uri = this.getRedirectUri(request, client);
            const scope = this.getScope(request);
            const authorizationCode = await this.generateAuthorizationCode(client, user, scope);
            state = this.getState(request);
            const code = await this.saveAuthorizationCode(authorizationCode, expiresAt, scope, client, uri, user);
            const redirectUri = this.buildSuccessRedirectUri(uri, code.authorizationCode);
            this.updateResponse(response, redirectUri, state);
            return code;
        }catch (e) {
            if (!(e instanceof OAuthError)) {
                e = new ServerError(e);
            }
            const redirectUri = this.buildErrorRedirectUri(uri, e);

            this.updateResponse(response, redirectUri, state);

            throw e;
        }
    };

    async generateAuthorizationCode(client, user, scope) {
        return await this.model.generateAuthorizationCode(client, user, scope);
    };

    getAuthorizationCodeLifetime() {
        let expires = new Date();

        expires.setSeconds(expires.getSeconds() + this.authorizationCodeLifetime);
        return expires;
    };

    async getClient(request: OAuthRequest) {
        let clientId = request.body.client_id || request.query.client_id;

        if (!clientId) {
            throw new InvalidRequestError('Missing parameter: `client_id`');
        }

        let redirectUri = request.body.redirect_uri || request.query.redirect_uri;

        if (redirectUri && !/^[a-zA-Z][a-zA-Z0-9+.-]+:/.test(redirectUri)) {
            throw new InvalidRequestError('Invalid request: `redirect_uri` is not a valid URI');
        }
        const client = await this.model.getClient(clientId, null);
        if (!client) {
            throw new InvalidClientError('Invalid client: client credentials are invalid');
        }
        if (!client) {
            throw new InvalidClientError('Invalid client: client credentials are invalid');
        }

        if (!client.grants) {
            throw new InvalidClientError('Invalid client: missing client `grants`');
        }

        if (!client.grants.includes('authorization_code')) {
            throw new UnauthorizedClientError('Unauthorized client: `grant_type` is invalid');
        }

        if (!client.redirectUri ) {
            throw new InvalidClientError('Invalid client: missing client `redirectUri`');
        }

        if (redirectUri && client.redirectUri !== redirectUri ) {
            throw new InvalidClientError('Invalid client: `redirect_uri` does not match client value');
        }
        return client;
    };

    getScope(request: OAuthRequest) {
        return request.body.scope || request.query.scope;
    };

    getState(request) {
        let state = request.body.state || request.query.state;

        if (!this.allowEmptyState && !state) {
            throw new InvalidRequestError('Missing parameter: `state`');
        }

        return state;
    };

    async getUser(request: OAuthRequest, response: OAuthResponse) {
        const user = await this.authenticateHandler.handle(request, response);
        if (!user) {
            throw new ServerError('Server error: `handle()` did not return a `user` object');
        }
        return user;
    };

    getRedirectUri(request:OAuthRequest, client:OAuthClientContract) {
        return request.body.redirect_uri || request.query.redirect_uri || client.redirectUri;
    };

    async saveAuthorizationCode(authorizationCode, expiresAt, scope, client, redirectUri, user) {
        const code = {
            authorizationCode: authorizationCode,
            expiresAt: expiresAt,
            redirectUri: redirectUri,
            scope: scope
        };
        return await this.model.saveAuthorizationCode(code, client, user);
    };

    buildSuccessRedirectUri(redirectUri, authorizationCode) {
        var uri = url.parse(redirectUri, true);

        uri.query.code = authorizationCode;
        uri.search = null;

        return uri;
    };

    buildErrorRedirectUri(redirectUri, error) {
        let uri: any = url.parse(redirectUri);

        uri.query = {
            error: error.name
        };

        if (error.message) {
            uri.query.error_description = error.message;
        }

        return uri;
    };

    updateResponse(response, redirectUri, state) {
        redirectUri.query = redirectUri.query || {};

        if (state) {
            redirectUri.query.state = state;
        }

        response.redirect(url.format(redirectUri));
    };

}
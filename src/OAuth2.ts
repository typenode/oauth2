import {Model}                      from "./models/Model";
import {OAuthRequest}               from "./OAuthRequest";
import {OAuthResponse}              from "./OAuthResponse";
import {TokenHandlerOptions}        from "./contract/TokenHandlerOptions";
import {AuthenticateHandlerOptions} from "./contract/AuthenticateHandlerOptions";
import {AuthorizeHandlerOptions}    from "./contract/AuthorizeHandlerOptions";
import {TokenHandler}               from "./handlers/TokenHandler";
import {AuthorizeHandler}           from "./handlers/AuthorizeHandler";
import {AuthenticateHandler}        from "./handlers/AuthenticateHandler";

export class OAuth2<M extends Model> {
    constructor(protected model: M) {
    }

    public async token(request: OAuthRequest, response: OAuthResponse, options: Partial<TokenHandlerOptions> = {}) {
        return await new TokenHandler(this.model, {
            accessTokenLifetime: 60 * 60,             // 1 hour.
            refreshTokenLifetime: 60 * 60 * 24 * 14,  // 2 weeks.
            allowExtendedTokenAttributes: false,
            requireClientAuthentication: {},
            ...options
        }).handle(request, response);
    }

    public async authenticate(request: OAuthRequest, response: OAuthResponse, options: Partial<AuthenticateHandlerOptions> = {}) {
        return await new AuthenticateHandler(this.model,{
            addAcceptedScopesHeader: true,
            addAuthorizedScopesHeader: true,
            allowBearerTokensInQueryString: false,
            ...options
        }).handle(request, response);
    }

    public async authorize(request: OAuthRequest, response: OAuthResponse, options: Partial<AuthorizeHandlerOptions> = {}) {
        return await new AuthorizeHandler(this.model, {
            allowEmptyState: false,
            authorizationCodeLifetime: 5 * 60,   // 5 minutes.
            ...options
        }).handle(request, response)
    }
}
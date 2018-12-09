import {TokenHandlerOptions}       from "../contract/TokenHandlerOptions";
import {Model}                     from "../models/Model";
import {OAuthRequest}              from "../OAuthRequest";
import {OAuthResponse}             from "../OAuthResponse";
import {InvalidRequestError}       from "../errors/InvalidRequestError";
import {InvalidClientError}        from "../errors/InvalidClientError";
import {UnsupportedGrantTypeError} from "../errors/UnsupportedGrantTypeError";
import {UnauthorizedClientError}   from "../errors/UnauthorizedClientError";
import {BearerToken}               from "../tokens/BearerToken";
import {TokenModel}                 from "../models/TokenModel";
import {ServerError}                from "../errors/ServerError";
import {AuthorizationCodeGrantType} from "../grants/AuthorizationCodeGrantType";
import {ClientCredentialsGrantType} from "../grants/ClientCredentialsGrantType";
import {PasswordGrantType}          from "../grants/PasswordGrantType";
import {RefreshTokenGrantType}      from "../grants/RefreshTokenGrantType";
import {OAuthError}                 from "../errors/OAuthError";

export class TokenHandler<M extends Model> implements TokenHandlerOptions{
    accessTokenLifetime: number;
    allowExtendedTokenAttributes: boolean;
    alwaysIssueNewRefreshToken: boolean;
    model: M;
    refreshTokenLifetime: number;
    requireClientAuthentication: any;
    grantTypes: any;
    constructor(model:M,options:TokenHandlerOptions){
        this.accessTokenLifetime = options.accessTokenLifetime;
        this.grantTypes = {
            authorization_code: AuthorizationCodeGrantType,
            client_credentials: ClientCredentialsGrantType,
            password: PasswordGrantType,
            refresh_token: RefreshTokenGrantType
        };
        this.model = model;
        this.refreshTokenLifetime = options.refreshTokenLifetime;
        this.allowExtendedTokenAttributes = options.allowExtendedTokenAttributes;
        this.requireClientAuthentication = options.requireClientAuthentication || {};
        this.alwaysIssueNewRefreshToken = options.alwaysIssueNewRefreshToken !== false;
    }

    async handle(request:OAuthRequest, response:OAuthResponse) {

        if (request.method !== 'POST') {
            throw new InvalidRequestError('Invalid request: method must be POST')
        }

        if (request.headers['content-type'] !== 'application/x-www-form-urlencoded') {
            throw new InvalidRequestError('Invalid request: content must be application/x-www-form-urlencoded');
        }
        try {
            const grantType = request.body.grant_type;
            const client = this.isClientAuthenticationRequired(grantType) && await this.getClient(request, response);
            const data = await this.handleGrantType(request, client);
            const model = new TokenModel({...data, ...{allowExtendedTokenAttributes: this.allowExtendedTokenAttributes}});
            const tokenType = this.getTokenType(model);
            const body = this.model.valueOf(tokenType,model.client,model.user);
            this.updateSuccessResponse(response, body);
            return body;
        }catch (e) {
            if (!(e instanceof OAuthError)) {
                e = new ServerError(e);
            }

            this.updateErrorResponse(response, e);

            throw e;
        }
    };


    async getClient(request:OAuthRequest, response:OAuthResponse) {
        const credentials = this.getClientCredentials(request);
        const grantType = request.body.grant_type;

        if (!credentials.clientId) {
            throw new InvalidRequestError('Missing parameter: `client_id`');
        }

        if (!credentials.clientSecret) {
            throw new InvalidRequestError('Missing parameter: `client_secret`');
        }

        try {
            const client = await this.model.getClient(credentials.clientId,credentials.clientSecret);
            if (!client) {
                throw new InvalidClientError('Invalid client: client is invalid');
            }
            if (!client.grants) {
                throw new ServerError('Server error: missing client `grants`');
            }
            if (!(client.grants instanceof Array)) {
                throw new ServerError('Server error: `grants` must be an array');
            }

            return client;
        }catch (e) {
            if ((e instanceof InvalidClientError) && request.get('authorization')) {
                response.set('WWW-Authenticate', 'Basic realm="Service"');

                throw new InvalidClientError(e.message,401);
            }

            throw e;
        }
    };

    getClientCredentials(request:OAuthRequest) {
        const [clientId,clientSecret] = Buffer.from(String(request.headers['authorization']), 'base64').toString().split(":");
        const grantType = request.body.grant_type;

        if (clientId && clientSecret ) {
            return { clientId, clientSecret };
        }

        if (request.body.client_id && request.body.client_secret) {
            return { clientId: request.body.client_id, clientSecret: request.body.client_secret };
        }

        if(request.body.client_id) {
            return { clientId: request.body.client_id };
        }

        throw new InvalidClientError('Invalid client: cannot retrieve client credentials');
    };

    async handleGrantType(request:OAuthRequest, client) {
        const grantType = request.body.grant_type;

        if (!grantType) {
            throw new InvalidRequestError('Missing parameter: `grant_type`');
        }

        if (!this.grantTypes[grantType]) {
            throw new UnsupportedGrantTypeError('Unsupported grant type: `grant_type` is invalid');
        }

        if (client && !client.grants.includes(grantType)) {
            throw new UnauthorizedClientError('Unauthorized client: `grant_type` is invalid');
        }

        const accessTokenLifetime = this.getAccessTokenLifetime(client);
        const refreshTokenLifetime = this.getRefreshTokenLifetime(client);
        const Type = this.grantTypes[grantType];

        const options = {
            accessTokenLifetime: accessTokenLifetime,
            model: this.model,
            refreshTokenLifetime: refreshTokenLifetime,
            alwaysIssueNewRefreshToken: this.alwaysIssueNewRefreshToken
        };

        return await new Type(options)
            .handle(request, client);
    };


    getAccessTokenLifetime(client) {
        return client && client.accessTokenLifetime || this.accessTokenLifetime;
    }

    getRefreshTokenLifetime(client) {
        return  client && client.refreshTokenLifetime || this.refreshTokenLifetime;
    }

    getTokenType(model:TokenModel) {
        const { accessToken,accessTokenLifetime,refreshToken,scope,...rest } = model;
        return new BearerToken({accessToken,accessTokenLifetime,refreshToken,scope,...rest});
    };

    updateSuccessResponse(response:OAuthResponse, body) {
        response.body = body;

        response.set('Cache-Control', 'no-store');
        response.set('Pragma', 'no-cache');
    }

    updateErrorResponse(response:OAuthResponse, error) {
        response.body = error;

        response.status = error.code;
    }

    isClientAuthenticationRequired(grantType) {
        return !!this.requireClientAuthentication[grantType]
    };

}
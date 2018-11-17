# OAuth2
OAuth2 authentication 


Library is in development.

## Installation

* Install module:

`npm install @typenode/oauth2 --save` 

## Usage

1. Create a Model

    JWT model

```typescript
    import {JwtModel,OAuthClientContract} from '@typenode/oauth2';
    
    export class OAuthJwtModel extends JwtModel{
        async getUser(username: string, password: string): Promise<any> {
            //fetch user
            return users.find(u=>u.username === username && u.password === password);
        }
        
        async getClient(clientId: string, clientSecret: string): Promise<OAuthClientContract> {
             //fetch user
                return null;
        }
    
        async validateScope(user, client: OAuthClientContract, scope): Promise<boolean> {
            //scope validation implementation here
            return true;
        }
    
        async verifyScope(token, scope): Promise<boolean> {
            //scope verification implementation here
            return token.scope === scope;
        }
    }
```
or create your own model by extending abstract class Model from  `import {Model} from '@typenode/oauth2';`

2. initialize 
```typescript
    import {OAuth2} from '@typenode/oauth2';
    
    const oauth2 = new OAuth2(new OAuthJwtModel('secret1','secret2'));
```


3. Request and Response
```typescript
 import {OAuthRequest,OAuthResponse} from '@typenode/oauth2';
   
   let request = new OAuthRequest({/*...*/});
   let response = new OAuthResponse({/*...*/});
```

4. OAuth2#authenticate()

```typescript
    oauth2.authenticate(request, response,options)
      .then((token) => {
        // The request was successfully authenticated.
      })
      .catch((err) => {
        // The request failed authentication.
      });
  
```

5. OAuth2#token()

```typescript
    oauth2.token(request, response,options)
      .then((token) => {
        // The resource owner granted the access request.
      })
      .catch((err) => {
        // The request was invalid or not authorized.
      });
  
```

6. OAuth2#authorize()

```typescript
    import {AccessDeniedError} from '@typenode/oauth2';

    oauth2.authorize(request, response,options)
     .then((code) => {
       // The resource owner granted the access request.
     })
     .catch((err) => {
       if (err instanceof AccessDeniedError) {
         // The resource owner denied the access request.
       } else {
         // Access was not granted due to some other error condition.
       }
     });

```


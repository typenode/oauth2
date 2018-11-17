import {InvalidArgumentError} from "./errors/InvalidArgumentError";
import {RequestOptions}       from "./contract/RequestOptions";

export class OAuthRequest {
   public body:any = {};
   public headers = {};
   public method;
   public query;

   constructor(options:RequestOptions){

       if (!options.headers) {
           throw new InvalidArgumentError('Missing parameter: `headers`');
       }

       if (!options.method) {
           throw new InvalidArgumentError('Missing parameter: `method`');
       }

       if (!options.query) {
           throw new InvalidArgumentError('Missing parameter: `query`');
       }

       this.body = options.body || {};
       this.headers = {};
       this.method = options.method;
       this.query = options.query;

       // Store the headers in lower case.
       for (let field in options.headers) {
           if (options.headers.hasOwnProperty(field)) {
               this.headers[field.toLowerCase()] = options.headers[field];
           }
       }

       // Store additional properties of the request object passed in
       for (let property in options) {
           if (options.hasOwnProperty(property) && !this[property]) {
               this[property] = options[property];
           }
       }
   }

   get(field) {
       return this.headers[field.toLowerCase()];
   }
}
import {Model}               from "../models/Model";
import {AuthenticateHandler} from "../handlers/AuthenticateHandler";

export interface AuthorizeHandlerOptions {
    allowEmptyState?:boolean;
    authorizationCodeLifetime:number;
    scope?:string
}
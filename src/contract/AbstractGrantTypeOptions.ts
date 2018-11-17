import {Model} from "../models/Model";

export interface AbstractGrantTypeOptions<T extends Model> {
    accessTokenLifetime:number;
    refreshTokenLifetime:number;
    alwaysIssueNewRefreshToken:boolean;
    model:T
}
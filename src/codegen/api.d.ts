// This file was generated by [rspc](https://github.com/oscartbeaumont/rspc). Do not edit this file manually.

export type Procedures = {
    queries: 
        { key: "auth", input: never, result: GetAuthResp } | 
        { key: "me", input: never, result: GetMeResp },
    mutations: never,
    subscriptions: never
};

export type GetAuthResp = { url: string }

export type GetMeResp = { name: string }
export interface UserData {
    id: string,
    username: string,
    fullname: string,
    email: string,
    password: string,
    timezone: string,
    country: string,
    language: string,
    enabled: string,
    created_by: string,
    created_ts: number,
    password_recovery_token: string,
    password_recovery_ts: number,
}
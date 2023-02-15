

export type ZombiSessionData = {
    user_id: string, 
    language: string, 
    timezone: string, 
    fullname: string, 
    email: string, 
    country: string,
    push_notifications_token?: string,
    created?: string,
    updated?: string,
}
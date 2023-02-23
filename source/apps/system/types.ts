export type AppsSystemConfig = {
    basedir: string,
    database: {
        name: string,
        schema: string
    },
    cache: {
        keys: {
            [key: string]: string
        }
    }
}
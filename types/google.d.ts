// Type declarations for Google APIs
declare global {
    interface Window {
        gapi: typeof gapi;
        google: {
            accounts: {
                oauth2: {
                    initTokenClient: (config: {
                        client_id: string;
                        scope: string;
                        callback: (response: any) => void;
                    }) => {
                        requestAccessToken: (options: { prompt?: string }) => void;
                    };
                };
            };
        };
    }
}

declare namespace gapi {
    namespace client {
        function init(config: { discoveryDocs: string[] }): Promise<void>;
        function setToken(token: { access_token: string } | null): void;
        function getToken(): { access_token: string } | null;

        namespace sheets {
            namespace spreadsheets {
                namespace values {
                    function get(params: {
                        spreadsheetId: string;
                        range: string;
                    }): Promise<{ result: { values?: any[][] } }>;

                    function update(params: {
                        spreadsheetId: string;
                        range: string;
                        valueInputOption: string;
                        resource: { values: any[][] };
                    }): Promise<any>;
                }
            }
        }
    }

    function load(api: string, callback: { callback: () => void; onerror: () => void }): void;
}

export { };

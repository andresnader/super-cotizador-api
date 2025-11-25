// Google API Configuration
export const GOOGLE_CONFIG = {
    CLIENT_ID: "1005993441268-4sle7juetquq55efkqehm252ebtml4tv.apps.googleusercontent.com",
    SCOPES: [
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
    ].join(' '),
    DISCOVERY_DOCS: [
        'https://sheets.googleapis.com/$discovery/rest?version=v4',
        'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest',
    ]
};

// Google Sheets IDs and Ranges
export const SHEETS_CONFIG = {
    CLIENTS: {
        SHEET_ID: '1JnowPVvio2tSjNSmQH6z8drqejmiwwVthmkFj2eGf2g',
        RANGE: 'Hoja 1!A2:F'
    },
    SERVICES: {
        SHEET_ID: '19FdGfh7wtznlOHsnp5Ntd9ZF2fSZLd11yUD40VP0VNI',
        RANGE: 'Hoja 1!A2:E'
    },
    QUOTES: {
        SHEET_ID: '153s8Lhum68zConWSbbFQtbR3dYzkafHy-4YQJ1HpvLk',
        RANGE: 'Hoja 1!A2:J'
    }
};

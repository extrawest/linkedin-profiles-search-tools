import { google } from 'googleapis';
import { Result } from "../types";

export const googleApiScope = ["https://www.googleapis.com/auth/spreadsheets"];

export const saveDataToGoogleSheet = async (resultLinks:Result[]) => {
    const client = new google.auth.JWT(
		process.env.SERVICE_EMAIL,
		undefined,
		process.env.PRIVATE_KEY?.split(String.raw`\n`).join("\n"),
		googleApiScope
	);

    const sheets = google.sheets({
		version: "v4",
		auth: client,
	});

    const range = Date.now().toString()

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        requestBody: {
            requests: [
                {
                    addSheet: {
                        properties: {
                            title: range
                        }
                    }
                }
            ]
        }
    });

    const dataToInsert = resultLinks.map(link  => ([link.name, link.link, link.linkedinLink]))

    await sheets.spreadsheets.values.append({
        range,
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        insertDataOption: "INSERT_ROWS",
		valueInputOption: "RAW",
        requestBody: {
            values: [
                [
                    'name',
                    'link',
                    'linkedinLink'
                ],
                ...dataToInsert
            ],
        },
    })

    console.log('SAVED TO GOOGLE SPREADSHEETS, SHEET ID=', range);
}
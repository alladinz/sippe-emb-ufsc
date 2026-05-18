import { google } from 'googleapis';

/**
 * GOOGLE CLOUD SETUP INSTRUCTIONS:
 * 1. Go to https://console.cloud.google.com
 * 2. Create a new project or select the existing one
 * 3. Enable the "Google Sheets API" in APIs & Services
 * 4. Go to "Credentials" -> "Create Credentials" -> "Service Account"
 * 5. Name it "sippe-sheets-reader", role: Viewer
 * 6. After creation, go to the service account -> Keys -> Add Key -> JSON -> Download the JSON file
 * 7. Share the Google Sheets spreadsheet with the service account email (found in the JSON or dashboard)
 * 8. Copy the client_email and private_key values into your .env file
 */

let auth: any = null;

function getAuth() {
  if (auth) return auth;

  const privateKey = process.env.GOOGLE_PRIVATE_KEY 
    ? process.env.GOOGLE_PRIVATE_KEY.split(String.raw`\n`).join('\n').replace(/"/g, '')
    : undefined;

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;

  if (!clientEmail || !privateKey) {
    throw new Error('Google Sheets credentials are not configured in the environment.');
  }

  auth = google.auth.fromJSON({
    client_email: clientEmail,
    private_key: privateKey,
  });
  auth.scopes = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

  return auth;
}

export async function fetchSheetData(): Promise<string[][]> {
  try {
    const authClient = getAuth();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const range = process.env.GOOGLE_SHEETS_RANGE ?? 'Sheet1!A1:AF500';

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID is not configured.');
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });
    return response.data.values ?? [];
  } catch (error: any) {
    console.error('Error fetching data from Google Sheets:', error.message);
    if (error.code === 403) {
      throw new Error('Permissão negada: verifique se a planilha foi compartilhada com o e-mail da conta de serviço.');
    }
    if (error.code === 404) {
      throw new Error('Planilha não encontrada: verifique se o SPREADSHEET_ID está correto.');
    }
    throw new Error(error.message || 'Erro ao acessar o Google Sheets');
  }
}

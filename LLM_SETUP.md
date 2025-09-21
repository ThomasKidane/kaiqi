# LLM Integration Setup Guide

## Environment Configuration

Create a `.env.local` file in your project root with the following configurations:

### Required: Google AI (Gemini) - Currently Used
```bash
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
```

### Optional: Google Drive Integration
```bash
# Google Drive Service Account (for accessing receipts folder)
GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"your-service-account@your-project.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com"}

# Google Drive Folder ID (your receipts folder)
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here
```

## Google Drive Setup Instructions

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Drive API

### 2. Create Service Account
1. Go to "Credentials" → "Create Credentials" → "Service Account"
2. Fill in service account details
3. Create and download the JSON key file
4. Copy the entire JSON content to `GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY`

### 3. Share Your Receipts Folder
1. Open Google Drive and navigate to your receipts folder
2. Right-click → "Share"
3. Add the service account email (from the JSON key file)
4. Give it "Viewer" permissions
5. Copy the folder ID from the URL to `GOOGLE_DRIVE_FOLDER_ID`

### 4. Get Folder ID
The folder ID is in the URL when you open the folder:
```
https://drive.google.com/drive/folders/FOLDER_ID_HERE
```

## What's Changed

### 1. **LLM-Powered Document Analysis**
- Replaced regex patterns with actual AI analysis using Gemini 2.5 Flash
- More accurate vendor name extraction
- Better amount and date recognition
- Intelligent invoice number detection
- Automatic insights generation

### 2. **Google Drive Integration**
- Access receipts directly from Google Drive folder
- Process multiple documents automatically
- Maintains file organization
- No need to manually upload files

### 3. **Enhanced Query Processing**
- Natural language understanding
- SQL query generation from natural language
- Context-aware responses
- Intelligent insights and recommendations
- Better data analysis

### 4. **Continuous Chat Interface**
- No report generation prompts
- Inline results display
- Continuous conversation flow
- Direct numerical responses

## API Costs

- **Google Gemini 2.5 Flash**: ~$0.075 per 1M input tokens, ~$0.30 per 1M output tokens
- **Google Drive API**: Free for reasonable usage

For typical documents, expect ~$0.001-0.01 per document analysis.

## Testing

1. Set up your API keys in `.env.local`
2. Upload documents or connect Google Drive
3. Try queries like:
   - "What is the total volume of transaction for may"
   - "Show me all Uber transactions"
   - "How many transactions do I have"
   - "Process all receipts from Google Drive"

The system now provides intelligent analysis with direct access to your Google Drive receipts!

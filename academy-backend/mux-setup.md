# Mux Setup Guide for SARALÖWE

## Quick Start (Local Development)

### Step 1: Get API Access Tokens
1. Go to https://dashboard.mux.com/settings/access-tokens
2. Click "Generate new token"
3. Name: "SARALOWE Dev"
4. Permissions: Mux Video (Full Access)
5. Copy the **Token ID** and **Token Secret**

### Step 2: Get Signing Key (for secure video playback)
1. Go to https://dashboard.mux.com/settings/signing-keys
2. Click "Generate new key"
3. Download the `.pem` file
4. Copy the **Key ID**
5. Open the `.pem` file and copy the content (the long base64 string between BEGIN/END markers)

### Step 3: Set Environment Variables

**Option A: Create a `.env` file in academy-backend folder:**

```env
MUX_TOKEN_ID=your_token_id_here
MUX_TOKEN_SECRET=your_token_secret_here
MUX_SIGNING_KEY_ID=your_signing_key_id_here
MUX_SIGNING_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\nYOUR_KEY_CONTENT_HERE\n-----END RSA PRIVATE KEY-----
MUX_WEBHOOK_SECRET=
```

**Option B: Set in Windows Environment Variables:**

1. Open System Properties → Environment Variables
2. Add new User variables:
   - `MUX_TOKEN_ID` = your token ID
   - `MUX_TOKEN_SECRET` = your token secret
   - `MUX_SIGNING_KEY_ID` = your signing key ID
   - `MUX_SIGNING_PRIVATE_KEY` = full private key content

**Option C: Pass as command line arguments:**

```bash
mvn spring-boot:run -Dmux.token-id=xxx -Dmux.token-secret=xxx -Dmux.signing-key-id=xxx
```

### Step 4: Webhooks (Optional for now)

For local testing, you can skip webhooks. Videos will upload but you won't get automatic status updates.

To enable webhooks later:
1. Install ngrok: https://ngrok.com/download
2. Run: `ngrok http 8080`
3. Go to https://dashboard.mux.com/settings/webhooks
4. Create webhook: `https://YOUR_NGROK_URL/api/v1/mux/webhook`
5. Select events: `video.asset.ready`, `video.asset.errored`, `video.upload.asset_created`
6. Copy the signing secret to `MUX_WEBHOOK_SECRET`

## Testing Video Upload

1. Create a course as instructor
2. Add a module to the course
3. Add a lesson to the module
4. The backend will request an upload URL from Mux
5. Upload a video file
6. Video will be transcoded and available for streaming

## Frontend Environment

Add to `template/.env`:
```
REACT_APP_MUX_ENV_KEY=your_environment_id_here
```

## Troubleshooting

**"Failed to create video upload URL"**
- Check that MUX_TOKEN_ID and MUX_TOKEN_SECRET are set correctly
- Verify your Mux account is active

**"Video is not ready yet"**
- If webhooks aren't configured, video status won't update automatically
- You can check status in Mux Dashboard → Assets

**Signed playback not working**
- Ensure MUX_SIGNING_KEY_ID and MUX_SIGNING_PRIVATE_KEY are set
- The private key must include the BEGIN/END markers

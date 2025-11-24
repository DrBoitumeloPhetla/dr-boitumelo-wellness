// Google Calendar API Configuration
//
// SETUP INSTRUCTIONS:
// 1. Copy your service account JSON file contents
// 2. Paste the entire JSON object below as GOOGLE_SERVICE_ACCOUNT_KEY
// 3. This file contains sensitive credentials - NEVER commit to git
// 4. Add this file to .gitignore

export const GOOGLE_CALENDAR_CONFIG = {
  // Your calendar ID from Google Calendar settings
  calendarId: 'drboitumelowellnesssupplements@gmail.com',

  // Your service account credentials
  serviceAccountKey: {
    "type": "service_account",
    "project_id": "capable-matrix-477406-q7",
    "private_key_id": "da15cf20c021f1332fd6c66c2d01c231a2b4fcfc",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQDVYLVpUhbcJmev\nwL749T2lRqgD2Kuf1GPVWxBJcbyS3oBPPeKPYHv7lGxA02I88jC9aFiiJ/pjDCOL\n7z5sVdp3flBW6l5N7IWfp9zg5rpnJ5xbOEdTPmr+DQ9O15pRgYsacevzXfNMBZmZ\nUWmVvM/dnsJLRGa1eGMzucR5bn58fEsU4uliiEZ0IuwMtPhF4gCPBlit9thex5Xo\nDlcv+biH8iCdYpQe+xTO0WIvI0Q3bSdOcIKa4s2pTOmCm4dglebY2/zafV9vv6S9\nyMiIREBKAAnf1wHIimpxDMr6ZAowASHBzD70FLfcMecoBe9HgZe+jYwpquU7DcRc\nanAa5SZ/AgMBAAECggEAUJSQfeEr0+DHCGbcV+1ZZeice7NgAOB3ATQ+HtZOdhKD\n1ykSPb4cpEIFbafGciiuQmE9E6PQWYZUiDyF0OjNM5ImqeQhUAEx5zy/28kWfO1H\nDWXf/a5VPnLVJJukYgJvc0Gxbvs8bamxu2Y03wDqaRHS4xTGSuLXZ8nQSmFxb/XZ\nVPbSD3d//LepT7DTOwOLLWvpz+IcsyCABoC1kIVJZU1qyQ/Qn1Bj5dctpVtKc3G/\n1zEgo7UxQY4ajsEpZAaqf3ZNs0qjFDBurvkeZA35p3+SzS09Y8ERmXfeS0P6H3lv\nHT4wOfd5kOB3qX+Sbn0oGLkp2NbgV9O9ZyltA/g45QKBgQD9WKc0hxhDyl6wUIHR\n/eyIRTKIker86gCix6FtCIlg3L6lqi2kJnF9c1hFLUfbkdJQVi4LYE47ChuRfhjc\nk2FgNUYmy5YEvfGnfDs+NQOw/dvJ3ow7uir6K8pT8SlE/EShdQTa1LZ9kLkub7dd\n0Gbi7D6Y/86Ut/UYNqwcHrEN6wKBgQDXnOFML9dOw6ZkQgZCScV2immDmYfwURrj\nBYY9iXY/4fOx/nMEnYyqkXinNVPjaxgNP6bbkv/jbyXhw/Ad8J21z1NQhAAo4E3r\nuCpd7F7aqARDrfvkcM77Ek6jAWgva+WEmd3uIttirYy10vcZEd1wpymRNDpQzgZd\n81SP/rGgvQKBgQDWid5+YvCvZ44r7OEivM8yzrZuZHMEXfzP3BHdTV9YwVZI4AXq\nfguZWrYjTqcNTz00fuZbB+D3qiWSXaAcGkpZuIOBkuGlflxHorJgiXBoz3DyUB2c\n7pg6Zh7eWtjB7IcJ2xiTX5JyXr4SjtRPA449GCYiVm3QDr/lE1dIMM1qpQKBgQCa\nnTEihRwMq1hihMYgOu6S9uZ7LFnDByYUrh15e12Eqe8rMKAiKyh4GCFBJoiliGKS\n/ZYV1vAQk9/CadOCZM1zVt0T29SRe2flJQecmqfafKmyLs13Hz4N5S7mzVd8yg6o\na/4timlv9av1pvbyz1DQO88fBSjcUSFXtepp5+ZQsQKBgQCogPWpipzJ3aKU3oeT\nzr5+gyBJ+kp2xWp1XoD0KM7yaF064V5jtaXdSEwKQNj3Z1j40rWpU11j5IzDrbpS\nL7HQ9ZZPLnuFL0092uNNOOWaFvSAhuilbLLvLBBDjhY1gGQJXNTpuv+Qx73bVCE3\nFUqylSrh+GqybnMxb4X95XP1Eg==\n-----END PRIVATE KEY-----\n",
    "client_email": "dr-boitumelo-wellness@capable-matrix-477406-q7.iam.gserviceaccount.com",
    "client_id": "106124843264254994382",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/dr-boitumelo-wellness%40capable-matrix-477406-q7.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
  },
};

// Validate configuration
export const isCalendarConfigured = () => {
  return (
    GOOGLE_CALENDAR_CONFIG.serviceAccountKey !== null &&
    GOOGLE_CALENDAR_CONFIG.serviceAccountKey.private_key &&
    GOOGLE_CALENDAR_CONFIG.serviceAccountKey.client_email
  );
};


# End-to-End Testing (Cypress)

This project uses **Cypress** for fully automated end-to-end (E2E) testing.
Cypress simulates real user behavior in the browser and tests the full stack:

Frontend -> Backend API -> Database -> Frontend UI

---

# Installation

## 1. Install Node dependencies
From the `/frontend` directory:

```bash
npm install
```

For WSL/Linux users, run the following in Bash to install dependencies for cypress:

```bash
sudo apt update
sudo apt install -y \
  libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libnss3 \
  libxss1 libasound2 libnspr4 xvfb libatk-bridge2.0-0
```

Windows and Mac users should already have these installed. 

Make sure you start the frontend and backend:
```bash
cd ~/subscription-manager/frontend
npm start
```

Start the backend in testing mode: 
```bash
cd ~/subscription-manager/backend
npm start:test
```

To Run the tests using GUI:
```bash
npx cypress open
```
Then Navigate to E2E Testing, select Electron and finally select the test you wish to perform. 


To run Headless:
```bash
npx run cypress:run
```
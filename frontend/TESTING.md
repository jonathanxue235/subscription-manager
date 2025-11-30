
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


For WSL/Linux users, run the following in Bash to install dependencies for cypress:

```bash
sudo apt update
sudo apt install -y \
  libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libnss3 \
  libxss1 libasound2 libnspr4 xvfb libatk-bridge2.0-0

Windows and Mac users should already have these installed. 

```bash
npm run cypress
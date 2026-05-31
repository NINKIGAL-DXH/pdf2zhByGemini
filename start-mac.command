#!/bin/bash
cd "$(dirname "$0")"

clear
echo "=========================================================="
echo "      PDF2ZH Layout-Preserved Translation GUI Launcher"
echo "=========================================================="
echo ""

# Check for Node.js
if ! command -v node &> /dev/null
then
    echo "[!] Node.js was not found on your system."
    echo "    This application requires Node.js to host the GUI."
    echo ""
    echo "    1. We will attempt to install Node.js via Homebrew if you have it."
    echo "    2. Alternatively, download and install Node.js from:"
    echo "       👉 https://nodejs.org/en/download"
    echo ""
    echo "Attempting to find Homebrew..."
    if command -v brew &> /dev/null
    then
        echo "[+] Homebrew found! Installing Node.js..."
        brew install node
    else
        echo "[!] Homebrew not found. Please download Node.js manually from the browser."
        echo "Press any key to open the browser or CTRL+C to cancel..."
        read -n 1 -r
        open "https://nodejs.org/en/download"
        exit 1
    fi
fi

echo "[+] Node.js version in use: $(node -v)"
echo ""

# Step 2: Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "[+] Installing application dependencies (this may take a moment)..."
    npm install
else
    echo "[+] Dependency directory initialized."
fi

# Step 3: Fast build the server & workspace assets
echo "[+] Compiling web layout configuration..."
npm run build

echo ""
echo "=========================================================="
echo "  [SUCCESS] pdf2zh GUI Service compiled successfully!"
echo "  👉 Your Web GUI is booting up on: http://localhost:3000"
echo "  Keep this Terminal window open while using the application."
echo "=========================================================="
echo ""

# Step 4: Run the development / local server
npm run dev

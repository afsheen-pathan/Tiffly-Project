// src/config/api.ts

// --- VERIFY THIS IP ADDRESS ---
// This must be your computer's current IP address on your local Wi-Fi network.
// Find it using 'ipconfig' (Windows) or 'ifconfig' / 'ip addr show' (Mac/Linux).
const LOCAL_IP_ADDRESS = '172.23.8.103'; // Your previously provided IP
// -----------------------------
const PORT = 4242; // Match the port your local-backend server is using

export const API_BASE_URL = `http://${LOCAL_IP_ADDRESS}:${PORT}`;
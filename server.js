const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path'); // NEW: Add this core utility
const app = express();

app.use(cors());
app.use(express.json());
// FIXED: This guarantees the file saves directly next to server.js, no matter where you run it from
const DATA_FILE = path.join(__dirname, 'users.json');

// Helper function to read the database file
function getUsers() {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            // Write an empty array text securely
            fs.writeFileSync(DATA_FILE, JSON.stringify([]), 'utf8');
            return [];
        }
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("Database reading failed, resetting file...", error);
        return [];
    }
}

// Helper function to save to the database file
function saveUsers(users) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
        console.log("Database updated successfully on disk!");
    } catch (error) {
        console.error("Critical: Could not write users to disk!", error);
    }
}

app.get('/', (req, res) => {
  res.send('Gym Server is running!');
});

// ... Leave your signup, login, and stats routes exactly the same below ...

// --- SIGN UP ROUTE ---
app.post('/signup', (req, res) => {
    // We now expect the frontend to send us the chosen 'plan'
    const { username, password, role, plan } = req.body; 
    const users = getUsers(); // Load users from file
    
    const userExists = users.find(u => u.username === username);
    if (userExists) {
        return res.status(400).json({ message: "User already exists!" });
    }

    const newUser = { 
        username: username, 
        password: password, 
        role: role || 'member', 
        plan: plan || 'free' // Save the plan they picked in the dropdown
    };
    
    users.push(newUser);
    saveUsers(users); // BOOM! Save the updated list back to the hard drive!
    
    res.status(201).json({ message: "Sign up successful! You can now log in." });
});

// --- LOGIN ROUTE ---
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = getUsers(); // Load users from file
    
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        res.status(200).json({ message: "Login successful!", role: user.role });
    } else {
        res.status(401).json({ message: "Invalid credentials." });
    }
});

// --- DASHBOARD STATS ROUTE ---
app.get('/api/stats', (req, res) => {
    const users = getUsers(); // Load users from file
    const totalMembers = users.length;
    const proMembers = users.filter(user => user.plan === 'pro').length;
    const monthlyRevenue = proMembers * 50; 
    const activeToday = Math.floor(totalMembers * 0.4);
    const recentMembers = users.slice(-3).reverse();

    res.status(200).json({
        totalMembers: totalMembers,
        monthlyRevenue: monthlyRevenue,
        activeToday: activeToday,
        recentMembers: recentMembers
    });
});

// Look for the cloud provider's port first, otherwise default to 3000 locally
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Gym Server running globally on port ${PORT}`);
});
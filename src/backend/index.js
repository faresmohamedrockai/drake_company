const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Mock users (should match your frontend mock users)
const users = [
  { id: '1', name: 'fadel', email: 'fadel@propai.com', password: 'password', role: 'Admin' },
  { id: '2', name: 'Sales Manager', email: 'sales@propai.com', password: 'password', role: 'Sales Admin' },
  { id: '3', name: 'Abdullah Sobhy', email: 'admin@propai.com', password: 'password', role: 'Team Leader' }
];

app.use(cors());
app.use(express.json());

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(
    u => (u.email === email) && u.password === password
  );
  if (user) {
    // In a real app, never send the password back!
    const { password, ...userData } = user;
    res.json(userData);
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

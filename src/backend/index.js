const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Mock users (should match your frontend mock users)
const users = [
  { id: '1', name: 'fadel', email: 'fadel@propai.com', username: 'fadel', password: 'password', role: 'admin', teamId: '', isActive: true, avatar: '', createdAt: new Date().toISOString() },
  { id: '2', name: 'Sales Manager', email: 'sales@propai.com', username: 'sales', password: 'password', role: 'sales_admin', teamId: '', isActive: true, avatar: '', createdAt: new Date().toISOString() },
  { id: '3', name: 'Abdullah Sobhy', email: 'admin@propai.com', username: 'abdullah', password: 'password', role: 'team_leader', teamId: 'Abdullah Sobhy', isActive: true, avatar: '', createdAt: new Date().toISOString() }
];

// Middleware to verify access token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access token required' });
  }
  
  const token = authHeader.split(' ')[1];
  // In a real app, you would verify the JWT token here
  // For now, we'll just check if token exists
  if (!token) {
    return res.status(401).json({ message: 'Invalid access token' });
  }
  
  next();
};

app.use(cors());
app.use(express.json());

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(
    u => (u.email === email) && u.password === password
  );
  if (user) {
    // In a real app, never send the password back!
    const { password, ...userData } = user;
    res.json({
      ok: true,
      user: userData,
      access_token: 'mock-access-token-' + Date.now() // Mock token
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

// Add user endpoint
app.post('/api/auth/add-user', verifyToken, (req, res) => {
  try {
    const { name, email, username, password, role, teamId, isActive, avatar } = req.body;
    
    // Validate required fields
    if (!name || !email || !username || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check if user already exists
    const existingUser = users.find(u => u.email === email || u.username === username);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }
    
    // Create new user
    const newUser = {
      id: (users.length + 1).toString(),
      name,
      email,
      username,
      password,
      role,
      teamId: teamId || '',
      isActive: isActive !== undefined ? isActive : true,
      avatar: avatar || '',
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    
    // Return user without password
    const { password: _, ...userData } = newUser;
    res.status(201).json(userData);
    
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update user endpoint
app.put('/api/auth/update-user/:id', verifyToken, (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;
    
    // Find user by ID
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update user data
    const updatedUser = { ...users[userIndex], ...updateData };
    users[userIndex] = updatedUser;
    
    // Return user without password
    const { password, ...userData } = updatedUser;
    res.json(userData);
    
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all users endpoint
app.get('/api/auth/users', verifyToken, (req, res) => {
  try {
    // Return users without passwords
    const usersWithoutPasswords = users.map(user => {
      const { password, ...userData } = user;
      return userData;
    });
    res.json(usersWithoutPasswords);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

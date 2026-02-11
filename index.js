const express = require('express');
const cors = require('cors');
const { connect } = require('./db');

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: 'https://receptichkabg.vercel.app',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Define routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/users', require('./routes/users'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/favorites', require('./routes/favorites'));

app.get('/', (req, res) => {
  res.send('РецептичкаБг backend is running!');
});

// Connect to the database and start the server
connect(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
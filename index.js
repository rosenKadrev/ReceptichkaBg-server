const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connect } = require('./db');
const { t } = require('./utils/translations-errors');

const app = express();
const port = process.env.PORT || 3000;

const corsOptions = {
  origin: 'https://receptichkabg.vercel.app',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
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

app.use((err, req, res, next) => {
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ message: t('error.images_only'), data: null, success: false });
  }
  console.error(err);
  res.status(500).json({ message: t('error.internal'), data: null, success: false });
});

// Connect to the database and start the server
connect(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
});
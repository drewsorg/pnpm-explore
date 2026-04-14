const express = require('express');
const _ = require('lodash');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({ status: 'ok', lodashVersion: _.VERSION });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

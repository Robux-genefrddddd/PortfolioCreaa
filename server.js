const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

// Serve static files from dist/spa
app.use(express.static(path.join(__dirname, 'dist/spa'), {
  maxAge: '1y',
  etag: false
}));

// Handle React Router - serve index.html for all non-static routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/spa/index.html'));
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📱 Frontend: http://localhost:${port}`);
});

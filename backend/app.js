const express = require('express');
const app = express();
const recipeRoutes = require('./routes/recipes');
const baseMaterialRoutes = require('./routes/baseMaterials');
const baseMaterialBatch = require('./routes/baseMaterialsBatch');
const cors = require('cors');

app.use(cors());
app.use('/api/recipes', recipeRoutes);
app.use('/api/base-materials', baseMaterialRoutes);
app.use('/api/base-materials', baseMaterialBatch);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
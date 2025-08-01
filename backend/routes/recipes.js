const express = require('express');
const router = express.Router();
const { getFullRecipeTree } = require('../services/recipeService');

router.get("/:itemId/tree", async (req, res) => {
    try {
        const tree = await getFullRecipeTree(parseInt(req.params.itemId));
        res.json(tree);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
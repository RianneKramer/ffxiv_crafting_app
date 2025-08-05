const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/batch", async (req, res) => {

  const recipeIds = [1117, 1118, 1119, 1120, 1121, 1122, 1123]; // Example recipe IDs, replace with actual logic to get these IDs

  if (!Array.isArray(recipeIds) || recipeIds.length === 0) {
    return res.status(400).json({ error: "recipeIds must be a non-empty array" });
  }

  try {
    const results = await db.query(`
    WITH RECURSIVE full_tree AS (
      SELECT 
        rc.component_item_id,
        rc.amount AS quantity,
        1.00 AS multiplier
      FROM recipe_components rc
      WHERE rc.recipe_id = ANY($1::int[])
      
      UNION ALL

      SELECT 
        rc.component_item_id,
        rc.amount AS quantity,
        (ft.quantity * ft.multiplier) / NULLIF(r.yield, 0) AS multiplier
        FROM full_tree ft
        JOIN recipes r ON r.item_id = ft.component_item_id
        JOIN recipe_components rc ON rc.recipe_id = r.id
    )
    SELECT 
      i.id,
      i.name,
      CEIL(SUM(ft.quantity * ft.multiplier)) AS total_quantity,
      s.source_type,
      s.location_description
    FROM full_tree ft
    JOIN items i ON i.id = ft.component_item_id
    LEFT JOIN item_sources s ON s.item_id = i.id
    WHERE ft.component_item_id NOT IN (SELECT item_id FROM recipes)
    GROUP BY i.id, i.name, s.source_type, s.location_description
    ORDER BY i.name
    `, [recipeIds]);
    res.json(results.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res) => {
  try {
    const results = await db.query(`
      SELECT i.id, i.name, s.source_type, s.location_description
      FROM items i
      JOIN recipe_components rc ON rc.component_item_id = i.id
      LEFT JOIN recipes r ON r.item_id = i.id
      LEFT JOIN item_sources s ON s.item_id = i.id
      WHERE r.id IS NULL
      GROUP BY i.id, s.source_type, s.location_description
      ORDER BY i.name
    `);
    res.json(results.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
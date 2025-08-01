const db = require('../db');

async function getFullRecipeTree(itemId, multiplier = 1) {
    // Get item name first
    const itemRes = await db.query(
        'SELECT name FROM items WHERE id = $1',
        [itemId]
    );
    
    const itemName = itemRes.rows[0]?.name || 'Unknown Item';

    const recipeRes = await db.query(
        'SELECT * FROM recipes WHERE item_id = $1',
        [itemId]
    );

    if (recipeRes.rowCount === 0) {
        const sources = await db.query(
            "SELECT source_type, location_description, node_level FROM item_sources WHERE item_id = $1",
            [itemId]
        );

        return {
            itemId,
            itemName,
            amount: multiplier,
            isRaw: true,
            sources: sources.rows,
        };
    }

    const recipe = recipeRes.rows[0];
    const recipeId = recipe.id;
    const craftingClass = recipe.crafting_class || 'Unknown Class';
    const level = recipe.level;
    const yield = recipe.yield;
    const durability = recipe.durability;
    const quality = recipe.quality;
    const componentsRes = await db.query(
        "SELECT component_item_id, amount FROM recipe_components WHERE recipe_id = $1",
        [recipeId]
    );

    const components = await Promise.all(
        componentsRes.rows.map(async (comp) => {
            return await getFullRecipeTree(
                comp.component_item_id,
                comp.amount * multiplier
            );
        })
    );

    return {
        itemId,
        itemName,
        craftingClass,
        level,
        yield,
        durability,
        quality,
        amount: multiplier,
        isRaw: false,
        components,
    };
}

module.exports = {
    getFullRecipeTree
};
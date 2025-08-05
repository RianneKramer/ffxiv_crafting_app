const fs = require('fs');
const path = require('path');
const db = require('../db');
const e = require('express');

async function getOrCreateItemId(name, equipable) {
    const existing = await db.query('SELECT id FROM items WHERE name = $1', [name]);
    if (existing.rowCount > 0) {
        return existing.rows[0].id;
    }

    const res = await db.query(
        'INSERT INTO items (name, equipable) values ($1, $2) RETURNING id',
        [name, equipable]
    );
    return res.rows[0].id;
}

async function importRecipes() {
    const dataDir = path.join(__dirname, '../data');
    
    // Find all JSON files in the data directory
    const files = fs.readdirSync(dataDir)
        .filter(file => file.endsWith('.json'))
        .map(file => path.join(dataDir, file));
    
    if (files.length === 0) {
        console.log('❌ No JSON files found in data directory');
        return;
    }
    
    console.log(`📁 Found ${files.length} recipe files to import:`);
    files.forEach(file => console.log(`   - ${path.basename(file)}`));
    console.log('');
    
    let totalRecipes = 0;
    let updatedRecipes = 0;
    let newRecipes = 0;
    let deletedRecipes = 0;
    
    for (const filePath of files) {
        console.log(`📖 Processing ${path.basename(filePath)}...`);
        
        try {
            const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            
            if (!Array.isArray(jsonData)) {
                console.log(`⚠️ Skipping ${path.basename(filePath)} - not an array`);
                continue;
            }
            
            for (const recipe of jsonData) {
        const itemId = await getOrCreateItemId(recipe.item.name, recipe.item.equipable);

        const existingRecipe = await db.query(
            'SELECT id FROM recipes WHERE item_id = $1',
            [itemId]
        );
        
            let recipeId;
            if (existingRecipe.rowCount > 0) {
            recipeId = existingRecipe.rows[0].id;

                if (recipe.deleted) {
                    // If recipe is marked as deleted, remove it
                    await db.query('DELETE FROM recipe_components WHERE recipe_id = $1', [recipeId]);
                    await db.query('DELETE FROM recipes WHERE id = $1', [recipeId]);
                    console.log(`   ➖ Deleted: ${recipe.item.name}`);
                    deletedRecipes++;
                    continue;
                }
                    
                // Update existing recipe
                await db.query(
                    'UPDATE recipes SET crafting_class = $1, level = $2, yield = $3, durability = $4, quality = $5 WHERE id = $6',
                    [recipe.crafting_class, recipe.level, recipe.yield, recipe.durability, recipe.quality, recipeId]
                );
                
                console.log(`   🔄 Updated: ${recipe.item.name}`);
                updatedRecipes++;
                
            } else {
                // Create new recipe
                const recipeRes = await db.query(
                    'INSERT INTO recipes (item_id, crafting_class, level, yield, durability, quality) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
                    [itemId, recipe.crafting_class, recipe.level, recipe.yield, recipe.durability, recipe.quality]
                );
                recipeId = recipeRes.rows[0].id;
                console.log(`   ➕ Created: ${recipe.item.name}`);
                newRecipes++;
            }
            
            totalRecipes++;
            
            for (const comp of recipe.components) {
                const componentItemId = await getOrCreateItemId(comp.name, false); // Components are typically not equipable

                await db.query(
                    'INSERT INTO recipe_components (recipe_id, component_item_id, amount, item_name) VALUES ($1, $2, $3, $4)',
                    [recipeId, componentItemId, comp.amount, comp.name]
                );

                if (comp.source && Array.isArray(comp.source)) {
                    for (const source of comp.source) {
                        const exists = await db.query(
                            'Select 1 FROM item_sources WHERE item_id = $1 AND source_type = $2 AND location_description = $3',
                            [componentItemId, source.type, source.location]
                        );
                        if (exists.rowCount === 0) {
                            await db.query(
                                'INSERT INTO item_sources (id, item_id, source_type, location_description, node_level, timed) VALUES (DEFAULT, $1, $2, $3, $4, $5)',
                                [componentItemId, source.type, source.location, source.node_level, source.timed]
                            );
                        }
                    }
                }
            }
        }
        
        } catch (error) {
            console.error(`❌ Error processing ${path.basename(filePath)}:`, error.message);
        }
        
        console.log(`✅ Finished processing ${path.basename(filePath)}\n`);
    }
    
    // Final summary
    console.log('📊 Import Summary:');
    console.log(`   Total recipes processed: ${totalRecipes}`);
    console.log(`   New recipes created: ${newRecipes}`);
    console.log(`   Existing recipes updated: ${updatedRecipes}`);
    console.log('✅ All recipe files imported successfully!');

    process.exit();
}

importRecipes().catch(err => {
    console.error('🚨 Importfout:', err);
    process.exit(1);
});
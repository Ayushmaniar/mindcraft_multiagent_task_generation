import minecraftData from 'minecraft-data';

const mc_version = '1.20.4';
const mcdata = minecraftData(mc_version);

/**
 * @typedef {string} ItemName
 * @typedef {string} BlockName
*/

export const WOOD_TYPES = ['oak', 'spruce', 'birch', 'jungle', 'acacia', 'dark_oak'];
export const MATCHING_WOOD_BLOCKS = [
    'log',
    'planks',
    'sign',
    'boat',
    'fence_gate',
    'door',
    'fence',
    'slab',
    'stairs',
    'button',
    'pressure_plate',
    'trapdoor'
]
export const WOOL_COLORS = [
    'white',
    'orange',
    'magenta',
    'light_blue',
    'yellow',
    'lime',
    'pink',
    'gray',
    'light_gray',
    'cyan',
    'purple',
    'blue',
    'brown',
    'green',
    'red',
    'black'
]

export function getItemId(itemName) {
    let item = mcdata.itemsByName[itemName];
    if (item) {
        return item.id;
    }
    return null;
}

export function getItemName(itemId) {
    let item = mcdata.items[itemId]
    if (item) {
        return item.name;
    }
    return null;
}

export function getAllItems(ignore) {
    if (!ignore) {
        ignore = [];
    }
    let items = []
    for (const itemId in mcdata.items) {
        const item = mcdata.items[itemId];
        if (!ignore.includes(item.name)) {
            items.push(item);
        }
    }
    return items;
}

export function getItemCraftingRecipes(itemName) {
    let itemId = getItemId(itemName);
    if (!mcdata.recipes[itemId]) {
        return null;
    }

    let recipes = [];
    for (let r of mcdata.recipes[itemId]) {
        let recipe = {};
        let ingredients = [];
        if (r.ingredients) {
            ingredients = r.ingredients;
        } else if (r.inShape) {
            ingredients = r.inShape.flat();
        }
        for (let ingredient of ingredients) {
            let ingredientName = getItemName(ingredient);
            if (ingredientName === null) continue;
            if (!recipe[ingredientName])
                recipe[ingredientName] = 0;
            recipe[ingredientName]++;
        }
        recipes.push([
            recipe,
            {craftedCount : r.result.count}
        ]);
    }

    return recipes;
}



const loopingItems = new Set(['coal',
        'coal_block',
        'wheat',
        'diamond',
        'emerald',
        'raw_iron',
        'raw_gold',
        'redstone',
        'blue_wool',
        'packed_mud',
        'raw_copper',
        'iron_ingot',
        'dried_kelp',
        'gold_ingot',
        'slime_ball',
        'black_wool',
        'quartz_slab',
        'copper_ingot',
        'lapis_lazuli',
        'honey_bottle',
        'rib_armor_trim_smithing_template',
        'eye_armor_trim_smithing_template',
        'vex_armor_trim_smithing_template',
        'dune_armor_trim_smithing_template',
        'host_armor_trim_smithing_template',
        'tide_armor_trim_smithing_template',
        'wild_armor_trim_smithing_template',
        'ward_armor_trim_smithing_template',
        'coast_armor_trim_smithing_template',
        'spire_armor_trim_smithing_template',
        'snout_armor_trim_smithing_template',
        'shaper_armor_trim_smithing_template',
        'netherite_upgrade_smithing_template',
        'raiser_armor_trim_smithing_template',
        'sentry_armor_trim_smithing_template',
        'silence_armor_trim_smithing_template',
        'wayfinder_armor_trim_smithing_template'
    ]);


/**
 * Gets a detailed plan for crafting an item considering current inventory
 */
export function getDetailedCraftingPlan(targetItem, count = 1, current_inventory = {}) {
    if (!targetItem || count <= 0 || !getItemId(targetItem)) {
        return "Invalid input. Please provide a valid item name and positive count.";
    }

    if (isBaseItem(targetItem)) {
        const available = current_inventory[targetItem] || 0;
        if (available >= count) return "You have all required items already in your inventory!";
        return `${targetItem} is a base item, you need to find ${count - available} more in the world`;
    }

    const inventory = { ...current_inventory };
    const leftovers = {};
    const plan = craftItem(targetItem, count, inventory, leftovers);
    return formatPlan(plan);
}

function isBaseItem(item) {
    return loopingItems.has(item) || getItemCraftingRecipes(item) === null;
}

/**
 * A function to craft an item considering the current inventory and leftovers
 * @param {*} item 
 * @param {*} count 
 * @param {*} inventory 
 * @param {*} leftovers 
 * @param {*} crafted 
 * @returns 
 */
export function craftItem(item, count, inventory, leftovers, crafted = { required: {}, steps: [], leftovers: {} }) {
    // Check available inventory and leftovers first
    const availableInv = inventory[item] || 0;
    const availableLeft = leftovers[item] || 0;
    const totalAvailable = availableInv + availableLeft;

    if (totalAvailable >= count) {
        // Use leftovers first, then inventory
        const useFromLeft = Math.min(availableLeft, count);
        leftovers[item] = availableLeft - useFromLeft;
        
        const remainingNeeded = count - useFromLeft;
        if (remainingNeeded > 0) {
            inventory[item] = availableInv - remainingNeeded;
        }
        return crafted;
    }

    // Use whatever is available
    const stillNeeded = count - totalAvailable;
    if (availableLeft > 0) leftovers[item] = 0;
    if (availableInv > 0) inventory[item] = 0;

    if (isBaseItem(item)) {
        crafted.required[item] = (crafted.required[item] || 0) + stillNeeded;
        return crafted;
    }

    const recipe = getItemCraftingRecipes(item)?.[0];
    if (!recipe) {
        crafted.required[item] = stillNeeded;
        return crafted;
    }

    const [ingredients, result] = recipe;
    const craftedPerRecipe = result.craftedCount;
    const batchCount = Math.ceil(stillNeeded / craftedPerRecipe);
    const totalProduced = batchCount * craftedPerRecipe;

    // Add excess to leftovers
    if (totalProduced > stillNeeded) {
        leftovers[item] = (leftovers[item] || 0) + (totalProduced - stillNeeded);
    }

    // Process each ingredient
    for (const [ingredientName, ingredientCount] of Object.entries(ingredients)) {
        const totalIngredientNeeded = ingredientCount * batchCount;
        craftItem(ingredientName, totalIngredientNeeded, inventory, leftovers, crafted);
    }

    // Add crafting step
    const stepIngredients = Object.entries(ingredients)
        .map(([name, amount]) => `${amount * batchCount} ${name}`)
        .join(' + ');
    crafted.steps.push(`Craft ${stepIngredients} -> ${totalProduced} ${item}`);

    return crafted;
}

function formatPlan({ required, steps, leftovers }) {
    const lines = [];

    if (Object.keys(required).length > 0) {
        lines.push('You are missing the following items:');
        Object.entries(required).forEach(([item, count]) => 
            lines.push(`- ${count} ${item}`));
        lines.push('\nOnce you have these items, here\'s your crafting plan:');
    } else {
        lines.push('You have all items required to craft this item!');
        lines.push('Here\'s your crafting plan:');
    }

    lines.push('');
    lines.push(...steps);

    if (Object.keys(leftovers).length > 0) {
        lines.push('\nYou will have leftover:');
        Object.entries(leftovers).forEach(([item, count]) => 
            lines.push(`- ${count} ${item}`));
    }

    return lines.join('\n');
}

export function getCraftingRequirementsAtDepth(targetItem, count = 1, depth = 0) {

    if (!targetItem || count <= 0 || !getItemId(targetItem) || depth < 0) {
        return null;
    }

    const recipe = getItemCraftingRecipes(targetItem)?.[0];
    if (!recipe) {
        return { [targetItem]: count };
    }

    const [ingredients, result] = recipe;
    const craftedPerRecipe = result.craftedCount;
    const batchCount = Math.ceil(count / craftedPerRecipe);
    
    // Initialize requirements object
    let requirements = {};

    // Process each ingredient
    for (const [ingredientName, ingredientCount] of Object.entries(ingredients)) {
        const totalIngredientNeeded = ingredientCount * batchCount;
        
        // If at depth 0 or ingredient is a looping/base item, don't recurse
        if (depth === 0 || loopingItems.has(ingredientName)) {
            requirements[ingredientName] = (requirements[ingredientName] || 0) + totalIngredientNeeded;
        } else {
            // Recursively get requirements for this ingredient at depth-1
            const ingredientReqs = getCraftingRequirementsAtDepth(ingredientName, totalIngredientNeeded, depth - 1);
            
            // Merge ingredient requirements into overall requirements
            for (const [item, itemCount] of Object.entries(ingredientReqs)) {
                requirements[item] = (requirements[item] || 0) + itemCount;
            }
        }
    }

    return requirements;
}

function areRequirementsEqual(req1, req2) {
    if (!req1 || !req2) return false;
    const keys1 = Object.keys(req1);
    const keys2 = Object.keys(req2);
    
    if (keys1.length !== keys2.length) return false;
    
    return keys1.every(key => 
        keys2.includes(key) && req1[key] === req2[key]
    );
}

export function getMaxCraftingDepth(targetItem, count = 1, maxSearchDepth = 10) {
    /**
     * Returns the maximum depth required to craft the target item
     * @param {ItemName} targetItem - The item to craft
     * @param {number} count - The number of items to craft
     * @param {number} maxSearchDepth - The maximum depth to search for
     */
    if (!targetItem || count <= 0 || !getItemId(targetItem)) {
        return -1;
    }

    let prevRequirements = null;
    
    for (let depth = 0; depth <= maxSearchDepth; depth++) {
        const currentRequirements = getCraftingRequirementsAtDepth(targetItem, count, depth);
        
        if (areRequirementsEqual(prevRequirements, currentRequirements)) {
            return depth - 1; // Return previous depth as it's the last one that caused a change
        }
        
        prevRequirements = currentRequirements;
    }
    
    return maxSearchDepth; // In case we hit the max search depth
}

// Configuration for tasks timeouts based on depth
const BASE_TIMEOUT = 120;
const TIMEOUT_PER_DEPTH = 60;
const SCAVENGING_MULTIPLIER = 1.5;

// Different timeouts based on the root ingredients of the item

export function calculateTimeout(maxDepth, chosenDepth, hasMissingResources) {
    let timeout = BASE_TIMEOUT + (chosenDepth * TIMEOUT_PER_DEPTH);
    if (hasMissingResources) {
        timeout *= SCAVENGING_MULTIPLIER;
    }
    return Math.floor(timeout);
}


// Get random skewed count of targetItems to craft between 1,2 and 3

export function getRandomTargetCount() {
    const rand = Math.random();
    if (rand < 0.8) return 1;
    if (rand < 0.95) return 2;
    return 3;
}

export function isAchievableItem(item) {
    // get all the base items needed to craft this recipe
    if (isBaseItem(item) && achievableBaseItems.includes(item)) return true;
    const depth = getMaxCraftingDepth(item, 1);
    const requirements = getCraftingRequirementsAtDepth(item, 1, depth);
    const baseItems = Object.keys(requirements);

    // check if all the base items are achievable
    return baseItems.every(baseItem => achievableBaseItems.includes(baseItem));

}

export const achievableBaseItems = [
    "cobblestone",
    "cobbled_deepslate",
    "dirt",
    "oak_log",
    "stripped_oak_log",
    "spruce_log",
    "stripped_spruce_log",
    "glass",
    "sand",
    "stone",
    "smooth_stone",
    "brick",
    "clay",
    "charcoal",
    "basalt",
    'coal',
    'raw_iron',
    'raw_gold',
    'redstone',
    'raw_copper',
    'iron_ingot',
    'dried_kelp',
    'gold_ingot',
    'slime_ball',
    'black_wool',
    'copper_ingot',
    'lapis_lazuli',
];

export const toolsForItem = {
    'stone': ["wooden_pickaxe"],
    'cobblestone': ["wooden_pickaxe"],
    'iron_ore': ["stone_pickaxe"], 
    'gold_ore': ["iron_pickaxe"],
    'redstone': ["iron_pickaxe"],
    'lapis_lazuli_ore': ["iron_pickaxe"],
    "iron_ingot": ["stone_pickaxe", "furnace"],
    "gold_ingot": ["iron_pickaxe", "furnace"],
    "redstone": ["diamond_pickaxe"],
    "lapis_lazuli": ["iron_pickaxe"],
    "copper_ingot": ["iron_pickaxe"],
    "raw_iron": ["stone_pickaxe"],
    "raw_gold": ["iron_pickaxe"],
    "raw_copper": ["iron_pickaxe"],
    "coal": ["iron_pickaxe"],
    "black_wool": ["shears"],
}

export const repeatedItems = {
    'stairs': ["oak_stairs"],
    'fence': ["oak_fence"],
    'fence_gate': ["oak_fence_gate"],
    'door': ["oak_door"],
    'trapdoor': ["oak_trapdoor"],
    'button': ["oak_button"],
    'pressure_plate': ["oak_pressure_plate"],
    'slab': ["oak_slab"],
    'chest_boat': ["oak_chest_boat"],
    'chest_raft': ["oak_chest_raft"],
    'sign': ["oak_sign"],
    'hanging_sign': ["oak_hanging_sign"],
    'boat': ["oak_boat"],
    'bed': ["purple_bed", "cyan_bed", "magenta_bed", "red_bed"],
    'candle': ["purple_candle", "cyan_candle", "magenta_candle", "red_candle"],
    'carpet': ["purple_carpet", "cyan_carpet", "magenta_carpet", "red_carpet"],
    'concrete': ["purple_concrete", "cyan_concrete", "magenta_concrete", "red_concrete"],
    'concrete_powder': ["purple_concrete_powder", "cyan_concrete_powder", "magenta_concrete_powder", "red_concrete_powder"],
    'terracotta': ["purple_terracotta", "cyan_terracotta", "magenta_terracotta", "red_terracotta"],
    'stained_glass': ["purple_stained_glass", "cyan_stained_glass", "magenta_stained_glass", "red_stained_glass"],
}

export const foodItems = [
    "pumpkin_pie", 
    "bread",
    "cake",
    "cookie",
    "beetroot_soup",
    "mushroom_stew", 
    "rabbit_stew"
]

export function checkIfRepeated(item) {
    /**
     * Check if the item is a repeated item
     * @param {Object} item - The item object
     */
    const keys = Object.keys(repeatedItems);
    for (const key of keys) {
        if (item.name.includes(key) && !repeatedItems[key].includes(item.name)) {
            return true;
        }
    }
    return false;
}

export function checkIfFood(item) {
    /**
     * Check if the item is a food item
     * @param {Object} item - The item object
     */
    return foodItems.includes(item.name);
}
import * as mc from './utility_functions.js';
import readline from 'readline';
import fs from 'fs/promises';
import path from 'path';

async function generateMultiagentTasks() {
    const tasks = {};
    const allItems = mc.getAllItems();
    
    for (let i = 1; i <= 100000; i++) {
        // Generate random item, count and depth
        const randomItem = allItems[Math.floor(Math.random() * allItems.length)].name;
        const randomCount = mc.getRandomTargetCount();
        const maxDepth = mc.getMaxCraftingDepth(randomItem);
        
        // Skip if item has no valid crafting depth
        if (maxDepth === -1) continue;
        
        const chosenDepth = Math.floor(Math.random() * (maxDepth + 1));
        
        // Get crafting requirements at chosen depth
        const requirements = mc.getCraftingRequirementsAtDepth(randomItem, randomCount, chosenDepth);
        if (!requirements) continue;
        
        // Determine if this task should have missing resources (20% chance)
        const hasMissingResources = Math.random() < 0.2;
        let missingResourcesPercentage = 0;
        let missingResources = {};
        
        // Create initial inventory by distributing resources between agents
        const initialInventory = {
            andy: {},
            randy: {}
        };
        
        for (const [resource, count] of Object.entries(requirements)) {
            let availableCount = count;
            
            if (hasMissingResources) {
                // Calculate missing resources (0-40% of total)
                const missingPercent = Math.random() * 0.4;
                const missingCount = Math.floor(count * missingPercent);
                if (missingCount > 0) {
                    missingResources[resource] = missingCount;
                    availableCount = count - missingCount;
                }
            }
            
            // Generate a random distribution percentage between 40% and 60%
            const andyPercentage = 0.4 + (Math.random() * 0.2); // Random between 0.4 and 0.6
            
            // Calculate counts based on percentage
            let andyCount = Math.floor(availableCount * andyPercentage);
            let randyCount = availableCount - andyCount;
            
            // Ensure each agent gets at least one item if there are enough resources
            if (availableCount >= 2) {
                if (andyCount === 0) {
                    andyCount = 1;
                    randyCount = availableCount - 1;
                } else if (randyCount === 0) {
                    randyCount = 1;
                    andyCount = availableCount - 1;
                }
            }
            
            if (andyCount > 0) initialInventory.andy[resource] = andyCount;
            if (randyCount > 0) initialInventory.randy[resource] = randyCount;
        }
        
        // Calculate total missing resources percentage
        if (hasMissingResources && Object.keys(missingResources).length > 0) {
            let totalRequired = 0;
            let totalMissing = 0;
            
            for (const [resource, count] of Object.entries(requirements)) {
                totalRequired += count;
                if (missingResources[resource]) {
                    totalMissing += missingResources[resource];
                }
            }
            
            missingResourcesPercentage = Math.round((totalMissing / totalRequired) * 100);
        }
        
        // Determine blocked access to crafting plan
        let blockedAccess = [];
        const accessRoll = Math.random();
        if (accessRoll > 0.7 && accessRoll <= 0.9) {
            // 20% chance one agent is blocked
            blockedAccess = [Math.random() < 0.5 ? "andy" : "randy"];
        } else if (accessRoll > 0.9) {
            // 10% chance both agents are blocked
            blockedAccess = ["andy", "randy"];
        }
        
        // Calculate timeout based on depth and missing resources
        const timeout = mc.calculateTimeout(maxDepth, chosenDepth, hasMissingResources);
        
        // Create task object
        const taskName = `multiagent_crafting_${randomCount}_${randomItem}`;
        tasks[taskName] = {
            goal: `Collaborate with other agents to craft ${randomCount} ${randomItem}.`,
            agent_names: ["andy", "randy"],
            agent_number: 2,
            initial_inventory: initialInventory,
            target: randomItem,
            number_of_target: randomCount,
            type: "techtree",
            chosen_depth: chosenDepth,
            timeout: timeout,
            missing_resources_percentage: missingResourcesPercentage,
            missing_resources: missingResources,
            blocked_access_to_craftingPlan: blockedAccess
        };
    }
    
    // Create directory if it doesn't exist
    await fs.mkdir('generated_tasks', { recursive: true });
    
    // Write tasks to file
    await fs.writeFile(
        path.join('generated_tasks', 'multiagent_tasks.json'),
        JSON.stringify(tasks, null, 2)
    );
    
    console.log(`Successfully generated multi-agent tasks`);

    return tasks;
}
// Execute the function
const tasks = await generateMultiagentTasks().catch(console.error);

export const achievableBaseItems = [
    "cobblestone",
    "cobbled_deepslate",
    "dirt",
    "oak_log",
    "stripped_oak_log",
    "spruce_log",
    "stripped_birch_log",
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
    'wool',
    'packed_mud',
    'raw_copper',
    'iron_ingot',
    'dried_kelp',
    'gold_ingot',
    'slime_ball',
    'black_wool',
    'copper_ingot',
    'lapis_lazuli',
];

export const neededItems = {
    'stone': "wooden_pickaxe",
    'iron_ore': "stone_pickaxe", 
    'gold_ore': "iron_pickaxe",
    'redstone': "iron_pickaxe",
    'lapis_lazuli_ore': "stone_pickaxe",
    "iron_ingot": "stone_pickaxe",
    "gold_ingot": "iron_pickaxe",
    "redstone": "iron_pickaxe",
    "lapis_lazuli": "stone_pickaxe",
    "copper_ingot": "stone_pickaxe",
    "raw_iron": "stone_pickaxe",
    "raw_gold": "iron_pickaxe",
    "raw_copper": "stone_pickaxe",
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
        if (key.includes(item.name) && !repeatedItems[key].includes(item.name)) {
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


// console.log('Tasks:', tasks);   
function filterTasksWithAchievableItems(tasks, AchievableItems) {
    const filteredTasks = {};
    
    for (const [taskName, task] of Object.entries(tasks)) {
        // console.log('Task:', taskName);
        const allResources = Object.keys(task.initial_inventory.andy).concat(Object.keys(task.initial_inventory.randy)).concat(Object.keys(task.missing_resources));
        const allResourcesInAchievableItems = allResources.every(resource => AchievableItems.includes(resource));

        // Filter tasks with achievable base items and chosen depth of 2 or 3
        if (allResourcesInAchievableItems && (task.chosen_depth >= 2)) {
            filteredTasks[taskName] = task;
        }
    }

    return filteredTasks;
}


console.log(mc.getCraftingRequirementsAtDepth("jungle_sign", 1, 1));
console.log(mc.getCraftingRequirementsAtDepth("jungle_sign", 1, 2));
console.log(mc.getCraftingRequirementsAtDepth("jungle_sign", 1, 3));

const filteredTasks = filterTasksWithAchievableItems(tasks, AchievableItems);
console.log('Filtered tasks:', filteredTasks);

// Save filtered tasks to file
const filteredTasksFilePath = path.join('generated_tasks', 'filtered_multiagent_tasks.json');
await fs.writeFile(filteredTasksFilePath, JSON.stringify(filteredTasks, null, 2));
console.log(`Filtered tasks saved to ${filteredTasksFilePath}`);


// console.log('Printing recipes for some items');
// console.log("Recipes for slime_ball:", mc.getItemCraftingRecipes("slime_ball"));
// console.log("Recipes for blaze_powder:", mc.getItemCraftingRecipes("blaze_powder"));
// console.log("Recipes for blaze_rod:", mc.getItemCraftingRecipes("blaze_rod"));
// console.log("Recipes for magma_cream:", mc.getItemCraftingRecipes("magma_cream"));
// console.log("Recipes for black_wool:", mc.getItemCraftingRecipes("black_wool"));

// console.log("Recipes for crafting_table:", mc.getItemCraftingRecipes("crafting_table"));
// console.log("Recipes for furnace:", mc.getItemCraftingRecipes("jungle_sign"));
// console.log("Recipes for furnace:", mc.getItemCraftingRecipes("furnace"));


// console.log("Printing detailed crafting plan for some items");
// console.log(mc.getDetailedCraftingPlan("jungle_sign", 1));
// console.log(mc.getDetailedCraftingPlan("jungle_sign", 2));
// console.log(mc.getDetailedCraftingPlan("compass", 1));
// console.log(mc.getDetailedCraftingPlan("warped_fence", 1));
// console.log(mc.getDetailedCraftingPlan("warped_fence", 2));
// console.log(mc.getDetailedCraftingPlan("diamond_block", 1));
// console.log(mc.getDetailedCraftingPlan("oak_log", 1));

// const allItems = mc.getAllItems();

// const baseItems = allItems.filter(item => {
//     const recipes = mc.getItemCraftingRecipes(item.name);
//     return !recipes || recipes.length === 0;
// });
// const baseItemNames = baseItems.map(item => item.name);
// console.log("Items with no recipes:", baseItemNames);

// const baseItemsFilePath = path.join('./', 'base_items.txt');
// await fs.writeFile(baseItemsFilePath, baseItemNames.join('\n'));
// console.log(`Base item names saved to ${baseItemsFilePath}`);


// const allRecipes = {};

// for (const item of allItems) {
//     const recipes = mc.getItemCraftingRecipes(item.name);
//     allRecipes[item.name] = recipes || [];
// }

// const uniqueIngredients = new Set();

// for (const [itemName, recipes] of Object.entries(allRecipes)) {
//     for (const recipe of recipes) {
//         for (const ingredient of Object.keys(recipe[0])) {
//             uniqueIngredients.add(ingredient);
//         }
//     }
// }

// const unusedItems = allItems.filter(item => !uniqueIngredients.has(item.name));
// const unusedItemNames = unusedItems.map(item => item.name);

// const intersection = Array.from(uniqueIngredients).filter(item => baseItemNames.includes(item));

// const intersectionFilePath = path.join('./', 'intersection_items.txt');
// await fs.writeFile(intersectionFilePath, intersection.join('\n'));
// console.log(`Intersection of unused items and base items saved to ${intersectionFilePath}`);


// // console.log('Trying calling the function with current_inventory');

// // console.log(mc.getDetailedCraftingPlan("jungle_sign", 1, {"oak_log": 2, "stick": 2}));
// // console.log(mc.getDetailedCraftingPlan("jungle_sign", 2));
// // console.log(mc.getDetailedCraftingPlan("compass", 1, {"iron_ingot": 2}));
// // console.log(mc.getDetailedCraftingPlan("warped_fence", 1, {"diamond": 1, "stick": 1}));
// // console.log(mc.getDetailedCraftingPlan("diamond_block", 1, {"diamond": 8}));
// // console.log(mc.getDetailedCraftingPlan("oak_log", 1, {"oak_log": 1}));

// // console.log(mc.getDetailedCraftingPlan("lantern", 1, {"diamond": 8, "iron_ingot": 1}));
// // console.log(mc.getDetailedCraftingPlan("lantern", 1));

// // console.log(mc.getItemCraftingRecipes("compass"));
// // console.log(mc.getItemCraftingRecipes("quartz_slab"));
// // console.log(mc.getItemCraftingRecipes("chiseled_quartz_block"));
// // console.log(mc.getItemCraftingRecipes("redstone"));

// // console.log('Printing detailed crafting plan for some items');

// // console.log(mc.getDetailedCraftingPlan({"oak_slab":4},"compass",1).response);

// // console.log(mc.getDetailedCraftingPlan({"oak_slab":4},"black_wool",1).response);

// // console.log(mc.getDetailedCraftingPlan({},"warped_fence",1).response);

// // console.log(mc.getDetailedCraftingPlan({},"diamond_block",1).response);
// // 
// // console.log(mc.getDetailedCraftingPlan({},"jungle_sign",1).response);
// // console.log(mc.getDetailedCraftingPlan({},"jungle_sign",2).response);
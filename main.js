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
        
        // Create initial inventory by distributing resources between agents
        const initialInventory = {
            andy: {},
            randy: {}
        };
        
        for (const [resource, count] of Object.entries(requirements)) {
            if (hasMissingResources) {
                // Calculate missing resources (0-40% of total)
                missingResourcesPercentage = Math.random() * 0.4;
                const availableCount = Math.floor(count * (1 - missingResourcesPercentage));
                
                // Distribute available resources randomly between agents
                const andyCount = Math.floor(Math.random() * (availableCount + 1));
                const randyCount = availableCount - andyCount;
                
                if (andyCount > 0) initialInventory.andy[resource] = andyCount;
                if (randyCount > 0) initialInventory.randy[resource] = randyCount;
            } else {
                // Distribute all resources randomly between agents
                const andyCount = Math.floor(Math.random() * (count + 1));
                const randyCount = count - andyCount;
                
                if (andyCount > 0) initialInventory.andy[resource] = andyCount;
                if (randyCount > 0) initialInventory.randy[resource] = randyCount;
            }
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
            missing_resources: Math.round(missingResourcesPercentage * 100)
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

const achievableBaseItems = [
    "quartz",
    "cobblestone",
    "cobbled_deepslate",
    "pointed_dripstone",
    "dirt",
    "gravel",
    "oak_log",
    "stripped_oak_log",
    "spruce_log",
    "stripped_spruce_log",
    "birch_log",
    "stripped_birch_log",
    "jungle_log",
    "stripped_jungle_log",
    "acacia_log",
    "stripped_acacia_log",
    "cherry_log",
    "stripped_cherry_log",
    "dark_oak_log",
    "stripped_dark_oak_log",
    "mangrove_log",
    "stripped_mangrove_log",
    "stripped_bamboo_block",
    "mud",
    "mangrove_roots",
    "glass",
    "sand",
    "green_dye",
    "moss_block",
    "stone",
    "smooth_stone",
    "brick",
    "charcoal",
    "basalt",
    "ice",
    "carrot",
    "flint",
    "feather",
    "brown_mushroom",
    "red_mushroom",
    "apple",
    "rabbit_hide",
    "sugar_cane",
    "orange_tulip",
    "lilac",
    "blue_orchid",
    "dandelion",
    "sunflower",
    "peony",
    "pink_petals",
    "pink_tulip",
    "azure_bluet",
    "oxeye_daisy",
    "white_tulip",
    "pitcher_plant",
    "cornflower",
    "cocoa_beans",
    "beetroot",
    "poppy",
    "rose_bush",
    "red_tulip",
    "egg",
    "pumpkin"
];

// console.log('Tasks:', tasks);   
function filterTasksWithAchievableBaseItems(tasks, achievableBaseItems) {
    const filteredTasks = {};
    
    for (const [taskName, task] of Object.entries(tasks)) {
        // console.log('Task:', taskName);
        const allResources = Object.keys(task.initial_inventory.andy).concat(Object.keys(task.initial_inventory.randy));
        const allResourcesInAchievableBaseItems = allResources.every(resource => achievableBaseItems.includes(resource));

        // Filter tasks with achievable base items and chosen depth of 2 or 3
        if (allResourcesInAchievableBaseItems && (task.chosen_depth >= 2)) {
            filteredTasks[taskName] = task;
        }
    }

    return filteredTasks;
}

const filteredTasks = filterTasksWithAchievableBaseItems(tasks, achievableBaseItems);
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
// console.log("Recipes for furnace:", mc.getItemCraftingRecipes("wooden_pickaxe"));
// console.log("Recipes for furnace:", mc.getItemCraftingRecipes("furnace"));


// console.log("Printing detailed crafting plan for some items");
// console.log(mc.getDetailedCraftingPlan("wooden_pickaxe", 1));
// console.log(mc.getDetailedCraftingPlan("wooden_pickaxe", 2));
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

// // console.log(mc.getDetailedCraftingPlan("wooden_pickaxe", 1, {"oak_log": 2, "stick": 2}));
// // console.log(mc.getDetailedCraftingPlan("wooden_pickaxe", 2));
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
// // console.log(mc.getDetailedCraftingPlan({},"wooden_pickaxe",1).response);
// // console.log(mc.getDetailedCraftingPlan({},"wooden_pickaxe",2).response);
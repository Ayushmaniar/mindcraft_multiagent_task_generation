import { allowedNodeEnvironmentFlags } from 'process';
import * as mc from './utility_functions.js';
import fs from 'fs';

let items = mc.getAllItems();
console.log(items.length);
items = items.filter(item => !mc.checkIfRepeated(item));
console.log(items.length);
items = items.filter(item => !mc.checkIfFood(item));
console.log(items.length);

// function getRecipe(item) {
//     const depth = mc.getMaxCraftingDepth(item);
//     if (depth >= -1) {
//         const recipe = mc.getCraftingRequirementsAtDepth(item, depth);
//         return recipe;
//     } else {
//         return null;
//     }
// }

// const recipes = items.map(item => getRecipe(item.name));
// const detailedCratingPlans = items.map(item => mc.getDetailedCraftingPlan(item.name));
// console.log(detailedCratingPlans);

function stepsInCommon(plan0, plan1) {
    let commonSteps = 0;
    for (const step0 of plan0.steps) {
        for (const step1 of plan1.steps) {
            if (step0 === step1) {
                commonSteps++;
            }
        }
    }
    return commonSteps;
}

console.log("about to call craftItem");
mc.craftItem("coal_block", 1, {}, {});
const interestingCraftableItems = items.filter(item => mc.craftItem(item.name, 1, {}, {}).steps.length > 1);
console.log(interestingCraftableItems.length);

function selectColumn(array, columnIndex) {
    return array.map(row => row[columnIndex]);
}

function trainTestSplit(craftableItems, train_suffixes, test_suffixes) {
    const train = [];
    const test = [];
    for (let i = 0; i < craftableItems.length; i++) {
        let item_name = craftableItems[i].name;

        if (train_suffixes.some(suffix => item_name.endsWith(suffix))) {
            train.push(craftableItems[i]);
        } else if (test_suffixes.some(suffix => item_name.endsWith(suffix))) {
            test.push(craftableItems[i]);
        } else {
            const randomNumber = Math.floor(Math.random() * 11);
            if (randomNumber % 2 === 0) {
                train.push(craftableItems[i]);
            } else {
                test.push(craftableItems[i]);
            }
        }
    }

    return {
        "train": train, 
        "test": test
    };

}

const train_suffixes = ["pickaxe", "axe", "hoe", "wall", "sword"];
const test_suffixes = ["minecart", "shovel", "dye", "bed", "wool"];

function avg_std_plan_lengths(items) {
    const plan_lengths = [];
    for (const item of items) {
        const plan_length = mc.craftItem(item.name, 1, {}, {}).steps.length;
        plan_lengths.push(plan_length);
    }
    const avg_plan_lengths = plan_lengths.reduce((a, b) => a + b, 0) / plan_lengths.length;
    const std_plan_lengths = Math.sqrt(plan_lengths.map(x =>
        Math.pow(x - avg_plan_lengths, 2)).reduce((a, b) => a + b, 0) / plan_lengths.length);
    return {
        "avg": avg_plan_lengths,
        "std": std_plan_lengths
    };
}

const obj = trainTestSplit(interestingCraftableItems, train_suffixes, test_suffixes);
const train_items = obj["train"];

const avg_std_train = avg_std_plan_lengths(train_items);


// Shuffle the test items
const shuffledTestItems = obj["test"].slice();
for (let i = shuffledTestItems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledTestItems[i], shuffledTestItems[j]] = [shuffledTestItems[j], shuffledTestItems[i]];
}

// Split the shuffled test items into dev and test
const dev_items = shuffledTestItems.slice(0, Math.floor(shuffledTestItems.length / 2));
const test_items = shuffledTestItems.slice(Math.floor(shuffledTestItems.length / 2));

console.log("Number of train items: ", train_items.length);
console.log("Number of dev items: ", dev_items.length);
console.log("Number of test items: ", test_items.length);

const train_items_string = train_items.map(item => item.name).join('\n');
const dev_items_string = dev_items.map(item => item.name).join('\n');
const test_items_string = test_items.map(item => item.name).join('\n');

const train_items_save_path = "./train_items.txt";
const dev_items_save_path = "./dev_items.txt";
const test_items_save_path = "./test_items.txt";

fs.writeFileSync(train_items_save_path, train_items_string);
fs.writeFileSync(dev_items_save_path, dev_items_string);
fs.writeFileSync(test_items_save_path, test_items_string);


console.log("Average and std plan length for train items: ", avg_std_plan_lengths(train_items));
console.log("Average and std plan length for dev items: ", avg_std_plan_lengths(dev_items));
console.log("Average and std plan length for test items: ", avg_std_plan_lengths(test_items));



// create all possible tasks for both train and test splits :) 

const train_tasks = makeTasks(train_items);
const dev_tasks = makeTasks(dev_items);
const test_tasks = makeTasks(test_items);

console.log("Number of train tasks: ", Object.keys(train_tasks).length);
console.log("Number of dev tasks: ", Object.keys(dev_tasks).length);
console.log("Number of test tasks: ", Object.keys(test_tasks).length);

console.log("Average and std depth for train tasks: ", avg_and_std_depth(train_tasks));
console.log("Average and std depth for dev tasks: ", avg_and_std_depth(dev_tasks));
console.log("Average and std depth for test tasks: ", avg_and_std_depth(test_tasks));
console.log("Number of tasks based on depth for train tasks: ", get_num_tasks_based_depth(train_tasks));
console.log("Number of tasks based on depth for dev tasks: ", get_num_tasks_based_depth(dev_tasks));
console.log("Number of tasks based on depth for test tasks: ", get_num_tasks_based_depth(test_tasks));
console.log("Number of missing resources for train tasks: ", check_num_missing_resources(train_tasks));
console.log("Number of missing resources for dev tasks: ", check_num_missing_resources(dev_tasks));
console.log("Number of missing resources for test tasks: ", check_num_missing_resources(test_tasks));

const trimmed_train_tasks = trim_down_tasks(train_tasks, 200);
const trimmed_dev_tasks = trim_down_tasks(dev_tasks);
const trimmed_test_tasks = trim_down_tasks(test_tasks);

console.log("Number of train tasks after trimming: ", Object.keys(trimmed_train_tasks).length);
console.log("Number of dev tasks after trimming: ", Object.keys(trimmed_dev_tasks).length);
console.log("Number of test tasks after trimming: ", Object.keys(trimmed_test_tasks).length);

console.log("Average and std depth for train tasks after trimming: ", avg_and_std_depth(trimmed_train_tasks));
console.log("Average and std depth for dev tasks after trimming: ", avg_and_std_depth(trimmed_dev_tasks));
console.log("Average and std depth for test tasks after trimming: ", avg_and_std_depth(trimmed_test_tasks));
console.log("Number of tasks based on depth for train tasks after trimming: ", get_num_tasks_based_depth(trimmed_train_tasks));
console.log("Number of tasks based on depth for dev tasks after trimming: ", get_num_tasks_based_depth(trimmed_dev_tasks));
console.log("Number of tasks based on depth for test tasks after trimming: ", get_num_tasks_based_depth(trimmed_test_tasks));
console.log("Number of missing resources for train tasks after trimming: ", check_num_missing_resources(trimmed_train_tasks));
console.log("Number of missing resources for dev tasks after trimming: ", check_num_missing_resources(trimmed_dev_tasks));
console.log("Number of missing resources for test tasks after trimming: ", check_num_missing_resources(trimmed_test_tasks));

const train_save_path = "./train_tasks.json";
const dev_save_path = "./dev_tasks.json";
const test_save_path = "./test_tasks.json";

fs.writeFileSync(train_save_path, JSON.stringify(trimmed_train_tasks, null, 2));
fs.writeFileSync(dev_save_path, JSON.stringify(trimmed_dev_tasks, null, 2));
fs.writeFileSync(test_save_path, JSON.stringify(trimmed_test_tasks, null, 2));

function check_num_missing_resources(tasks) {
    const num_missing_resources = {};
    for (const task_name of Object.keys(tasks)) {
        const task = tasks[task_name];
        const missing_items = task.missing_items;
        if (num_missing_resources[missing_items.length]) {
            num_missing_resources[missing_items.length]++;
        } else {
            num_missing_resources[missing_items.length] = 1;
        }
    }
    return num_missing_resources;
}


function trim_down_tasks(tasks, num_tasks = 100) {
    const trimmed_tasks = {};
    const tasks_of_depth = get_tasks_of_depth(tasks, 0);
    const tasks_of_depth_1 = get_tasks_of_depth(tasks, 1);

    const shuffled_tasks_of_depth = shuffleObject(tasks_of_depth);
    const shuffled_tasks_of_depth_1 = shuffleObject(tasks_of_depth_1);

    for (let i = 0; i < num_tasks; i++) {
        const task_name_0 = Object.keys(shuffled_tasks_of_depth)[i];
        trimmed_tasks[task_name_0] = shuffled_tasks_of_depth[task_name_0];
        const task_name_1 = Object.keys(shuffled_tasks_of_depth_1)[i];
        trimmed_tasks[task_name_1] = shuffled_tasks_of_depth_1[task_name_1];
    }

    for (const task_name of Object.keys(tasks)) {
        let task = tasks[task_name];
        if (task.depth > 1) {
            trimmed_tasks[task_name] = task;
        }
    }
    return trimmed_tasks;
}

function shuffleObject(obj) {
    const shuffledArray = Object.entries(obj).sort(() => Math.random() - 0.5);
    return Object.fromEntries(shuffledArray);
}

function get_tasks_of_depth(tasks, depth) {
    const tasks_of_depth = {};
    
    for (const task_name of Object.keys(tasks)) {
        let task = tasks[task_name];
        if (task.depth === depth) {
            tasks_of_depth[task_name] = task;
        }
    }
    
    return tasks_of_depth;
}

function get_num_tasks_based_depth(tasks) {
    const depth_counts = {};
    for (const task of Object.values(tasks)) {
        if (depth_counts[task.depth]) {
            depth_counts[task.depth]++;
        } else {
            depth_counts[task.depth] = 1;
        }
    }
    return depth_counts;
}

function avg_and_std_depth(tasks) {
    const depths = [];
    for (const task of Object.values(tasks)) {
        depths.push(task.depth);
    }
    const avg_depth = depths.reduce((a, b) => a + b, 0) / depths.length;
    const std_depth = Math.sqrt(depths.map(x =>
        Math.pow(x - avg_depth, 2)).reduce((a, b) => a + b, 0) / depths.length);
    return {
        "avg": avg_depth,
        "std": std_depth
    };
}

function makeTasks(items) {
    const tasks = {};
    for (const item of items) {
        const plan = mc.craftItem(item.name, 1, {}, {});
        
        const depth = mc.getMaxCraftingDepth(item.name);
    
        for (let i = 0; i < depth; i++) {
            const task = mc.getDetailedCraftingPlan(item.name, i);
            const requirements = mc.getCraftingRequirementsAtDepth(item.name, 1, i);
            
            // get all possible sub groups of requirements.keys()
            const keys = Array.from(Object.keys(requirements));
            const combinations = getCombinations(keys);
            for (const combination of combinations) {
                let remaining_items = combination;
                let missing_items = keys.filter(item => !remaining_items.includes(item));
    
                const initialInventory = {
                    "0": {},
                    "1": {}
                };
                let unattainable = false;
                let is_wood = false;
                const wood_stuff = ["stick", "oak_planks", "oak_log"];
                for (const missing_item of missing_items) {
                    
                    // TODO: update this craftable check to include all items that can be crafted from attainable items
                    if (!mc.isAchievableItem(missing_item)) {
                        unattainable = true;
                        break;
                    } else if (wood_stuff.includes(missing_item)) {
                        is_wood = true;
                        break;
                    } else {
                        if (missing_item === "iron_ingot") {
                            console.log(Object.keys(mc.toolsForItem));
                        }
                        if (Object.keys(mc.toolsForItem).includes(missing_item)) {
                            // give either agent randomly the required tool
                            const tools = mc.toolsForItem[missing_item];
                            // const randomInt = Math.floor(Math.random() * 10);
                            // if (randomInt % 2 === 0) {
                            //     initialInventory["0"][tool] = 1;
                            // } else {
                            //     initialInventory["1"][tool] = 1;
                            // }
                            for (const tool of tools) {
                                remaining_items.push(tool);
                                requirements[tool] = 1;
                            }
                        }
                    }
                }
                if (unattainable || is_wood) {
                    continue;
                }
                for (const idx in remaining_items) {
                    const count = requirements[remaining_items[idx]];
                    const item_name = remaining_items[idx];
                    if (count > 1) {
                        initialInventory["0"][item_name] = Math.floor(count / 2) + 1;
                        initialInventory["1"][item_name] = Math.floor(count / 2);
                    } else {
                        const totalInventory_0 = Object.keys(initialInventory["0"]).length;
                        const totalInventory_1 = Object.keys(initialInventory["1"]).length;
                        if (totalInventory_0 <= totalInventory_1) {
                            initialInventory["0"][item_name] = 1;
                        } else {  
                            initialInventory["1"][item_name] = 1;
                        }
                    }
                }
                let all_wood = false;
                for (const key in Object.keys(initialInventory)) {
                    let inventory = initialInventory[key];
                    let temp_all_wood = true;
                    for (const item_name of Object.keys(inventory)) {
                        if (!wood_stuff.includes(item_name)) {
                            temp_all_wood = false;
                            break;
                        }
                    }
                    if (temp_all_wood) {
                        all_wood = true;
                        break;
                    }
                }
                if (all_wood) {
                    continue;
                }

                // if (remaining_items.length === 1) {
                //     const count = requirements[remaining_items[0]];
                //     if (count > 1) {
                //         initialInventory["0"][remaining_items[0]] = Math.floor(count / 2) + 1;
                //         initialInventory["1"][remaining_items[0]] = Math.floor(count / 2);
                //     } else {
                //         initialInventory["1"][remaining_items[0]] = 1;
                //     }
                // } else if (remaining_items.length > 1) {
                //     for (let k = 0; k < remaining_items.length; k++) {
                //         if (k % 2 === 0) {
                //             initialInventory["0"][remaining_items[k]] = requirements[remaining_items[k]];
                //         } else {
                //             initialInventory["1"][remaining_items[k]] = requirements[remaining_items[k]];
                //         }
                //     }
                // }
                const includesMisingItems = missing_items.length > 0;
                let timeout = mc.calculateTimeout(depth, i, includesMisingItems);
                // TODO: create task for each 
                

                const names = ["partial_plan", "no_plan", "full_plan"];
                const blocked_actions_options = [
                    {
                        "0": ["!getCraftingPlan"],
                        "1": []
                    },
                    {
                        "0": ["!getCraftingPlan"],
                        "1": ["!getCraftingPlan"]
                    },
                    {
                        "0": [],
                        "1": []
                    }
                ]
                for (let j = 0; j < names.length; j++) {
                    let name = names[j];
                    let missing_items_str = "";
                    if (missing_items.length > 0) {
                        missing_items_str = "missing_" + missing_items.join("_");
                    }
                    let task_name = `multiagent_crafting_${item.name}_${name}_${missing_items_str}_depth_${i}`;
                    
                    tasks[task_name] = {
                        goal: `Collaborate with other agents to craft an ${item.name}`,
                        conversation: `Let's work together to craft an ${item.name}.`,
                        initial_inventory: initialInventory,
                        agent_count: 2,
                        target: item.name,
                        target: item.name, 
                        number_of_target: 1,
                        type: "techtree", 
                        max_depth: depth,
                        depth: i, 
                        timeout: timeout,
                        blocked_actions: blocked_actions_options[j],
                        missing_items: missing_items
                    }
                }
            }
        }
    }
    return tasks;
}

function getCombinations(arr) {
    const missing = [];
    const total = Math.pow(2, arr.length);

    for (let i = 1; i < total; i++) {
        const comb = [];
        const not_comb = [];
        for (let j = 0; j < arr.length; j++) {
            if (i & (1 << j)) {
                comb.push(arr[j]);
            }
        }
        missing.push(comb);
    }
    return missing
}

// console.log(plans);

// function extractCraftingStep(inputString) {
//     const craftingStepsRegex = /Craft\s*(\d+)\s*([a-zA-Z_]+)\s*->\s*(\d+)\s*([a-zA-Z_]+)/g;
//     let craftingSteps = {};
//     let craftingStepsMatch = craftingStepsRegex.exec(inputString);
//     if (craftingStepsMatch === null) {
//         return null;
//     }
//     return { 
//         inputQuantity: parseInt(craftingStepsMatch[1]),
//         inputItem: craftingStepsMatch[2],
//         outputQuantity: parseInt(craftingStepsMatch[3]),
//         outputItem: craftingStepsMatch[4],
//       };
// }

// function getPlans(items) {
//     const plans = [];
//     for (const item of items) {
//         const plan = mc.craftItem(item.name, 1, {}, {});
//         if (plan.steps.length > 0) {
//             console.log(plan.steps);
//             const craftingSteps = [];
//             for (const step of plan.steps) {
//                 console.log(extractCraftingStep(step));
//                 console.log(step);
//                 craftingSteps.push(extractCraftingStep(step));
//             }
//             plans.push({
//                 required: plan.required,
//                 steps: craftingSteps
//             });
//         }
//     }
//     return plans;
// }


  
//   const inputString =
//     'You are missing the following items:\n' +
//     '- 36 copper_ingot\n' +
//     '\n' +
//     "Once you have these items, here's your crafting plan:\n" +
//     '\n' +
//     'Craft 36 copper_ingot -> 4 copper_block\n' +
//     'Craft 4 copper_block -> 4 cut_copper';
  
//   const craftingInfo = extractCraftingInfo(inputString);
  
//   console.log("Missing Items:", craftingInfo.missingItems);
//   console.log("Crafting Steps:", craftingInfo.craftingSteps);



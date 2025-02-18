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

function trainTestSplit(craftableItems, threshold) {
    /**
     * Splits the possible craftable items into train and test sets based on the number of steps in common between their crafting plans.    
     * @param {Array} craftableItems - An array of craftable items.
     * @param {number} threshold - The threshold for the number of steps in common.
     */
    const plans = craftableItems.map(item => mc.craftItem(item.name, 1, {}, {}));
    let commonSteps = [];
    for (let i = 0; i < craftableItems.length; i++) {
        let sublist = []
        for (let j = 0; j < craftableItems.length; j++) {
            let steps = stepsInCommon(plans[i], plans[j]);
            if (i === j) {
                steps = 0;
            }
            sublist.push({
                item0: craftableItems[i].name,
                item1: craftableItems[j].name,
                commonSteps: steps
            });
        }
        commonSteps.push(sublist);
    }

    const train = [craftableItems[0]];
    const test = [craftableItems[1]];

    const trainCommonSteps = commonSteps[0];
    const testCommonSteps = commonSteps[1];

    for (let i = 2; i < craftableItems.length; i++) {
        if (test.length <= train.length) { 
            let item_name = craftableItems[i].name;
            const i_column = testCommonSteps.filter(item => item.item0 === item_name || item.item1 === item_name);
            const i_steps = i_column.map(item => item.commonSteps);
            const maxSteps = Math.max(i_steps);
            if (maxSteps >= threshold) {
                train.push(craftableItems[i]);
                trainCommonSteps.push(commonSteps[i])
            } else {
                test.push(craftableItems[i]);
                testCommonSteps.push(commonSteps[i])
            }
            
        } else {
            let item_name = craftableItems[i].name;
            const i_column = trainCommonSteps.filter(item => item.item0 === item_name || item.item1 === item_name);
            const i_steps = i_column.map(item => item.commonSteps);
            const maxSteps = Math.max(i_steps);
            if (maxSteps >= threshold) {
                test.push(craftableItems[i]);
                testCommonSteps.push(commonSteps[i])
            } else {
                train.push(craftableItems[i]);
                trainCommonSteps.push(commonSteps[i])
            }
        }
    }
    return {
        "train": train, 
        "test": test};
}

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

const obj = trainTestSplit(interestingCraftableItems, 1);
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
console.log("Number of test tasks: ", Object.keys(test_tasks).length);

const train_save_path = "./train_tasks.json";
const dev_save_path = "./dev_tasks.json";
const test_save_path = "./test_tasks.json";

fs.writeFileSync(train_save_path, JSON.stringify(train_tasks, null, 2));
fs.writeFileSync(dev_save_path, JSON.stringify(dev_tasks, null, 2));
fs.writeFileSync(test_save_path, JSON.stringify(test_tasks, null, 2));


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
                for (const missing_item of missing_items) {
                    // TODO: update this craftable check to include all items that can be crafted from attainable items
                    if (!mc.isAchievableItem(missing_item)) {
                        unattainable = true;
                        break;
                    } else {
                        if (Object.keys(mc.toolsForItem).includes(missing_item)) {
                            // give either agent randomly the required tool
                            const tool = mc.toolsForItem[missing_item];
                            const randomInt = Math.floor(Math.random() * 10);
                            if (randomInt % 2 === 0) {
                                initialInventory["0"][tool] = 1;
                            } else {
                                initialInventory["1"][tool] = 1;
                            }
                        }
                    }
                }
                if (unattainable) {
                    continue;
                }
                if (remaining_items.length === 1) {
                    const count = requirements[remaining_items[0]];
                    if (count > 1) {
                        initialInventory["0"][remaining_items[0]] = Math.floor(count / 2) + 1;
                        initialInventory["1"][remaining_items[0]] = Math.floor(count / 2);
                    } else {
                        initialInventory["1"][remaining_items[0]] = 1;
                    }
                } else if (remaining_items.length > 1) {
                    for (let k = 0; k < remaining_items.length; k++) {
                        if (k % 2 === 0) {
                            initialInventory["0"][remaining_items[k]] = requirements[remaining_items[k]];
                        } else {
                            initialInventory["1"][remaining_items[k]] = requirements[remaining_items[k]];
                        }
                    }
                }
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
                        blocked_actions: blocked_actions_options[i],
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



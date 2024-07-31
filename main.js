var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { AndCondition, Condition, OrCondition } from './condition.js';
import { Simulation } from './simulation.js';
import { YamlManager } from './yaml-manager.js';
import { GameState } from './game-state.js';
let infoOutput;
const yamlManager = YamlManager.getInstance();
function writeInfo(message) {
    infoOutput.value += message + '\n';
    infoOutput.scrollTop = infoOutput.scrollHeight; // Auto-scroll to bottom
}
function clearInfo() {
    infoOutput.value = '';
}
function simulateDraw(deck, conditions, handSize, trials) {
    return __awaiter(this, void 0, void 0, function* () {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');
        let simulations = Array(conditions.length).fill([]).map(() => []);
        for (let i = 0; i < trials; i++) {
            conditions.forEach((condition, index) => {
                const simulation = new Simulation(new GameState(deck, handSize), condition);
                simulations[index].push(simulation);
                simulation.iterate();
            });
            if (i % 100 === 0 || i === trials - 1) {
                const progress = ((i + 1) / trials) * 100;
                progressBar.style.width = `${progress}%`;
                progressText.textContent = `${Math.round(progress)}% (${i + 1}/${trials} trials)`;
                // Yield to the event loop to keep UI responsive
                yield new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        // Calculate success rates
        const successRates = simulations.map(simulationSet => simulationSet.filter(sim => sim.result).length / trials);
        // Write detailed results
        writeInfo("\nDetailed Condition Results:");
        conditions.forEach((condition, index) => {
            writeDetailedResults(condition, trials, 0);
        });
        return successRates;
    });
}
function writeDetailedResults(condition, trials, depth) {
    const indent = "  ".repeat(depth);
    const successRate = (condition.successes / trials * 100).toFixed(2);
    if (condition instanceof Condition) {
        writeInfo(`${indent}${describeCondition(condition)}:`);
        writeInfo(`${indent}  Success rate: ${successRate}% (${condition.successes} out of ${trials})`);
    }
    else if (condition instanceof AndCondition) {
        writeInfo(`${indent}AND Condition:`);
        writeInfo(`${indent}  Overall success rate: ${successRate}% (${condition.successes} out of ${trials})`);
        condition.conditions.forEach(subCondition => writeDetailedResults(subCondition, trials, depth + 1));
    }
    else if (condition instanceof OrCondition) {
        writeInfo(`${indent}OR Condition:`);
        writeInfo(`${indent}  Overall success rate: ${successRate}% (${condition.successes} out of ${trials})`);
        condition.conditions.forEach(subCondition => writeDetailedResults(subCondition, trials, depth + 1));
    }
}
function describeCondition(condition) {
    let quantityText = condition.quantity === 1 ? "" : `${condition.quantity}${condition.operator} `;
    return `${quantityText}${condition.cardName}`;
}
function runSimulation(input) {
    return __awaiter(this, void 0, void 0, function* () {
        const deck = input.deck;
        const conditions = input.conditions;
        clearInfo(); // Clear previous info
        console.log('Starting simulation...');
        console.log(`Deck size: ${deck.deckCount}`);
        console.log(`Cards in deck: ${deck.deckList.map(card => card.name).join(', ')}`);
        const probabilities = yield simulateDraw(deck, conditions, 5, 10000);
        const resultElement = document.getElementById('result');
        // Find maximum probability
        const maxProbability = Math.max(...probabilities);
        resultElement.textContent = `Maximum probability of success: ${(maxProbability * 100).toFixed(2)}%`;
        // Display individual probabilities
        writeInfo("\nIndividual Condition Probabilities:");
        conditions.forEach((condition, index) => {
            writeInfo(`Condition ${index + 1}: ${(probabilities[index] * 100).toFixed(2)}%`);
        });
        console.log(`Simulation complete. Maximum success probability: ${(maxProbability * 100).toFixed(2)}%`);
    });
}
function readFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => { var _a; return resolve((_a = event.target) === null || _a === void 0 ? void 0 : _a.result); };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
}
let isSimulationRunning = false;
document.addEventListener('DOMContentLoaded', () => {
    const ydkFileInput = document.getElementById('ydkFile');
    const importYdkButton = document.getElementById('importYdk');
    const yamlFileInput = document.getElementById('yamlFile');
    const runButton = document.getElementById('runSimulation');
    const resultElement = document.getElementById('result');
    infoOutput = document.getElementById('infoOutput');
    importYdkButton.addEventListener('click', () => {
        ydkFileInput.click();
    });
    ydkFileInput.addEventListener('change', (event) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const file = (_a = event.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file) {
            writeInfo('No file selected.');
            return;
        }
        try {
            writeInfo('Converting YDK to YAML...');
            const yamlContent = yield yamlManager.convertYdkToYaml(file);
            clearInfo();
            writeInfo('YDK file imported and converted to YAML:');
            writeInfo(yamlContent);
        }
        catch (error) {
            console.error('Error importing YDK file:', error);
            writeInfo(`Error importing YDK file: ${error.message}`);
        }
    }));
    runButton.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const file = (_a = yamlFileInput.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file) {
            resultElement.textContent = 'Please select a YAML file.';
            return;
        }
        if (isSimulationRunning) {
            writeInfo('A simulation is already running. Please wait for it to complete.');
            return;
        }
        // Show progress bar and spinner
        const progressBarContainer = document.getElementById('progressBarContainer');
        const spinner = document.getElementById('spinner');
        const progressBar = document.getElementById('progressBar');
        progressBarContainer.style.display = 'block';
        spinner.style.display = 'block';
        // Disable run button
        runButton.disabled = true;
        progressBar.style.width = `0%`;
        isSimulationRunning = true;
        try {
            const input = yield yamlManager.loadFromYamlFile(file);
            yield runSimulation(input);
        }
        catch (error) {
            console.error('Error running simulation:', error);
            resultElement.textContent = 'Error running simulation. Please check the console for details.';
            writeInfo(`Error: ${error.message}`);
        }
        finally {
            // Hide progress bar and spinner
            progressBarContainer.style.display = 'none';
            spinner.style.display = 'none';
            // Re-enable run button
            runButton.disabled = false;
            isSimulationRunning = false;
        }
    }));
});

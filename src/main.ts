import { Deck } from './deck';
import { AndCondition, BaseCondition, Condition, OrCondition } from './condition';
import { Simulation } from './simulation';
import { YamlManager } from './yaml-manager';
import { GameState } from './game-state';

let infoOutput: HTMLTextAreaElement;
const yamlManager = YamlManager.getInstance();

function writeInfo(message: string): void {
    infoOutput.value += message + '\n';
    infoOutput.scrollTop = infoOutput.scrollHeight; // Auto-scroll to bottom
}

function clearInfo(): void {
    infoOutput.value = '';
}

interface SimulationInput {
    deck: Deck;
    conditions: (BaseCondition)[];
}

async function simulateDraw(deck: Deck, conditions: (BaseCondition)[], handSize: number, trials: number): Promise<number[]> {
    const progressBar = document.getElementById('progressBar') as HTMLElement;
    const progressText = document.getElementById('progressText') as HTMLElement;
    const simulations: Simulation[][] = Array(conditions.length).fill([]).map(() => []);

    for (let i = 0; i < trials; i++) {
        conditions.forEach((condition, index) => {
            const simulation = new Simulation(new GameState(deck), condition);
            simulation.gameState.drawHand(handSize);
            simulations[index].push(simulation);
            simulation.iterate();
        });
        
        if (i % 100 === 0 || i === trials - 1) {
            const progress = ((i + 1) / trials) * 100;
            progressBar.style.width = `${progress}%`;
            progressText.textContent = `${Math.round(progress)}% (${i + 1}/${trials} trials)`;
            
            // Yield to the event loop to keep UI responsive
            await new Promise(resolve => setTimeout(resolve, 0));
        }
    }

    // Calculate success rates
    const successRates = simulations.map(simulationSet => 
        simulationSet.filter(sim => sim.result).length / trials
    );

    // Write detailed results
    writeInfo("\nDetailed Condition Results:");
    conditions.forEach((condition, index) => {
        writeDetailedResults(condition, trials, 0);
    });

    return successRates;
}

function writeDetailedResults(condition: BaseCondition, trials: number, depth: number): void {
    const indent = "  ".repeat(depth);
    const successRate = (condition.successes / trials * 100).toFixed(2);

    if (condition instanceof Condition) {
        writeInfo(`${indent}${describeCondition(condition)}:`);
        writeInfo(`${indent}  Success rate: ${successRate}% (${condition.successes} out of ${trials})`);
    } else if (condition instanceof AndCondition) {
        writeInfo(`${indent}AND Condition:`);
        writeInfo(`${indent}  Overall success rate: ${successRate}% (${condition.successes} out of ${trials})`);
        condition.conditions.forEach(subCondition => writeDetailedResults(subCondition, trials, depth + 1));
    } else if (condition instanceof OrCondition) {
        writeInfo(`${indent}OR Condition:`);
        writeInfo(`${indent}  Overall success rate: ${successRate}% (${condition.successes} out of ${trials})`);
        condition.conditions.forEach(subCondition => writeDetailedResults(subCondition, trials, depth + 1));
    }
}

function describeCondition(condition: Condition): string {
    const quantityText = condition.quantity === 1 ? "" : `${condition.quantity}${condition.operator} `;
    return `${quantityText}${condition.cardName}`;
}

async function runSimulation(input: SimulationInput): Promise<void> {
    const deck = input.deck;
    const conditions = input.conditions;
    clearInfo(); // Clear previous info
    console.log('Starting simulation...');
    console.log(`Deck size: ${deck.deckCount}`);
    console.log(`Cards in deck: ${deck.deckList.map(card => card.name).join(', ')}`);
    
    const probabilities = await simulateDraw(deck, conditions, 5, 10000);
    
    const resultElement = document.getElementById('result') as HTMLElement;
    
    // Find maximum probability
    const maxProbability = Math.max(...probabilities);
    
    resultElement.textContent = `Maximum probability of success: ${(maxProbability * 100).toFixed(2)}%`;
    
    // Display individual probabilities
    writeInfo("\nIndividual Condition Probabilities:");
    conditions.forEach((condition, index) => {
        writeInfo(`Condition ${index + 1}: ${(probabilities[index] * 100).toFixed(2)}%`);
    });
    
    console.log(`Simulation complete. Maximum success probability: ${(maxProbability * 100).toFixed(2)}%`);
}

function readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
}

let isSimulationRunning = false;

document.addEventListener('DOMContentLoaded', () => {
    const ydkFileInput = document.getElementById('ydkFile') as HTMLInputElement;
    const importYdkButton = document.getElementById('importYdk') as HTMLButtonElement;
    const yamlFileInput = document.getElementById('yamlFile') as HTMLInputElement;
    const runButton = document.getElementById('runSimulation') as HTMLButtonElement;
    const resultElement = document.getElementById('result') as HTMLElement;
    infoOutput = document.getElementById('infoOutput') as HTMLTextAreaElement;

    importYdkButton.addEventListener('click', () => {
        ydkFileInput.click();
    });

    ydkFileInput.addEventListener('change', async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
            writeInfo('No file selected.');
            return;
        }

        try {
            writeInfo('Converting YDK to YAML...');
            const yamlContent = await yamlManager.convertYdkToYaml(file);
            
            clearInfo();
            writeInfo('YDK file imported and converted to YAML:');
            writeInfo(yamlContent);
        } catch (error) {
            console.error('Error importing YDK file:', error);
            writeInfo(`Error importing YDK file: ${(error as Error).message}`);
        }

    });
    runButton.addEventListener('click', async () => {
        const file = yamlFileInput.files?.[0];
        if (!file) {
            resultElement.textContent = 'Please select a YAML file.';
            return; 
        }

        if (isSimulationRunning) {
            writeInfo('A simulation is already running. Please wait for it to complete.');
            return;
        }

        // Show progress bar and spinner
        const progressBarContainer = document.getElementById('progressBarContainer') as HTMLElement;
        const spinner = document.getElementById('spinner') as HTMLElement;
        const progressBar = document.getElementById('progressBar') as HTMLElement;
        progressBarContainer.style.display = 'block';
        spinner.style.display = 'block';
        // Disable run button
        runButton.disabled = true;
        progressBar.style.width = `0%`;
        isSimulationRunning = true;

        try {
            const input = await yamlManager.loadFromYamlFile(file);
            await runSimulation(input);
        } catch (error) {
            console.error('Error running simulation:', error);
            resultElement.textContent = 'Error running simulation. Please check the console for details.';
            writeInfo(`Error: ${(error as Error).message}`);
        } finally {
            // Hide progress bar and spinner
            progressBarContainer.style.display = 'none';
            spinner.style.display = 'none';
            // Re-enable run button
            runButton.disabled = false;
            isSimulationRunning = false;
        }
    });
});
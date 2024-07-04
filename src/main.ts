import './simulation';
import './card';
import './deck';
import './condition';
import './parser';
import yaml from 'js-yaml';

let infoOutput: HTMLTextAreaElement;

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

async function loadFromYamlFile(file: File): Promise<SimulationInput> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
            try {
                const yamlText = event.target?.result as string;
                const input = yaml.load(yamlText) as { deck: Record<string, CardDetails>, conditions: string[] };
                const deck = buildDeck(input.deck);
                const conditions = input.conditions.map(parseCondition);
                resolve({ deck, conditions });
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
}

async function simulateDraw(deck: Deck, conditions: (BaseCondition)[], handSize: number, trials: number): Promise<number[]> {
    const progressBar = document.getElementById('progressBar') as HTMLElement;
    const progressText = document.getElementById('progressText') as HTMLElement;
    let simulations: Simulation[][] = Array(conditions.length).fill([]).map(() => []);

    for (let i = 0; i < trials; i++) {
        deck.reset();
        const hand = deck.draw(handSize);

        conditions.forEach((condition, index) => {
            const simulation = new Simulation(deck, hand, condition);
            simulations[index].push(simulation);
            simulation.run();
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

    evaluateDeadCards(simulations);

    return successRates;
}

function evaluateDeadCards(simulations: Simulation[][]): void {
    let totalBanishedCards: Card[] = [];
    let totalGraveCards: Card[] = [];

    simulations.forEach(simulationSet => {
        simulationSet.forEach(simulation => {
            totalBanishedCards.push(...simulation.deck.banishedCards);
            totalGraveCards.push(...simulation.deck.graveCards);
        });
    });

    function countTags(cards: Card[]): Record<string, number> {
        const tagCounts: Record<string, number> = {};
        cards.forEach(card => {
            if (card.tags) {
                card.tags.forEach(tag => {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                });
            }
        });
        return tagCounts;
    }

    const banishedTags = countTags(totalBanishedCards);
    const graveTags = countTags(totalGraveCards);

    const totalBanished = totalBanishedCards.length;
    const totalGrave = totalGraveCards.length;
    const totalSimulations = simulations.reduce((sum, simulationSet) => sum + simulationSet.length, 0);

    writeInfo("\nDead Cards Analysis:");
    writeInfo("Banished Cards Tags:");
    for (const [tag, count] of Object.entries(banishedTags)) {
        writeInfo(`  ${tag}: ${count/totalSimulations} p/h`);
    }

    writeInfo("\nGrave Cards Tags:");
    for (const [tag, count] of Object.entries(graveTags)) {
        writeInfo(`  ${tag}: ${count/totalSimulations} p/h`);
    }

    writeInfo(`\nTotal Banished Cards: ${totalBanished}`);
    writeInfo(`Total Grave Cards: ${totalGrave}`);
    writeInfo(`Total Dead Cards: ${totalBanished + totalGrave}`);
    writeInfo(`Average Banished Cards per Simulation: ${(totalBanished / totalSimulations).toFixed(2)}`);
    writeInfo(`Average Grave Cards per Simulation: ${(totalGrave / totalSimulations).toFixed(2)}`);
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
    let quantityText = condition.quantity === 1 ? "" : `${condition.quantity}${condition.operator} `;
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

let isSimulationRunning = false;

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('yamlFile') as HTMLInputElement;
    const runButton = document.getElementById('runSimulation') as HTMLButtonElement;
    const resultElement = document.getElementById('result') as HTMLElement;
    infoOutput = document.getElementById('infoOutput') as HTMLTextAreaElement;

    runButton.addEventListener('click', async () => {
        const file = fileInput.files?.[0];
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
            const input = await loadFromYamlFile(file);
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
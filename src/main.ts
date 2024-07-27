import { Deck } from './deck';
import { BaseCondition } from './condition';
import { Simulation } from './simulation';
import { YamlManager } from './yaml-manager';
import { GameState } from './game-state';
import { Report } from './report';

const yamlManager = YamlManager.getInstance();

interface SimulationInput {
    deck: Deck;
    conditions: (BaseCondition)[];
}

async function simulateDraw(deck: Deck, conditions: (BaseCondition)[], handSize: number, trials: number): Promise<Report[]> {
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

    return simulations.map(simulationSet => new Report(simulationSet));
}

async function runSimulation(input: SimulationInput): Promise<void> {
    const deck = input.deck;
    const conditions = input.conditions;
    console.log('Starting simulation...');
    console.log(`Deck size: ${deck.deckCount}`);
    console.log(`Cards in deck: ${deck.deckList.map(card => card.name).join(', ')}`);
    
    const reports = await simulateDraw(deck, conditions, 5, 10000);
    
    const resultElement = document.getElementById('result') as HTMLElement;
    
    // Find maximum probability
    const maxProbability = Math.max(...reports.map(report => report.successRate));
    
    resultElement.textContent = `Maximum probability of success: ${(maxProbability * 100).toFixed(2)}%`;
    
    // Display report data
    displayReportData(reports);
    
    console.log(`Simulation complete. Maximum success probability: ${(maxProbability * 100).toFixed(2)}%`);
}

function updateReportVisibility() {
    const reportContainer = document.getElementById('reportContainer') as HTMLElement;
    const toggleReportButton = document.getElementById('toggleReport') as HTMLButtonElement;
    
    reportContainer.style.display = isReportVisible ? 'block' : 'none';
    toggleReportButton.textContent = isReportVisible ? 'Hide Report' : 'Show Report';
}

function displayReportData(reports: Report[]): void {
    const reportContainer = document.getElementById('reportContainer') as HTMLElement;
    reportContainer.innerHTML = ''; // Clear previous content

    reports.forEach((report, index) => {
        const reportDiv = document.createElement('div');
        reportDiv.innerHTML = `
            <h3>Condition ${index + 1}</h3>
            <p>Success Rate: ${report.successRatePercentage}</p>
            <h4>Card Statistics:</h4>
            <ul>
                ${Array.from(report.cardNameStats).map(([name, stats]) => `
                    <li>${name}: ${stats.averageCount.toFixed(2)} (${(stats.totalOccurrences / report.iterations * 100).toFixed(2)}%)</li>
                `).join('')}
            </ul>
            <h4>Free Card Statistics:</h4>
            <ul>
                ${Array.from(report.freeCardStats).map(([name, stats]) => `
                    <li>${name}: Activation Rate: ${(stats.activationRate * 100).toFixed(2)}%, Failed to Success Rate: ${(stats.failedToSuccessRate * 100).toFixed(2)}%</li>
                `).join('')}
            </ul>
            <h4>Condition Statistics:</h4>
            <ul>
                ${Array.from(report.conditionStats).map(([key, stats]) => `
                    <li>${key}: Success Rate: ${(stats.successRate * 100).toFixed(2)}%</li>
                `).join('')}
            </ul>
        `;
        reportContainer.appendChild(reportDiv);
    });

    // Ensure visibility is correct after populating data
    updateReportVisibility();
}

let isSimulationRunning = false;
let isReportVisible = false;

document.addEventListener('DOMContentLoaded', () => {
    const ydkFileInput = document.getElementById('ydkFile') as HTMLInputElement;
    const importYdkButton = document.getElementById('importYdk') as HTMLButtonElement;
    const yamlFileInput = document.getElementById('yamlFile') as HTMLInputElement;
    const runButton = document.getElementById('runSimulation') as HTMLButtonElement;
    const resultElement = document.getElementById('result') as HTMLElement;
    const toggleReportButton = document.getElementById('toggleReport') as HTMLButtonElement;
    const reportContainer = document.getElementById('reportContainer') as HTMLElement;

    toggleReportButton.addEventListener('click', () => {
        isReportVisible = !isReportVisible;
        updateReportVisibility();
    });

    // Initially hide the report container and set button text
    isReportVisible = false;
    updateReportVisibility();

    importYdkButton.addEventListener('click', () => {
        ydkFileInput.click();
    });

    ydkFileInput.addEventListener('change', async (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
            alert('No file selected.');
            return;
        }

        try {
            const yamlContent = await yamlManager.convertYdkToYaml(file);
            alert('YDK file imported and converted to YAML successfully.');
            console.log(yamlContent); // You can decide how to use this YAML content
        } catch (error) {
            console.error('Error importing YDK file:', error);
            alert(`Error importing YDK file: ${(error as Error).message}`);
        }
    });

    runButton.addEventListener('click', async () => {
        const file = yamlFileInput.files?.[0];
        if (!file) {
            resultElement.textContent = 'Please select a YAML file.';
            return; 
        }

        if (isSimulationRunning) {
            alert('A simulation is already running. Please wait for it to complete.');
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
            alert(`Error: ${(error as Error).message}`);
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
let infoOutput;

function writeInfo(message) {
    infoOutput.value += message + '\n';
}

function clearInfo() {
    infoOutput.value = '';
}

function loadDeckFromYamlFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const yamlText = event.target.result;
                const deckInput = jsyaml.load(yamlText);
                const deck = buildDeck(deckInput);
                resolve(deck);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
}

function simulateDraw(deck, hand_size, iterations)
{
    for (let i = 0; i < iterations; i++) {
        deck.reset()
        hand = deck.draw(hand_size)
        writeInfo(`Trial ${i + 1}: ${hand.map(card => card.name).join(', ')}`);
    }
}

function runSimulation(deck) {
    clearInfo(); // Clear previous info
    console.log('Starting simulation...');
    console.log(`Deck size: ${deck.deckCount}`);
    console.log(`Cards in deck: ${deck.deckList.map(card => card.name).join(', ')}`);
    
    const probability = simulateDraw(deck, 5, 5);
    const resultElement = document.getElementById('result');
    resultElement.textContent = `Probability of success: ${(probability * 100).toFixed(2)}%`;
    
    console.log(`Simulation complete. Success probability: ${(probability * 100).toFixed(2)}%`);
}

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('yamlFile');
    const runButton = document.getElementById('runSimulation');
    const resultElement = document.getElementById('result');
    infoOutput = document.getElementById('infoOutput');

    runButton.addEventListener('click', async () => {
        const file = fileInput.files[0];
        if (!file) {
            resultElement.textContent = 'Please select a YAML file.';
            return;
        }

        try {
            const deck = await loadDeckFromYamlFile(file);
            runSimulation(deck);
        } catch (error) {
            console.error('Error loading deck:', error);
            resultElement.textContent = 'Error loading deck. Please check your YAML file.';
            writeInfo(`Error: ${error.message}`);
        }
    });
});
let autoCompleteTimeout;

// Function to fetch card data
async function fetchCardData(cardName) {
    try {
        const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(cardName)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error:', error);
        return null;
    }
}

// Function to fetch autocomplete suggestions
async function fetchAutoCompleteSuggestions(searchTerm) {
    if (searchTerm.length < 2) return []; // Don't search for very short terms
    
    try {
        const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data.data.slice(0, 5).map(card => card.name); // Return top 5 suggestions
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

async function displayCardData(cardData) {
    const resultDiv = document.getElementById('result');
    if (cardData && cardData.data && cardData.data.length > 0) {
        const card = cardData.data[0];
        let imageUrl = card.card_images[0].image_url;
        
        resultDiv.innerHTML = `
            <h2>${card.name}</h2>
            <p>Type: ${card.type}</p>
            <p>Description: ${card.desc}</p>
            <p id="loadingText">Loading image...</p>
            <img id="cardImage" src="" alt="${card.name}" style="display:none;">
        `;

        try {
            let imageResponse = await getCachedImage(imageUrl);
            if (!imageResponse) {
                imageResponse = await cacheImage(imageUrl);
            }

            const imageBlob = await imageResponse.blob();
            const imageBlobUrl = URL.createObjectURL(imageBlob);
            
            const imgElement = document.getElementById('cardImage');
            imgElement.src = imageBlobUrl;
            imgElement.style.display = 'block';
            document.getElementById('loadingText').style.display = 'none';
        } catch (error) {
            console.error('Error loading image:', error);
            document.getElementById('loadingText').textContent = 'Error loading image.';
        }
    } else {
        resultDiv.innerHTML = '<p>No card data found.</p>';
    }
}

function getCachedImage(imageUrl) {
    const cachedImage = localStorage.getItem(imageUrl);
    if (cachedImage) {
        return cachedImage;
    }
    return null;
}

function cacheImage(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";  // This is needed to avoid CORS issues
        img.onload = function() {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL("image/jpeg");
            try {
                localStorage.setItem(imageUrl, dataURL);
                resolve(dataURL);
            } catch (e) {
                console.error("Error caching image:", e);
                resolve(imageUrl);  // If caching fails, we'll just use the original URL
            }
        };
        img.onerror = function() {
            reject("Could not load image");
        };
        img.src = imageUrl;
    });
}

// Function to display autocomplete suggestions
function displayAutoCompleteSuggestions(suggestions) {
    const suggestionsDiv = document.getElementById('suggestions');
    suggestionsDiv.innerHTML = '';
    suggestions.forEach(suggestion => {
        const div = document.createElement('div');
        div.textContent = suggestion;
        div.addEventListener('click', () => {
            document.getElementById('cardName').value = suggestion;
            suggestionsDiv.innerHTML = '';
            fetchAndDisplayCardData(suggestion);
        });
        suggestionsDiv.appendChild(div);
    });
}

// Function to handle input changes for autocomplete
function handleAutoComplete() {
    const searchTerm = document.getElementById('cardName').value;
    clearTimeout(autoCompleteTimeout);
    autoCompleteTimeout = setTimeout(async () => {
        const suggestions = await fetchAutoCompleteSuggestions(searchTerm);
        displayAutoCompleteSuggestions(suggestions);
    }, 300); // Debounce for 300ms
}

// Function to fetch and display card data
async function fetchAndDisplayCardData(cardName) {
    const cardData = await fetchCardData(cardName);
    displayCardData(cardData);
}

// Event listener for input changes
document.getElementById('cardName').addEventListener('input', handleAutoComplete);

// Event listener for form submission
document.getElementById('searchForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const cardName = document.getElementById('cardName').value;
    fetchAndDisplayCardData(cardName);
});
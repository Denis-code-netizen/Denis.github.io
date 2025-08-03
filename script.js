const API_KEY = "okK1hNzwRHtMl5iNMaAk9Hz1ysmvgi7fJifQZODSvxA";
const searchForm = document.getElementById("search-form");
const searchResult = document.getElementById("result");

let currentPage = 1;
let currentQuery = "";
let isLoading = false;
let sentinelObserver;

const setupListeners = () => {
    searchForm.addEventListener("submit", onSearchFormSubmit);
};

const onSearchFormSubmit = (e) => {
    e.preventDefault();
    
    const query = searchForm.query.value.trim();
    
    if (!query) {
        alert("Please provide a valid search term");
        return;
    }
    
    currentPage = 1;
    currentQuery = query;
    searchResult.innerHTML = "";
    removeObserver();
    
    const apiURL = buildApiUrl(query, currentPage);
    
    showLoading();
    isLoading = true;
    fetchImages(apiURL)
        .then((data) => {
            displayResults(data);
            if (data.total_pages > currentPage) {
                createObserver();
            }
        })
        .finally(() => {
            hideLoading();
            isLoading = false;
        });
};

const displayResults = (data) => {
    if (data.total === 0) {
        searchResult.innerHTML = `<div class="no-result">No images found.</div>`;
        return;
    }
    
    const fragment = document.createDocumentFragment();
    
    data.results.forEach((photo) => {
        const item = document.createElement("div");
        item.className = "grid-item";
        item.innerHTML = `
            <a href="${photo.links.html}" target="_blank">
                <img src="${photo.urls.regular}" alt="${photo.alt_description || 'Unsplash photo'}" loading="lazy">
                <div class="image-content">
                    <h3 class="photographer">${photo.user.name}</h3>
                </div>
            </a>
        `;
        fragment.appendChild(item);
    });
    
    searchResult.appendChild(fragment);
};

const showLoading = () => {
    if (!document.querySelector(".loader")) {
        const div = document.createElement("div");
        div.classList.add("loader");
        document.body.prepend(div);
    }
};

const hideLoading = () => {
    const loader = document.querySelector(".loader");
    loader?.remove();
};

const createObserver = () => {
    removeObserver();
    
    const sentinel = document.createElement("div");
    sentinel.id = "sentinel";
    document.querySelector(".container").appendChild(sentinel);
    
    sentinelObserver = new IntersectionObserver(
        (entries) => {
            if (entries[0].isIntersecting && !isLoading) {
                loadMoreResults();
            }
        },
        { rootMargin: "100px" }
    );
    
    sentinelObserver.observe(sentinel);
};

const removeObserver = () => {
    const sentinel = document.getElementById("sentinel");
    sentinel?.remove();
    
    if (sentinelObserver) {
        sentinelObserver.disconnect();
        sentinelObserver = null;
    }
};

const fetchImages = async (apiURL) => {
    try {
        const response = await fetch(apiURL, {
            headers: { 
                Authorization: `Client-ID ${API_KEY}`,
                'Accept-Version': 'v1'
            },
        });
        
        if (!response.ok) {
            throw new Error(`HTTP Error! status=${response.status}`);
        } 
        
        return await response.json();
    } catch (error) {
        console.error("Fetch error", error);
        return { results: [], total: 0, total_pages: 0 };
    }
};

const loadMoreResults = () => {
    if (isLoading) return;
    
    currentPage++;
    const apiURL = buildApiUrl(currentQuery, currentPage);
    
    showLoading();
    isLoading = true;
    
    fetchImages(apiURL)
        .then((data) => {
            displayResults(data);
            if (data.total_pages <= currentPage) {
                removeObserver();
            }
        })
        .finally(() => {
            hideLoading();
            isLoading = false;
        });
};

const buildApiUrl = (query, page) => {
    return `https://api.unsplash.com/search/photos?query=${query}&orientation=landscape&page=${page}`;
};


setupListeners();

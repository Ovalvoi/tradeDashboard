document.addEventListener('DOMContentLoaded', () => {
    // Console log to confirm script start
    // console.log("DOM fully loaded and parsed - Combined Main Logic + Dark Mode");

    // --- DOM Element References ---
    const reportingCountrySelect = document.getElementById('reportingCountry');
    const partnerCountrySelect = document.getElementById('partnerCountry');
    const categorySelect = document.getElementById('tradeCategory');
    const chartCanvas = document.getElementById('tradeChart');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorDisplay = document.getElementById('errorDisplay');
    const chartTitleElement = document.getElementById('chartTitle');
    const startYearSelect = document.getElementById('startYear');
    const endYearSelect = document.getElementById('endYear');
    // Reference to the dark mode toggle switch is crucial for both functions
    const darkModeToggle = document.getElementById('darkModeToggle');

    // --- Global Variables ---
    let chartInstance = null; // Holds the Chart.js instance
    let currentChartData = null; // Stores the latest processed data for redraws

    // --- Commodity Codes Map ---
    const commodityCodes = {
        'TOTAL': 'TOTAL', 'AG2': 'AG2', '27': '27', '72': '72',
        '84': '84', '85': '85', '61': '61' // Add mappings for new options
        // Add more here...
    };

    // --- Core Functions ---

    function showLoading(isLoading) {
        loadingIndicator.style.display = isLoading ? 'block' : 'none';
    }

    function showError(message) {
        if (message) {
            errorDisplay.textContent = message;
            errorDisplay.style.display = 'block';
        } else {
            errorDisplay.style.display = 'none';
            errorDisplay.textContent = '';
        }
    }

    async function loadCountries() {
        try {
            const response = await fetch('assets/data/countries.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const countries = await response.json();
            countries.sort((a, b) => a.text.localeCompare(b.text));
            reportingCountrySelect.length = 1;
            partnerCountrySelect.length = 1;
            countries.forEach(country => {
                const option1 = new Option(country.text, country.id);
                const option2 = new Option(country.text, country.id);
                reportingCountrySelect.add(option1);
                partnerCountrySelect.add(option2);
            });

            // --- Start of code to add ---

            // Set default values after populating dropdowns
            reportingCountrySelect.value = '376'; // Israel M49 Code
            partnerCountrySelect.value = '31';  // Azerbaijan M49 Code

            // Trigger the data fetch for the default selection
            // Check if both values were successfully set before fetching
            if (reportingCountrySelect.value === '376' && partnerCountrySelect.value === '31') {
                handleSelectionChange();
            }

            // --- End of code to add ---
        } catch (error) {
            showError(`Could not load country list: ${error.message}.`);
        }
    }

    async function fetchTradeData(reporterId, partnerId, commodityCode, startYear, endYear) {
        // ^^^ Use the startYear and endYear passed from handleSelectionChange ^^^

        showLoading(true);
        showError(null);
        chartTitleElement.textContent = 'Loading trade data...';
        currentChartData = null;
        if (chartInstance) {
             try { chartInstance.destroy(); } catch(e) {}
             chartInstance = null;
        }

        // --- FIX 1: Calculate 'years' string based on PASSED startYear/endYear ---
        const yearArray = [];
        for (let yr = startYear; yr <= endYear; yr++) {
            yearArray.push(yr);
        }
        const years = yearArray.join(','); // Creates string like "2019,2020,2021"

        // --- FIX 2: Correct syntax for yearRangeString ---
        const yearRangeString = `${startYear}-${endYear}`; // Use correct template literal

        // Use your Cloud Function URL (ensure this is correct)
        const cloudFunctionUrl = 'https://europe-west1-comtrade-proxy.cloudfunctions.net/getComtradeData';

        // Construct parameters for your Cloud Function using the CORRECT years string
        const paramsForFunction = new URLSearchParams({
            reporterCode: reporterId,
            partnerCode: partnerId,
            period: years, // Use the 'years' string generated from user selection
            commodityCode: commodityCode
        });

        const apiUrl = `${cloudFunctionUrl}?${paramsForFunction.toString()}`; // This syntax should be correct now

        // --- FIX 3: Correct typo in console.log ---
        console.log(`Workspaceing from Cloud Function for ${yearRangeString}: ${apiUrl}`);

        try {
            // Fetch from your cloud function
            const response = await fetch(apiUrl, {
                method: 'GET'
            });

            console.log(`Cloud Function Response Status: ${response.status} ${response.statusText}`);

            if (!response.ok) {
                let errorMsg = `Function Error: ${response.status} ${response.statusText}`;
                try {
                    const errorText = await response.text();
                     errorMsg += ` - ${errorText}`;
                } catch (e) { /* Ignore */ }
                throw new Error(errorMsg);
            }

            const result = await response.json();
            console.log("Data received from Cloud Function:", JSON.stringify(result, null, 2));

            const dataArray = result.data || result.dataset;

            if (!dataArray || dataArray.length === 0) {
                const reporterName = reportingCountrySelect.options[reportingCountrySelect.selectedIndex].text;
                const partnerName = partnerCountrySelect.options[partnerCountrySelect.selectedIndex].text;
                const categoryName = categorySelect.options[categorySelect.selectedIndex].text;
                 // Use the correct year range string in the message
                 showError(`No trade data found via function for ${reporterName} and ${partnerName} (Category: ${categoryName}) for years ${yearRangeString}. Data might be unavailable.`);
                 chartTitleElement.textContent = 'No data available for this selection/period';
                return;
            }

            processData(dataArray);

        } catch (error) {
            console.error("Fetch Trade Data Error (via Cloud Function):", error);
            showError(`Failed to fetch trade data: ${error.message}`);
            chartTitleElement.textContent = 'Failed to load data';
        } finally {
            showLoading(false);
        }
    }

    function processData(data) {
        const processed = { labels: [], imports: {}, exports: {} };
        data.forEach(item => {
            const year = item.period.toString();
            const value = item.primaryValue;
            const flow = item.flowCode;
            if (!processed.labels.includes(year)) processed.labels.push(year);
            if (flow === 'M') processed.imports[year] = (processed.imports[year] || 0) + value;
            else if (flow === 'X') processed.exports[year] = (processed.exports[year] || 0) + value;
        });
        processed.labels.sort((a, b) => parseInt(a) - parseInt(b));
        const importData = processed.labels.map(year => processed.imports[year] || 0);
        const exportData = processed.labels.map(year => processed.exports[year] || 0);

        currentChartData = {
            labels: processed.labels,
            datasets: [
                { label: `Imports by Reporter`, data: importData, borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.5)', tension: 0.1 },
                { label: `Exports by Reporter`, data: exportData, borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.5)', tension: 0.1 }
            ]
        };
        const reporterName = reportingCountrySelect.options[reportingCountrySelect.selectedIndex].text;
        const partnerName = partnerCountrySelect.options[partnerCountrySelect.selectedIndex].text;
        const categoryName = categorySelect.options[categorySelect.selectedIndex].text;
        chartTitleElement.textContent = `Trade: ${reporterName} <=> ${partnerName} (${categoryName})`;
        updateChart(); // Render chart with new data
    }

    function getThemeColors() {
        const style = getComputedStyle(document.documentElement);
        return {
            textColor: style.getPropertyValue('--text').trim(),
            gridColor: style.getPropertyValue('--grid-color').trim()
        };
    }

    function updateChart() {
        if (!currentChartData) {
            if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
            return;
        }
        const ctx = chartCanvas.getContext('2d');
        const themeColors = getThemeColors(); // Get colors for the CURRENT theme
        if (chartInstance) chartInstance.destroy();

        const config = {
            type: 'line', data: currentChartData,
            options: {
                responsive: true, maintainAspectRatio: true,
                plugins: {
                    legend: { labels: { color: themeColors.textColor } },
                    tooltip: { bodyColor: themeColors.textColor, titleColor: themeColors.textColor }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: themeColors.textColor, callback: function (value) { /* Format */
                                if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
                                if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
                                if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
                                return value;
                            }
                        },
                        grid: { color: themeColors.gridColor },
                        title: { display: true, text: 'Trade Value (USD)', color: themeColors.textColor }
                    },
                    x: {
                        ticks: { color: themeColors.textColor },
                        grid: { color: themeColors.gridColor },
                        title: { display: true, text: 'Year', color: themeColors.textColor }
                    }
                }
            }
        };
        try {
            chartInstance = new Chart(ctx, config);
        } catch (error) { showError("Error rendering chart."); }
    }

    function handleSelectionChange() {
        const reporterId = reportingCountrySelect.value;
        const partnerId = partnerCountrySelect.value;
        const categoryCode = commodityCodes[categorySelect.value] || 'TOTAL'; // Get code from map
        const startYear = parseInt(startYearSelect.value, 10);
        const endYear = parseInt(endYearSelect.value, 10);
    
        // Validation
        if (!startYear || !endYear || startYear > endYear) {
            showError("Please select a valid year range.");
            return;
        }
        const maxYearRange = 5; // Keep max range small due to API limits/performance
        if (endYear - startYear + 1 > maxYearRange) {
             showError(`Please select a range of ${maxYearRange} years or less.`);
             return;
        }
        // Ensure all selections are made
        if (reporterId && partnerId && categorySelect.value && startYear && endYear) {
            if (reporterId === partnerId && reporterId !== '0') { /* ... same country check ... */ return; }
            showError(null);
            // Pass selected years
            fetchTradeData(reporterId, partnerId, categoryCode, startYear, endYear);
        }
    }
    // --- Dark Mode Specific Functions (Integrated) ---

    /**
     * Applies the dark/light theme by toggling the 'dark' class on the body.
     * @param {boolean} isDark - True if dark mode should be enabled.
     */
    function applyDarkMode(isDark) {
        document.body.classList.toggle("dark", isDark);
        // console.log(`Dark mode applied: ${isDark}. Body classes: ${document.body.className}`);
    }

    /**
     * Initializes the dark mode based on localStorage or system preference.
     */
    function initializeDarkMode() {
        if (!darkModeToggle) {
            // console.error("Dark mode toggle element not found!");
            return; // Exit if toggle doesn't exist
        }

        // Determine initial state
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedMode = localStorage.getItem("darkModeEnabled");
        // Use saved mode if available, otherwise use system preference
        let initialDarkMode = (savedMode !== null) ? (savedMode === "true") : prefersDark;

        // console.log(`Initial dark mode: Saved=${savedMode}, PrefersDark=${prefersDark}, Initial=${initialDarkMode}`);

        // Set the toggle's checked state
        darkModeToggle.checked = initialDarkMode;
        // Apply the initial theme class to the body
        applyDarkMode(initialDarkMode);
    }

    // --- Initialization ---

    /**
     * Initializes the application: dark mode, countries, event listeners.
     */
    function init() {
        startYearSelect.addEventListener('change', handleSelectionChange);
        endYearSelect.addEventListener('change', handleSelectionChange);
        // console.log("Initializing application...");

        // 1. Initialize Dark Mode FIRST - applies theme class before anything else
        initializeDarkMode();

        // 2. Load country data
        loadCountries();

        // 3. Set up event listeners
        reportingCountrySelect.addEventListener('change', handleSelectionChange);
        partnerCountrySelect.addEventListener('change', handleSelectionChange);
        categorySelect.addEventListener('change', handleSelectionChange);

        // Listener for the dark mode toggle (handles theme *and* chart update)
        if (darkModeToggle) {
            darkModeToggle.addEventListener('change', () => {
                const isChecked = darkModeToggle.checked;
                // Save the preference
                localStorage.setItem("darkModeEnabled", isChecked);
                // Apply the theme class to the body
                applyDarkMode(isChecked);
                // Redraw the chart with new theme colors (after a slight delay)
                setTimeout(updateChart, 50);
            });
        }

        // console.log("Application initialization complete.");
        // Initial data fetch will happen when user makes selections
    }

    // Start the application initialization process
    init();
});
document.addEventListener('DOMContentLoaded', () => {
    const reportingCountrySelect = document.getElementById('reportingCountry');
    const partnerCountrySelect = document.getElementById('partnerCountry');
    const categorySelect = document.getElementById('tradeCategory');
    const chartCanvas = document.getElementById('tradeChart');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorDisplay = document.getElementById('errorDisplay');
    const chartTitleElement = document.getElementById('chartTitle');
    const startYearSelect = document.getElementById('startYear');
    const endYearSelect = document.getElementById('endYear');
    const darkModeToggle = document.getElementById('darkModeToggle');

    let chartInstance = null;
    let currentChartData = null;

    const commodityCodes = {
        'TOTAL': 'TOTAL',
        'AG2': 'AG2',
        '25': '25', // Minerals: Salt, Stone, Cement
        '27': '27', // Minerals: Fuels, Oils
        '71': '71', // Minerals: Pearls, Gems, Diamonds
        '72': '72', // Minerals: Iron & Steel
        '28': '28', // Chemicals: Inorganic
        '39': '39', // Plastics & Articles Thereof
        '61': '61', // Clothing: Knitted Apparel
        '62': '62', // Clothing: Non-Knitted Apparel
        '84': '84', // Machinery & Mechanical Appliances
        '85': '85', // Electrical Machinery & Equipment
        '88': '88', // Aircraft, Spacecraft & Parts
        '90': '90'  // Optical, Photo, Medical Instruments
        // Add any other mappings if you add more options to HTML
    };

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

            reportingCountrySelect.value = '376';
            partnerCountrySelect.value = '31';

            if (reportingCountrySelect.value === '376' && partnerCountrySelect.value === '31') {
                handleSelectionChange();
            }
        } catch (error) {
            showError(`Could not load country list: ${error.message}.`);
        }
    }

    async function fetchTradeData(reporterId, partnerId, commodityCode, startYear, endYear) {
        showLoading(true);
        showError(null);
        chartTitleElement.textContent = 'Loading trade data...';
        currentChartData = null;
        if (chartInstance) {
             try { chartInstance.destroy(); } catch(e) {}
             chartInstance = null;
        }

        const yearArray = [];
        for (let yr = startYear; yr <= endYear; yr++) {
            yearArray.push(yr);
        }
        const years = yearArray.join(',');
        const yearRangeString = `${startYear}-${endYear}`;
        const cloudFunctionUrl = 'https://europe-west1-comtrade-proxy.cloudfunctions.net/getComtradeData';
        const paramsForFunction = new URLSearchParams({
            reporterCode: reporterId,
            partnerCode: partnerId,
            period: years,
            commodityCode: commodityCode
        });
        const apiUrl = `${cloudFunctionUrl}?${paramsForFunction.toString()}`;

        // console.log(`Workspaceing from Cloud Function for ${yearRangeString}: ${apiUrl}`); // Keep for debugging if needed

        try {
            const response = await fetch(apiUrl, { method: 'GET' });
            // console.log(`Cloud Function Response Status: ${response.status} ${response.statusText}`); // Keep for debugging

            if (!response.ok) {
                let errorMsg = `Function Error: ${response.status} ${response.statusText}`;
                try {
                    const errorText = await response.text();
                     errorMsg += ` - ${errorText}`;
                } catch (e) { /* Ignore inability to read body */ }
                throw new Error(errorMsg);
            }

            const result = await response.json();
            // console.log("Data received from Cloud Function:", JSON.stringify(result, null, 2)); // Keep for debugging

            const dataArray = result.data || result.dataset;

            if (!dataArray || dataArray.length === 0) {
                const reporterName = reportingCountrySelect.options[reportingCountrySelect.selectedIndex].text;
                const partnerName = partnerCountrySelect.options[partnerCountrySelect.selectedIndex].text;
                const categoryName = categorySelect.options[categorySelect.selectedIndex].text;
                showError(`No trade data found via function for ${reporterName} and ${partnerName} (Category: ${categoryName}) for years ${yearRangeString}. Data might be unavailable.`);
                chartTitleElement.textContent = 'No data available for this selection/period';
                updateChart(); // Ensure chart clears if no data
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
        updateChart();
    }

    function getThemeColors() {
        const isDarkMode = document.body.classList.contains('dark');
        if (isDarkMode) {
            return {
                textColor: '#ffffff', // Explicitly white for dark mode chart text
                gridColor: 'rgba(255, 255, 255, 0.15)', // Faint white grid lines
                tooltipBgColor: '#2c2c2c', // Dark background for tooltip
                tooltipBorderColor: 'rgba(255, 255, 255, 0.2)'
            };
        } else {
            const style = getComputedStyle(document.documentElement);
            return {
                textColor: style.getPropertyValue('--text-light').trim(),
                gridColor: style.getPropertyValue('--grid-color-light').trim(),
                tooltipBgColor: style.getPropertyValue('--card-bg-light').trim(),
                tooltipBorderColor: 'rgba(0, 0, 0, 0.1)'
            };
        }
    }

    function updateChart() {
        if (chartInstance) {
            try { chartInstance.destroy(); } catch(e) {}
            chartInstance = null;
        }

        if (!currentChartData || !chartCanvas) {
             // Clear canvas if no data or canvas not found
             if (chartCanvas) {
                 const ctx = chartCanvas.getContext('2d');
                 ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
             }
             // Make sure title reflects lack of data if appropriate
             if (!currentChartData && !errorDisplay.textContent.includes('No trade data found')) {
                 // chartTitleElement.textContent = 'Select options to view data'; // Or keep existing title
             }
             return;
        }

        const ctx = chartCanvas.getContext('2d');
        const themeColors = getThemeColors();

        const config = {
            type: 'line',
            data: currentChartData,
            options: {
                responsive: true,
                maintainAspectRatio: true,
                color: themeColors.textColor,
                plugins: {
                    legend: {
                        labels: {
                            color: themeColors.textColor
                        }
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: themeColors.tooltipBgColor,
                        titleColor: themeColors.textColor,
                        titleFont: { weight: 'bold' },
                        bodyColor: themeColors.textColor,
                        bodySpacing: 4,
                        padding: 10,
                        cornerRadius: 4,
                        borderColor: themeColors.tooltipBorderColor,
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: themeColors.textColor,
                            callback: function (value) {
                                if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
                                if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
                                if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
                                return value;
                            }
                        },
                        grid: {
                            color: themeColors.gridColor
                         },
                        title: {
                            display: true,
                            text: 'Trade Value (USD)',
                            color: themeColors.textColor
                        }
                    },
                    x: {
                        ticks: {
                            color: themeColors.textColor
                        },
                        grid: {
                             color: themeColors.gridColor
                        },
                        title: {
                            display: true,
                            text: 'Year',
                            color: themeColors.textColor
                        }
                    }
                }
            }
        };
        try {
            chartInstance = new Chart(ctx, config);
        } catch (error) {
            showError("Error rendering chart.");
            console.error("Chart rendering error:", error);
        }
    }

    function handleSelectionChange() {
        const reporterId = reportingCountrySelect.value;
        const partnerId = partnerCountrySelect.value;
        const categoryCode = commodityCodes[categorySelect.value] || 'TOTAL';
        const startYear = parseInt(startYearSelect.value, 10);
        const endYear = parseInt(endYearSelect.value, 10);

        if (!startYear || !endYear || startYear > endYear) {
            showError("Please select a valid year range.");
            return;
        }
        const maxYearRange = 12;
        if (endYear - startYear + 1 > maxYearRange) {
             showError(`Please select a range of ${maxYearRange} years or less.`);
             return;
        }

        if (reporterId && partnerId && categorySelect.value && startYear && endYear) {
            if (reporterId === partnerId && reporterId !== '0') {
                showError('Reporting and partner countries cannot be the same (unless one is "World"). Please select different countries.');
                if (chartInstance) {
                    try { chartInstance.destroy(); } catch(e) {}
                    chartInstance = null;
                    currentChartData = null;
                    chartTitleElement.textContent = 'Invalid Selection';
                }
                return;
            }
            showError(null);
            fetchTradeData(reporterId, partnerId, categoryCode, startYear, endYear);
        }
    }

    // --- New Dark Mode Logic ---

    function applyTheme(isDark) {
         document.body.classList.toggle("dark", isDark);
         // Update chart immediately after theme class is applied
         // Use a small timeout to ensure CSS variables are propagated
         setTimeout(updateChart, 50);
    }

    function initializeTheme() {
        if (!darkModeToggle) return;

        const savedPreference = localStorage.getItem("darkModeEnabled");
        let isDarkMode;

        if (savedPreference !== null) {
            isDarkMode = savedPreference === "true";
        } else {
            isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        darkModeToggle.checked = isDarkMode;
        applyTheme(isDarkMode); // Apply initial theme class
    }

    function setupThemeToggleListener() {
         if (!darkModeToggle) return;

         darkModeToggle.addEventListener('change', () => {
             const isChecked = darkModeToggle.checked;
             localStorage.setItem("darkModeEnabled", isChecked);
             applyTheme(isChecked); // Apply theme class and trigger chart update via applyTheme
         });
    }

    // --- Initialization ---

    function init() {
        initializeTheme(); // Set initial theme based on preference/system

        loadCountries(); // Load country data and set defaults

        reportingCountrySelect.addEventListener('change', handleSelectionChange);
        partnerCountrySelect.addEventListener('change', handleSelectionChange);
        categorySelect.addEventListener('change', handleSelectionChange);
        startYearSelect.addEventListener('change', handleSelectionChange);
        endYearSelect.addEventListener('change', handleSelectionChange);

        setupThemeToggleListener(); // Set up the listener for theme changes
    }

    init();
});
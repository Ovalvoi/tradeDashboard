document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

    // --- Configuration & State ---
    const reportingSelect = document.getElementById('reportingCountry');
    const partnerSelect = document.getElementById('partnerCountry');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorDisplay = document.getElementById('errorDisplay');
    const chartCanvas = document.getElementById('tradeChart');
    const chartTitle = document.getElementById('chartTitle');
    const ctx = chartCanvas.getContext('2d');
    let tradeChart = null; // Holds the Chart.js instance
    let currentChartData = null; // Holds the data used for the current chart

    // UN Comtrade numerical codes (M49)
    const countryCodes = {
        "World": "0", "Afghanistan": "4", "Albania": "8", "Algeria": "12", "American Samoa": "16",
        "Andorra": "20", "Angola": "24", "Antigua and Barbuda": "28", "Azerbaijan": "31", "Argentina": "32",
        "Australia": "36", "Austria": "40", "Bahamas": "44", "Bahrain": "48", "Bangladesh": "50",
        "Armenia": "51", "Barbados": "52", "Belgium": "56", "Bermuda": "60", "Bhutan": "64",
        "Bolivia (Plurinational State of)": "68", "Bosnia and Herzegovina": "70", "Botswana": "72",
        "Brazil": "76", "Belize": "84", "Solomon Islands": "90", "Brunei Darussalam": "96",
        "Bulgaria": "100", "Myanmar": "104", "Burundi": "108", "Belarus": "112", "Cambodia": "116",
        "Cameroon": "120", "Canada": "124", "Cabo Verde": "132", "Cayman Islands": "136",
        "Central African Republic": "140", "Sri Lanka": "144", "Chad": "148", "Chile": "152",
        "China": "156", "Colombia": "170", "Comoros": "174", "Congo": "178", "Cook Islands": "184",
        "Costa Rica": "188", "Croatia": "191", "Cuba": "192", "Cyprus": "196", "Czechia": "203",
        "Benin": "204", "Denmark": "208", "Dominica": "212", "Dominican Republic": "214",
        "Ecuador": "218", "El Salvador": "222", "Equatorial Guinea": "226", "Ethiopia": "231",
        "Eritrea": "232", "Estonia": "233", "Fiji": "242", "Finland": "246", "France": "250",
        "French Guiana": "254", "French Polynesia": "258", "Djibouti": "262", "Gabon": "266",
        "Georgia": "268", "Gambia": "270", "Germany": "276", "Ghana": "288", "Gibraltar": "292",
        "Kiribati": "296", "Greece": "300", "Greenland": "304", "Grenada": "308", "Guadeloupe": "312",
        "Guam": "316", "Guatemala": "320", "Guinea": "324", "Guyana": "328", "Haiti": "332",
        "Honduras": "340", "Hong Kong SAR": "344", "Hungary": "348", "Iceland": "352", "India": "356",
        "Indonesia": "360", "Iran (Islamic Republic of)": "364", "Iraq": "368", "Ireland": "372",
        "Israel": "376", "Italy": "380", "Côte d'Ivoire": "384", "Jamaica": "388", "Japan": "392",
        "Kazakhstan": "398", "Jordan": "400", "Kenya": "404", "Korea, Dem. People's Rep. of": "408",
        "Korea, Republic of": "410", "Kuwait": "414", "Kyrgyzstan": "417", "Lao People's Dem. Rep.": "418",
        "Lebanon": "422", "Lesotho": "426", "Latvia": "428", "Liberia": "430", "Libya": "434",
        "Liechtenstein": "438", "Lithuania": "440", "Luxembourg": "442", "Macao SAR": "446",
        "Madagascar": "450", "Malawi": "454", "Malaysia": "458", "Maldives": "462", "Mali": "466",
        "Malta": "470", "Martinique": "474", "Mauritania": "478", "Mauritius": "480", "Mexico": "484",
        "Monaco": "492", "Mongolia": "496", "Republic of Moldova": "498", "Montenegro": "499",
        "Montserrat": "500", "Morocco": "504", "Mozambique": "508", "Oman": "512", "Namibia": "516",
        "Nauru": "520", "Nepal": "524", "Netherlands": "528", "Curacao": "531", "Aruba": "533",
        "Sint Maarten (Dutch part)": "534", "Bonaire, Sint Eustatius and Saba": "535", "New Caledonia": "540",
        "Vanuatu": "548", "New Zealand": "554", "Nicaragua": "558", "Niger": "562", "Nigeria": "566",
        "Niue": "570", "Norway": "578", "Micronesia (Fed. States of)": "583", "Marshall Islands": "584",
        "Palau": "585", "Pakistan": "586", "Panama": "591", "Papua New Guinea": "598", "Paraguay": "600",
        "Peru": "604", "Philippines": "608", "Poland": "616", "Portugal": "620", "Guinea-Bissau": "624",
        "Timor-Leste": "626", "Puerto Rico": "630", "Qatar": "634", "Réunion": "638", "Romania": "642",
        "Russian Federation": "643", "Rwanda": "646", "Saint Kitts and Nevis": "659", "Saint Lucia": "662",
        "Saint Vincent and the Grenadines": "670", "San Marino": "674", "Sao Tome and Principe": "678",
        "Saudi Arabia": "682", "Senegal": "686", "Serbia": "688", "Seychelles": "690",
        "Sierra Leone": "694", "Singapore": "702", "Slovakia": "703", "Viet Nam": "704",
        "Slovenia": "705", "Somalia": "706", "South Africa": "710", "Zimbabwe": "716", "Spain": "724",
        "South Sudan": "728", "Sudan": "729", "Suriname": "740", "Eswatini": "748", "Sweden": "752",
        "Switzerland": "756", "Syrian Arab Republic": "760", "Tajikistan": "762", "Thailand": "764",
        "Togo": "768", "Tokelau": "772", "Tonga": "776", "Trinidad and Tobago": "780",
        "United Arab Emirates": "784", "Tunisia": "788", "Türkiye": "792", "Turkmenistan": "795",
        "Tuvalu": "798", "Uganda": "800", "Ukraine": "804", "North Macedonia": "807", "Egypt": "818",
        "United Kingdom": "826", "United Rep. of Tanzania": "834", "United States": "842",
        "United States Virgin Islands": "850", "Burkina Faso": "854", "Uruguay": "858", "Uzbekistan": "860",
        "Venezuela (Bolivarian Rep. of)": "862", "Samoa": "882", "Yemen": "887", "Zambia": "894"
    };

    // --- Functions ---

    /** Populates country dropdowns */
    function populateDropdowns() {
        console.log("Attempting to populate dropdowns...");
        try {
            // Sort countries alphabetically by name for better UX
            const sortedCountries = Object.entries(countryCodes)
                .sort(([nameA, nameB]) => nameA.localeCompare(nameB));

            // Clear existing options
            reportingSelect.options.length = 0;
            partnerSelect.options.length = 0;

            // Add default placeholder option
            reportingSelect.add(new Option("Select Reporting Country...", ""));
            partnerSelect.add(new Option("Select Partner Country...", ""));

            let count = 0;
            sortedCountries.forEach(([name, code]) => {
                const optionReporting = new Option(name, code);
                reportingSelect.add(optionReporting);

                // Skip adding "World" as a partner (often not desired for bilateral)
                if (name !== "World") {
                    const optionPartner = new Option(name, code);
                    partnerSelect.add(optionPartner);
                }
                count++;
            });

            console.log(`Populated dropdowns with ${count} countries.`);

            // Set default selections (e.g., Israel and Azerbaijan)
            reportingSelect.value = "376"; // Israel Code
            partnerSelect.value = "31";  // Azerbaijan Code
            console.log("Default countries set.");

        } catch (error) {
            console.error("Error in populateDropdowns:", error);
            errorDisplay.textContent = "Error populating country list. Check console.";
            errorDisplay.style.display = 'block';
        }
    }

    /** Fetches data from UN Comtrade API using CORS proxy */
    async function fetchComtradeData(reportingCode, partnerCode, years) {
        console.log(`Fetching data for ${reportingCode} <-> ${partnerCode} for years: ${years.join(', ')}`);

        // --- Parameters for Comtrade API v1 ---
        const typeCode = 'C'; // C = Commodities
        const freqCode = 'A'; // A = Annual
        const clCode = 'HS';  // HS = Harmonized System classification
        const rgCode = '1,2'; // 1 = Imports, 2 = Exports
        const cmdCode = 'TOTAL'; // TOTAL = Aggregate across all commodities

        // Construct the period string (e.g., "2020,2021,2022")
        const period = years.join(',');

        // Base API URL
        const apiUrl = `https://comtradeapi.un.org/public/v1/getMetadata/${typeCode}/${freqCode}/${clCode}?reporterCode=${reportingCode}&partnerCode=${partnerCode}&period=${period}&tradeDirection=${rgCode}&aggregateBy=${cmdCode}`;
        
        // Use CORS proxy to avoid CORS issues
        const CORS_PROXY = 'https://corsproxy.io/?';
        const proxyUrl = CORS_PROXY + encodeURIComponent(apiUrl);
        
        console.log("Requesting URL (via proxy):", proxyUrl);

        try {
            // First attempt to fetch data via the CORS proxy
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error(`API Error (${response.status} ${response.statusText})`);
            }
            
            const data = await response.json();
            console.log("API Raw Response:", data);
            
            // Process the API response
            const processedData = [];
            
            // Check if data exists and is properly structured
            if (data && data.data && Array.isArray(data.data)) {
                // Create a map to organize data by year
                const yearData = {};
                
                data.data.forEach(item => {
                    const year = item.period || item.year;
                    const tradeValue = item.tradeValue || 0;
                    const flow = item.tradeDirection || item.flowCode;
                    
                    if (!yearData[year]) {
                        yearData[year] = { year: parseInt(year), imports: 0, exports: 0 };
                    }
                    
                    // Map trade flow values based on API response structure
                    if (flow === 'Import' || flow === '1') {
                        yearData[year].imports += tradeValue;
                    } else if (flow === 'Export' || flow === '2') {
                        yearData[year].exports += tradeValue;
                    }
                });
                
                // Convert the map to an array sorted by year
                years.forEach(year => {
                    if (yearData[year]) {
                        processedData.push(yearData[year]);
                    } else {
                        processedData.push({ year: parseInt(year), imports: 0, exports: 0 });
                    }
                });
            } else {
                console.warn("Received data from API, but the structure wasn't as expected.", data);
                // Create empty data for requested years to avoid breaking chart
                processedData.push(...years.map(year => ({ year: parseInt(year), imports: 0, exports: 0 })));
            }
            
            return processedData;
            
        } catch (error) {
            console.error("API fetch error:", error);
            
            // Fall back to local data file if available
            try {
                console.log("Attempting to load from local data file...");
                const localResponse = await fetch('./data/comtrade.json');
                
                if (!localResponse.ok) {
                    throw new Error("Local data file not available");
                }
                
                const localData = await localResponse.json();
                console.log("Local data loaded:", localData);
                
                // Extract relevant data based on selected countries
                // This assumes your local data file has a structure that can be processed
                // Modify this based on your actual local data structure
                const filteredData = years.map(year => ({ 
                    year: parseInt(year), 
                    imports: 0, 
                    exports: 0 
                }));
                
                return filteredData;
                
            } catch (localError) {
                console.error("Local data fetch error:", localError);
                throw new Error(`Failed to fetch data: ${error.message}. Check console for details.`);
            }
        }
    }

    /** Renders the chart with trade data */
    function renderChart(data, reportingName, partnerName) {
        console.log("Rendering chart...");
        currentChartData = data;
        const years = data.map(d => d.year);
        const exports = data.map(d => d.exports);
        const imports = data.map(d => d.imports);

        const style = getComputedStyle(document.body);
        const textColor = style.getPropertyValue('--text').trim();
        const gridColor = style.getPropertyValue('--grid-color').trim();

        if (tradeChart) {
            tradeChart.destroy();
            console.log("Destroyed previous chart instance.");
        }

        chartTitle.textContent = `Trade between ${reportingName} and ${partnerName}`;

        try {
            tradeChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: years,
                    datasets: [
                        {
                            label: `Exports from ${reportingName} to ${partnerName} (USD)`,
                            data: exports,
                            borderColor: '#0d6efd', 
                            backgroundColor: '#0d6efd',
                            tension: 0.1, 
                            fill: false, 
                            pointRadius: 4, 
                            pointHoverRadius: 7,
                        },
                        {
                            label: `Imports by ${reportingName} from ${partnerName} (USD)`,
                            data: imports,
                            borderColor: '#dc3545', 
                            backgroundColor: '#dc3545',
                            tension: 0.1, 
                            fill: false, 
                            pointRadius: 4, 
                            pointHoverRadius: 7,
                        }
                    ]
                },
                options: {
                    responsive: true, 
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: textColor } },
                        tooltip: {
                            mode: 'index', 
                            intersect: false,
                            callbacks: {
                                label: function (context) {
                                    let label = context.dataset.label || '';
                                    if (label) { label += ': '; }
                                    if (context.parsed.y !== null) {
                                        label += new Intl.NumberFormat('en-US', { 
                                            style: 'currency', 
                                            currency: 'USD', 
                                            minimumFractionDigits: 0, 
                                            maximumFractionDigits: 0 
                                        }).format(context.parsed.y);
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: { 
                            ticks: { color: textColor }, 
                            grid: { color: gridColor } 
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: textColor,
                                callback: function (value) {
                                    if (value >= 1e9) { return '$' + (value / 1e9).toFixed(1) + 'B'; }
                                    if (value >= 1e6) { return '$' + (value / 1e6).toFixed(1) + 'M'; }
                                    if (value >= 1e3) { return '$' + (value / 1e3).toFixed(1) + 'K'; }
                                    return '$' + value;
                                }
                            },
                            grid: { color: gridColor }
                        }
                    }
                }
            });
            console.log("Chart rendered successfully.");
        } catch (error) {
            console.error("Error rendering chart:", error);
            errorDisplay.textContent = "Error displaying chart. Check console.";
            errorDisplay.style.display = 'block';
            chartTitle.textContent = `Error displaying chart`;
        }
    }

    /** Updates the dashboard with selected country data */
    async function updateDashboard() {
        console.log("Updating dashboard...");
        const reportingCode = reportingSelect.value;
        const partnerCode = partnerSelect.value;
        const reportingName = reportingSelect.options[reportingSelect.selectedIndex]?.text || 'Selected Country';
        const partnerName = partnerSelect.options[partnerSelect.selectedIndex]?.text || 'Selected Country';

        if (!reportingCode || !partnerCode) {
            console.log("Update skipped: Countries not selected.");
            chartTitle.textContent = "Please select both reporting and partner countries.";
            if (tradeChart) { 
                tradeChart.destroy(); 
                currentChartData = null; 
                tradeChart = null; 
            }
            return;
        }
        if (reportingCode === partnerCode) {
            console.log("Update skipped: Same country selected.");
            chartTitle.textContent = "Reporting and Partner country cannot be the same.";
            errorDisplay.textContent = "Please select two different countries.";
            errorDisplay.style.display = 'block';
            if (tradeChart) { 
                tradeChart.destroy(); 
                currentChartData = null; 
                tradeChart = null; 
            }
            return;
        }

        loadingIndicator.style.display = 'block';
        errorDisplay.style.display = 'none';
        errorDisplay.textContent = '';
        reportingSelect.disabled = true;
        partnerSelect.disabled = true;
        if (tradeChart) {
            tradeChart.data.datasets = []; // Clear chart data visually
            tradeChart.update();
        }
        chartTitle.textContent = `Loading trade data for ${reportingName} and ${partnerName}...`;

        try {
            const currentYear = new Date().getFullYear();
            // Get last 5 completed years
            const latestYear = currentYear - 1;
            const yearsToFetch = Array.from({ length: 5 }, (_, i) => latestYear - 4 + i);

            const tradeData = await fetchComtradeData(reportingCode, partnerCode, yearsToFetch);
            console.log("Fetched data:", tradeData);

            const hasData = tradeData.some(d => d.exports > 0 || d.imports > 0);
            if (!hasData) {
                console.log("No meaningful data found.");
                errorDisplay.textContent = `No trade data found for ${reportingName} and ${partnerName} between ${yearsToFetch[0]}-${yearsToFetch[yearsToFetch.length - 1]}.`;
                errorDisplay.style.display = 'block';
                chartTitle.textContent = `No data available for ${reportingName} and ${partnerName}`;
                if (tradeChart) { 
                    tradeChart.destroy(); 
                    currentChartData = null; 
                    tradeChart = null; 
                }
            } else {
                renderChart(tradeData, reportingName, partnerName);
            }

        } catch (error) {
            console.error("Failed to fetch or render data:", error);
            errorDisplay.textContent = `Failed to load data: ${error.message}. Check console for details.`;
            errorDisplay.style.display = 'block';
            chartTitle.textContent = `Error loading data`;
            if (tradeChart) { 
                tradeChart.destroy(); 
                currentChartData = null; 
                tradeChart = null; 
            }
        } finally {
            loadingIndicator.style.display = 'none';
            reportingSelect.disabled = false;
            partnerSelect.disabled = false;
            console.log("Dashboard update complete.");
        }
    }

    /** Sets up dark mode toggle functionality */
    function initDarkMode() {
        console.log("Initializing dark mode...");

        const applyDarkMode = (isDark) => {
            console.log(`Applying dark mode: ${isDark}`);
            document.body.classList.toggle("dark", isDark);
            console.log("Dark class toggled on body. Current classes:", document.body.className);

            // Re-render chart with current data if it exists, to apply theme colors
            if (tradeChart && currentChartData) {
                console.log("Re-rendering chart for theme change...");
                try {
                    const reportingName = reportingSelect.options[reportingSelect.selectedIndex]?.text || 'Selected Country';
                    const partnerName = partnerSelect.options[partnerSelect.selectedIndex]?.text || 'Selected Country';
                    renderChart(currentChartData, reportingName, partnerName);
                } catch (error) {
                    console.error("Error re-rendering chart on theme change:", error);
                }
            } else {
                console.log("Skipping chart re-render for theme: No chart or data available.");
            }
        }

        darkModeToggle.addEventListener("change", () => {
            const isChecked = darkModeToggle.checked;
            console.log(`Dark mode toggle changed. Checked: ${isChecked}`);
            localStorage.setItem("darkModeEnabled", isChecked);
            applyDarkMode(isChecked);
        });

        // Apply initial theme based on localStorage or system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedMode = localStorage.getItem("darkModeEnabled");

        // Determine initial state: use saved preference if it exists, otherwise use system preference
        let initialDarkMode = (savedMode !== null) ? (savedMode === "true") : prefersDark;

        console.log(`Initial dark mode check - Saved: ${savedMode}, PrefersDark: ${prefersDark}, InitialDarkMode: ${initialDarkMode}`);

        darkModeToggle.checked = initialDarkMode;
        applyDarkMode(initialDarkMode);
        console.log("Dark mode initialized.");
    }

    /** Main initialization function */
    function init() {
        console.log("Initializing application...");
        // Initialize theme first, so UI elements are styled correctly when populated
        initDarkMode();
        // Populate dropdowns next
        populateDropdowns();

        // Add event listeners only after elements are populated
        reportingSelect.addEventListener('change', updateDashboard);
        partnerSelect.addEventListener('change', updateDashboard);

        // Fetch data for default selections on initial load, only if defaults are valid
        if (reportingSelect.value && partnerSelect.value) {
            console.log("Triggering initial dashboard update.");
            updateDashboard();
        } else {
            console.log("Skipping initial dashboard update (no default countries selected/populated).");
            chartTitle.textContent = "Please select countries to view trade data.";
        }
        console.log("Application initialization complete.");
    }

    // --- Run Initialization ---
    init();
});
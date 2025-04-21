document.addEventListener('DOMContentLoaded', () => {

    // --- START: Manual Translation Code ---

    const translations = {
        // English Translations (Fallback)
        en: {
            dashboardTitle: "International Trade Dashboard", labelDarkMode: "Dark Mode", labelLanguage: "Language: ",
            labelStartYear: "Start Year", labelEndYear: "End Year", labelReportingCountry: "Reporting Country",
            labelPartnerCountry: "Partner Country", labelTradeCategory: "Trade Category", loadingText: "Loading...",
            loadingTradeData: "Loading trade data...", errorLoadingCountryList: "Could not load country list: {{message}}",
            errorFetchTradeData: "Failed to fetch trade data: {{message}}",
            errorNoData: "No trade data found for {{reporter}} and {{partner}} (Category: {{category}}) for years {{years}}. Data might be unavailable.",
            errorInvalidYearRange: "Please select a valid year range.", errorMaxYearRange: "Please select a range of {{maxYears}} years or less.",
            errorSameCountry: "Reporting and partner countries cannot be the same (unless one is \"World\"). Please select different countries.",
            errorInvalidSelection: "Invalid Selection", errorRenderingChart: "Error rendering chart.",
            chartTitleDefault: "Select countries to view trade data", chartTitleLoading: "Loading trade data...",
            chartTitleError: "Failed to load data", chartTitleNoData: "No data available for this selection/period",
            chartTitlePattern: "Trade: {{reporter}} <=> {{partner}} ({{category}})", chartLegendImports: "Imports by Reporter",
            chartLegendExports: "Exports by Reporter", chartAxisYLabel: "Trade Value (USD)", chartAxisXLabel: "Year",
            optionSelectCountry: "Select Country...", optionTOTAL: "Total Trade", optionAGRMULTI: "Agriculture",
            option25: "Minerals: Salt, Stone, Cement", option27: "Minerals: Fuels, Oils", option71: "Minerals: Pearls, Gems, Diamonds",
            option72: "Minerals: Iron & Steel", option28: "Chemicals: Inorganic", option29: "Chemicals: Organic",
            option30: "Pharmaceutical Products", option39: "Plastics & Articles Thereof", option64: "Footwear, Gaiters",
            option61: "Clothing: Knitted Apparel", option62: "Clothing: Non-Knitted Apparel", option84: "Machinery & Mechanical Appliances",
            option85: "Electrical Machinery & Equipment", option87: "Vehicles (Cars, Trucks, etc.)", option88: "Aircraft, Spacecraft & Parts",
            option90: "Optical, Photo, Medical Instruments", option94: "Furniture, Bedding, Lamps"
        },
        // Hebrew Translations
        he: {
            dashboardTitle: "לוח בקרה: סחר בינלאומי", labelDarkMode: "מצב כהה", labelLanguage: "שפה: ",
            labelStartYear: "שנת התחלה", labelEndYear: "שנת סיום", labelReportingCountry: "מדינה מדווחת",
            labelPartnerCountry: "מדינת שותף", labelTradeCategory: "קטגוריית סחר", loadingText: "טוען...",
            loadingTradeData: "טוען נתוני סחר...", errorLoadingCountryList: "שגיאה בטעינת רשימת המדינות: {{message}}",
            errorFetchTradeData: "כשלון באחזור נתוני סחר: {{message}}",
            errorNoData: "לא נמצאו נתוני סחר עבור {{reporter}} ו-{{partner}} (קטגוריה: {{category}}) לשנים {{years}}. ייתכן שהנתונים אינם זמינים.",
            errorInvalidYearRange: "אנא בחר/י טווח שנים תקין.", errorMaxYearRange: "אנא בחר/י טווח של {{maxYears}} שנים או פחות.",
            errorSameCountry: "מדינה מדווחת ומדינת שותף אינן יכולות להיות זהות (אלא אם אחת היא \"עולם\"). אנא בחר/י מדינות שונות.",
            errorInvalidSelection: "בחירה לא תקינה", errorRenderingChart: "שגיאה בהצגת התרשים.",
            chartTitleDefault: "בחר/י מדינות להצגת נתוני סחר", chartTitleLoading: "טוען נתוני סחר...",
            chartTitleError: "כשלון בטעינת נתונים", chartTitleNoData: "אין נתונים זמינים לבחירה/לתקופה זו",
            chartTitlePattern: "סחר: {{reporter}} <=> {{partner}} ({{category}})", chartLegendImports: "יבוא ע\"י המדווחת",
            chartLegendExports: "יצוא ע\"י המדווחת", chartAxisYLabel: "ערך הסחר (דולר ארה\"ב)", chartAxisXLabel: "שנה",
            optionSelectCountry: "בחר/י מדינה...", optionTOTAL: "סחר כולל", optionAGRMULTI: "חקלאות",
            option25: "מינרלים: מלח, אבן, מלט", option27: "מינרלים: דלקים, שמנים", option71: "מינרלים: פנינים, אבני חן, יהלומים",
            option72: "מינרלים: ברזל ופלדה", option28: "כימיקלים: אי-אורגניים", option29: "כימיקלים: אורגניים",
            option30: "מוצרים פרמצבטיים", option39: "פלסטיק ומוצריו", option64: "הנעלה, חותלות",
            option61: "ביגוד: סרוגים", option62: "ביגוד: לא סרוגים", option84: "מכונות ומכשירים מכניים",
            option85: "מכונות וציוד חשמליים", option87: "כלי רכב (מכוניות, משאיות וכו')", option88: "כלי טיס, חלליות וחלקיהם",
            option90: "מכשירים אופטיים, צילום, רפואיים", option94: "רהיטים, מצעים, מנורות"
        }
    };

    let currentLang = 'en'; // Default language ('en' or 'he')

    // Simple Translation Function
    function getText(key, options = {}) {
        let text = translations[currentLang]?.[key] || translations['en']?.[key] || `MissingKey: ${key}`;
        for (const optKey in options) {
            text = text.replace(new RegExp(`{{${optKey}}}`, 'g'), options[optKey]);
        }
        return text;
    }

    // UI Update Function for Static Text and Dropdowns
    function updateUIText() {
        // Update elements marked with data-translate-key
        document.querySelectorAll('[data-translate-key]').forEach(el => {
            const key = el.getAttribute('data-translate-key');
            el.textContent = getText(key);
        });

        // Update trade category dropdown options
        const categorySelect = document.getElementById('tradeCategory'); // Find element again
        if (categorySelect) {
             categorySelect.querySelectorAll('option').forEach(opt => {
                 if (opt.value) {
                     const key = 'option' + opt.value.replace(/[^a-zA-Z0-9]/g, '');
                     opt.textContent = getText(key, { defaultValue: opt.textContent }); // Pass original text as fallback
                 }
             });
        }

        // Update country dropdown placeholders
        updateCountryPlaceholdersManual();

        // Update HTML direction attribute
        document.documentElement.dir = currentLang === 'he' ? 'rtl' : 'ltr';
        document.documentElement.lang = currentLang; // Also set lang attribute
    }

    // Helper for country placeholders
    function updateCountryPlaceholdersManual() {
        const phKey = 'optionSelectCountry';
        const placeholderText = getText(phKey);
        const reportingSelect = document.getElementById('reportingCountry'); // Find element
        const partnerSelect = document.getElementById('partnerCountry'); // Find element
        const phRep = reportingSelect?.querySelector('option[value=""]');
        const phPart = partnerSelect?.querySelector('option[value=""]');
        if (phRep) phRep.textContent = placeholderText;
        if (phPart) phPart.textContent = placeholderText;
    }

    // Language Switching Logic
    function setLanguage(lang) {
        if (lang === currentLang || !translations[lang]) return;
        currentLang = lang;
        console.log("Language set to:", currentLang);
        updateUIText(); // Update static text
        updateLanguageButtonStates(); // Update button appearance

        // Re-run current selection to update dynamic elements like chart titles/legends
        // Ensure handleSelectionChange is defined and accessible
        if (typeof handleSelectionChange === 'function') {
            // Check if selections are valid before refreshing potentially empty chart
             const reportingSelect = document.getElementById('reportingCountry');
             const partnerSelect = document.getElementById('partnerCountry');
             if (reportingSelect?.value && partnerSelect?.value) {
                 handleSelectionChange();
             } else {
                 // If no selection, just update the default title
                 const chartTitleElement = document.getElementById('chartTitle');
                 if (chartTitleElement) {
                    chartTitleElement.textContent = getText('chartTitleDefault');
                    chartTitleElement.setAttribute('data-translate-key','chartTitleDefault');
                 }
                 // Also update chart axes/legends if chart exists but has no data
                 if(window.chartInstance) { // Access chartInstance if global
                     updateChart(); // Call update chart to redraw axes/legends
                 }
             }
        } else {
            console.error("handleSelectionChange function not found for language update.");
        }
    }

    function updateLanguageButtonStates() {
         const langButtonEN = document.getElementById('lang-en'); // Find element
         const langButtonHE = document.getElementById('lang-he'); // Find element
         if (!langButtonEN || !langButtonHE) return; // Exit if buttons not found

        if (currentLang === 'en') {
            langButtonEN.classList.replace('btn-outline-secondary', 'btn-primary');
            langButtonEN.disabled = true;
            langButtonHE.classList.replace('btn-primary', 'btn-outline-secondary');
            langButtonHE.disabled = false;
        } else { // 'he'
            langButtonHE.classList.replace('btn-outline-secondary', 'btn-primary');
            langButtonHE.disabled = true;
            langButtonEN.classList.replace('btn-primary', 'btn-outline-secondary');
            langButtonEN.disabled = false;
        }
    }

    // --- END: Manual Translation Code ---

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
    const switchButton = document.getElementById('switch');

    let chartInstance = null;
    let currentChartData = null;

    const commodityCodes = {
        'TOTAL': 'TOTAL',
        'AGR_MULTI': 'AGR_MULTI',
        '25': '25', // Minerals: Salt, Stone, Cement
        '27': '27', // Minerals: Fuels, Oils
        '71': '71', // Minerals: Pearls, Gems, Diamonds
        '72': '72', // Minerals: Iron & Steel
        '28': '28', // Chemicals: Inorganic
        '29': '29', // <--- Add Chemicals: Organic
        '30': '30', // <--- Add Pharmaceutical Products
        '39': '39', // Plastics & Articles Thereof
        '61': '61', // Clothing: Knitted Apparel
        '62': '62', // Clothing: Non-Knitted Apparel
        '64': '64', // <--- Add Footwear, Gaiters
        '84': '84', // Machinery & Mechanical Appliances
        '85': '85', // Electrical Machinery & Equipment
        '87': '87', // <--- Add Vehicles (Cars, Trucks, etc.)
        '88': '88', // Aircraft, Spacecraft & Parts
        '90': '90', // Optical, Photo, Medical Instruments
        '94': '94', // <--- Add Furniture, Bedding, Lamps
        // Add mappings for any other options you included in HTML
        // e.g., '76': '76' for Aluminum
    };

    function handleCountrySwitch() {
        const currentReporterValue = reportingCountrySelect.value;
        const currentPartnerValue = partnerCountrySelect.value;
    
        reportingCountrySelect.value = currentPartnerValue;
        partnerCountrySelect.value = currentReporterValue;
    
        handleSelectionChange();
    }


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
        let categoryCode = commodityCodes[categorySelect.value] || 'TOTAL';
        const startYear = parseInt(startYearSelect.value, 10);
        const endYear = parseInt(endYearSelect.value, 10);

        if (categoryCode === 'AGR_MULTI') {
            // Replace the special code with the actual list of HS chapters 01-24
            categoryCode = '01,02,03,04,05,06,07,08,09,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24';
            console.log("Requesting combined agriculture chapters:", categoryCode);
        }

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

        if (switchButton) { // Check if the button exists
            switchButton.addEventListener('click', handleCountrySwitch);
       } else {
            console.warn("Switch button element not found.");
       }

        setupThemeToggleListener(); // Set up the listener for theme changes
    }

        // Add language button listeners AFTER defining setLanguage
        const langButtonEN = document.getElementById('lang-en'); // Find element again
        const langButtonHE = document.getElementById('lang-he'); // Find element again
        if(langButtonEN) langButtonEN.addEventListener('click', () => setLanguage('en'));
        if(langButtonHE) langButtonHE.addEventListener('click', () => setLanguage('he'));

    init();
});
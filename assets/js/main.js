// Cloudflare Worker proxy (source in /proxy). It holds the UN Comtrade API key,
// adds CORS headers and caches responses. Never put the API key in this file.
const PROXY_URL = 'https://comtrade-proxy.yuval8787.workers.dev/trade';

const MAX_YEAR_RANGE = 12;
const CACHE_PREFIX = 'trade:v2:';
const AGRICULTURE_CHAPTERS = Array.from({ length: 24 }, (_, i) => String(i + 1).padStart(2, '0')).join(',');

const translations = {
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
        switchTitle: "Switch Reporting and Partner Countries",
        optionSelectCountry: "Select Country...", optionTOTAL: "Total Trade", optionAGRMULTI: "Agriculture",
        option25: "Minerals: Salt, Stone, Cement", option27: "Minerals: Fuels, Oils", option71: "Minerals: Pearls, Gems, Diamonds",
        option72: "Minerals: Iron & Steel", option28: "Chemicals: Inorganic", option29: "Chemicals: Organic",
        option30: "Pharmaceutical Products", option39: "Plastics & Articles Thereof", option64: "Footwear, Gaiters",
        option61: "Clothing: Knitted Apparel", option62: "Clothing: Non-Knitted Apparel", option84: "Machinery & Mechanical Appliances",
        option85: "Electrical Machinery & Equipment", option87: "Vehicles (Cars, Trucks, etc.)", option88: "Aircraft, Spacecraft & Parts",
        option90: "Optical, Photo, Medical Instruments", option94: "Furniture, Bedding, Lamps",
        footerText: "© 2025–{{year}} Simple International Trade Dashboard. All rights reserved.",
        footerText2: "Developed for Dr. Erez Shoshani's Israel's Foreign Policy Course Assignment - Ruppin Academic Center",
        footerText3: "This dashboard is powered by the UN Comtrade API and Chart.js. Data may not be available for all countries or years.",
    },
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
        switchTitle: "החלפת המדינה המדווחת ומדינת השותף",
        optionSelectCountry: "בחר/י מדינה...", optionTOTAL: "סחר כולל", optionAGRMULTI: "חקלאות",
        option25: "מינרלים: מלח, אבן, מלט", option27: "מינרלים: דלקים, שמנים", option71: "מינרלים: פנינים, אבני חן, יהלומים",
        option72: "מינרלים: ברזל ופלדה", option28: "כימיקלים: אי-אורגניים", option29: "כימיקלים: אורגניים",
        option30: "מוצרים פרמצבטיים", option39: "פלסטיק ומוצריו", option64: "הנעלה, חותלות",
        option61: "ביגוד: סרוגים", option62: "ביגוד: לא סרוגים", option84: "מכונות ומכשירים מכניים",
        option85: "מכונות וציוד חשמליים", option87: "כלי רכב (מכוניות, משאיות וכו')", option88: "כלי טיס, חלליות וחלקיהם",
        option90: "מכשירים אופטיים, צילום, רפואיים", option94: "רהיטים, מצעים, מנורות",
        footerText: "© 2025–{{year}} לוח בקרה פשוט לסחר בינלאומי. כל הזכויות שמורות.",
        footerText2: "פותח עבור מטלת הקורס 'מדיניות החוץ של ישראל' של דוקטור ארז שושני - המרכז האקדמי רופין",
        footerText3: "לוח בקרה זה מופעל על ידי ממשק ה-API של UN Comtrade ו-Chart.js. ייתכן ונתונים לא יהיו זמינים עבור כל המדינות או השנים."
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const $ = (id) => document.getElementById(id);
    const reportingCountrySelect = $('reportingCountry');
    const partnerCountrySelect = $('partnerCountry');
    const categorySelect = $('tradeCategory');
    const chartCanvas = $('tradeChart');
    const loadingIndicator = $('loadingIndicator');
    const errorDisplay = $('errorDisplay');
    const chartTitleElement = $('chartTitle');
    const startYearSelect = $('startYear');
    const endYearSelect = $('endYear');
    const darkModeToggle = $('darkModeToggle');
    const switchButton = $('switch');
    const langButtons = { en: $('lang-en'), he: $('lang-he') };

    let currentLang = safeStorageGet(localStorage, 'lang') === 'he' ? 'he' : 'en';
    let chartInstance = null;
    // Processed data for the chart: { labels: [...years], imports: [...], exports: [...] }
    let currentSeries = null;
    // What the chart title shows; re-rendered on language change: { key, options }
    let titleState = { key: 'chartTitleDefault', options: {} };
    let inFlight = null; // AbortController of the current request
    let debounceTimer = null;

    // ---------- Helpers ----------

    function safeStorageGet(storage, key) {
        try { return storage.getItem(key); } catch { return null; }
    }
    function safeStorageSet(storage, key, value) {
        try { storage.setItem(key, value); } catch { /* storage full or blocked */ }
    }

    function getText(key, options = {}) {
        let text = translations[currentLang]?.[key] ?? translations.en[key] ?? key;
        for (const [k, v] of Object.entries(options)) {
            text = text.replaceAll(`{{${k}}}`, v);
        }
        return text;
    }

    function selectedText(select) {
        return select.options[select.selectedIndex]?.text ?? '';
    }

    function selectionNames() {
        return {
            reporter: selectedText(reportingCountrySelect),
            partner: selectedText(partnerCountrySelect),
            category: selectedText(categorySelect),
        };
    }

    function setTitle(key, options = {}) {
        titleState = { key, options };
        chartTitleElement.textContent = getText(key, options);
    }

    function showLoading(isLoading) {
        loadingIndicator.style.display = isLoading ? 'block' : 'none';
    }

    function showError(message) {
        errorDisplay.textContent = message || '';
        errorDisplay.style.display = message ? 'block' : 'none';
    }

    function destroyChart() {
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
    }

    // ---------- Language ----------

    function updateUIText() {
        const year = String(new Date().getFullYear());
        document.querySelectorAll('[data-translate-key]').forEach(el => {
            el.textContent = getText(el.getAttribute('data-translate-key'), { year });
        });
        categorySelect.querySelectorAll('option').forEach(opt => {
            if (opt.value) opt.textContent = getText('option' + opt.value.replace(/[^a-zA-Z0-9]/g, ''));
        });
        [reportingCountrySelect, partnerCountrySelect].forEach(sel => {
            const ph = sel.querySelector('option[value=""]');
            if (ph) ph.textContent = getText('optionSelectCountry');
        });
        if (switchButton) switchButton.title = getText('switchTitle');
        document.documentElement.dir = currentLang === 'he' ? 'rtl' : 'ltr';
        document.documentElement.lang = currentLang;

        for (const [lang, btn] of Object.entries(langButtons)) {
            if (!btn) continue;
            const active = lang === currentLang;
            btn.classList.toggle('btn-primary', active);
            btn.classList.toggle('btn-outline-secondary', !active);
            btn.disabled = active;
        }

        // Title and chart depend on language but not on data, so no refetch is needed.
        setTitle(titleState.key, titleState.key === 'chartTitlePattern' ? selectionNames() : titleState.options);
        renderChart();
    }

    function setLanguage(lang) {
        if (lang === currentLang || !translations[lang]) return;
        currentLang = lang;
        safeStorageSet(localStorage, 'lang', lang);
        updateUIText();
    }

    // ---------- Data ----------

    async function loadCountries() {
        try {
            const response = await fetch('assets/data/countries.json');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const countries = await response.json();
            countries.sort((a, b) => a.text.localeCompare(b.text));
            reportingCountrySelect.length = 1;
            partnerCountrySelect.length = 1;
            countries.forEach(c => {
                reportingCountrySelect.add(new Option(c.text, c.id));
                partnerCountrySelect.add(new Option(c.text, c.id));
            });
            reportingCountrySelect.value = '376'; // Israel
            partnerCountrySelect.value = '31';    // Azerbaijan
            handleSelectionChange();
        } catch (error) {
            showError(getText('errorLoadingCountryList', { message: error.message }));
        }
    }

    async function fetchRows(params, signal) {
        const cacheKey = CACHE_PREFIX + params.toString();
        const cached = safeStorageGet(sessionStorage, cacheKey);
        if (cached) return JSON.parse(cached);

        const response = await fetch(`${PROXY_URL}?${params}`, { signal });
        let body = null;
        try { body = await response.json(); } catch { /* non-JSON error body */ }
        if (!response.ok) {
            throw new Error(body?.error || `${response.status} ${response.statusText}`);
        }
        const rows = body?.data ?? [];
        safeStorageSet(sessionStorage, cacheKey, JSON.stringify(rows));
        return rows;
    }

    async function fetchTradeData(reporterId, partnerId, cmdCode, startYear, endYear) {
        inFlight?.abort();
        const controller = new AbortController();
        inFlight = controller;

        showLoading(true);
        showError(null);
        setTitle('chartTitleLoading');
        currentSeries = null;
        destroyChart();

        const years = [];
        for (let y = startYear; y <= endYear; y++) years.push(y);
        const params = new URLSearchParams({
            reporterCode: reporterId,
            partnerCode: partnerId,
            period: years.join(','),
            cmdCode,
        });

        try {
            const rows = await fetchRows(params, controller.signal);
            if (controller !== inFlight) return; // a newer request superseded this one

            if (rows.length === 0) {
                showError(getText('errorNoData', { ...selectionNames(), years: `${startYear}-${endYear}` }));
                setTitle('chartTitleNoData');
                renderChart();
                return;
            }
            currentSeries = processData(rows);
            setTitle('chartTitlePattern', selectionNames());
            renderChart();
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error('Fetch trade data error:', error);
            showError(getText('errorFetchTradeData', { message: error.message }));
            setTitle('chartTitleError');
        } finally {
            if (controller === inFlight) {
                showLoading(false);
                inFlight = null;
            }
        }
    }

    function processData(rows) {
        const imports = {}, exports = {};
        for (const { period, flowCode, primaryValue } of rows) {
            const year = String(period);
            const value = Number(primaryValue) || 0;
            if (flowCode === 'M') imports[year] = (imports[year] || 0) + value;
            else if (flowCode === 'X') exports[year] = (exports[year] || 0) + value;
        }
        const labels = [...new Set([...Object.keys(imports), ...Object.keys(exports)])].sort((a, b) => a - b);
        return {
            labels,
            imports: labels.map(y => imports[y] ?? null),
            exports: labels.map(y => exports[y] ?? null),
        };
    }

    // ---------- Chart ----------

    function getThemeColors() {
        if (document.body.classList.contains('dark')) {
            return {
                textColor: '#ffffff',
                gridColor: 'rgba(255, 255, 255, 0.15)',
                tooltipBgColor: '#2c2c2c',
                tooltipBorderColor: 'rgba(255, 255, 255, 0.2)',
            };
        }
        const style = getComputedStyle(document.documentElement);
        return {
            textColor: style.getPropertyValue('--text-light').trim(),
            gridColor: style.getPropertyValue('--grid-color-light').trim(),
            tooltipBgColor: style.getPropertyValue('--card-bg-light').trim(),
            tooltipBorderColor: 'rgba(0, 0, 0, 0.1)',
        };
    }

    const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    function compactNumber(value) {
        if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
        if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
        if (value >= 1e3) return (value / 1e3).toFixed(1) + 'K';
        return value;
    }

    function renderChart() {
        destroyChart();
        if (!currentSeries || !chartCanvas) {
            chartCanvas?.getContext('2d').clearRect(0, 0, chartCanvas.width, chartCanvas.height);
            return;
        }
        const theme = getThemeColors();
        const axis = (titleKey) => ({
            ticks: { color: theme.textColor },
            grid: { color: theme.gridColor },
            title: { display: true, text: getText(titleKey), color: theme.textColor },
        });
        const y = axis('chartAxisYLabel');
        y.beginAtZero = true;
        y.ticks.callback = compactNumber;

        try {
            chartInstance = new Chart(chartCanvas.getContext('2d'), {
                type: 'line',
                data: {
                    labels: currentSeries.labels,
                    datasets: [
                        { label: getText('chartLegendImports'), data: currentSeries.imports, borderColor: 'rgb(255, 99, 132)', backgroundColor: 'rgba(255, 99, 132, 0.5)', tension: 0.1 },
                        { label: getText('chartLegendExports'), data: currentSeries.exports, borderColor: 'rgb(54, 162, 235)', backgroundColor: 'rgba(54, 162, 235, 0.5)', tension: 0.1 },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    color: theme.textColor,
                    plugins: {
                        legend: { labels: { color: theme.textColor } },
                        tooltip: {
                            backgroundColor: theme.tooltipBgColor,
                            titleColor: theme.textColor,
                            titleFont: { weight: 'bold' },
                            bodyColor: theme.textColor,
                            bodySpacing: 4,
                            padding: 10,
                            cornerRadius: 4,
                            borderColor: theme.tooltipBorderColor,
                            borderWidth: 1,
                            callbacks: {
                                label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y == null ? '—' : usd.format(ctx.parsed.y)}`,
                            },
                        },
                    },
                    scales: { x: axis('chartAxisXLabel'), y },
                },
            });
        } catch (error) {
            showError(getText('errorRenderingChart'));
            console.error('Chart rendering error:', error);
        }
    }

    // ---------- Selection ----------

    function handleSelectionChange() {
        const reporterId = reportingCountrySelect.value;
        const partnerId = partnerCountrySelect.value;
        const category = categorySelect.value || 'TOTAL';
        const cmdCode = category === 'AGR_MULTI' ? AGRICULTURE_CHAPTERS : category;
        const startYear = parseInt(startYearSelect.value, 10);
        const endYear = parseInt(endYearSelect.value, 10);

        if (!startYear || !endYear || startYear > endYear) {
            showError(getText('errorInvalidYearRange'));
            return;
        }
        if (endYear - startYear + 1 > MAX_YEAR_RANGE) {
            showError(getText('errorMaxYearRange', { maxYears: MAX_YEAR_RANGE }));
            return;
        }
        if (!reporterId || !partnerId) return;

        if (reporterId === partnerId && reporterId !== '0') {
            inFlight?.abort();
            showError(getText('errorSameCountry'));
            currentSeries = null;
            renderChart();
            setTitle('errorInvalidSelection');
            return;
        }
        showError(null);
        fetchTradeData(reporterId, partnerId, cmdCode, startYear, endYear);
    }

    function debouncedSelectionChange() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(handleSelectionChange, 500);
    }

    function handleCountrySwitch() {
        [reportingCountrySelect.value, partnerCountrySelect.value] = [partnerCountrySelect.value, reportingCountrySelect.value];
        handleSelectionChange();
    }

    // ---------- Theme ----------

    function applyTheme(isDark) {
        document.body.classList.toggle('dark', isDark);
        // Let CSS variables propagate before reading them for the chart.
        setTimeout(renderChart, 50);
    }

    function initializeTheme() {
        if (!darkModeToggle) return;
        const saved = safeStorageGet(localStorage, 'darkModeEnabled');
        const isDark = saved !== null ? saved === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches;
        darkModeToggle.checked = isDark;
        applyTheme(isDark);
        darkModeToggle.addEventListener('change', () => {
            safeStorageSet(localStorage, 'darkModeEnabled', darkModeToggle.checked);
            applyTheme(darkModeToggle.checked);
        });
    }

    // ---------- Init ----------

    initializeTheme();
    updateUIText();
    loadCountries();

    reportingCountrySelect.addEventListener('change', handleSelectionChange);
    partnerCountrySelect.addEventListener('change', handleSelectionChange);
    categorySelect.addEventListener('change', handleSelectionChange);
    // Year inputs fire on every arrow click / keystroke, so wait until the user pauses.
    startYearSelect.addEventListener('input', debouncedSelectionChange);
    endYearSelect.addEventListener('input', debouncedSelectionChange);
    switchButton?.addEventListener('click', handleCountrySwitch);
    langButtons.en?.addEventListener('click', () => setLanguage('en'));
    langButtons.he?.addEventListener('click', () => setLanguage('he'));
});

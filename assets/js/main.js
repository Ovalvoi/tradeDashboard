// Cloudflare Worker proxy (source in /proxy). It holds the UN Comtrade API key,
// adds CORS headers and caches responses. Never put the API key in this file.
const PROXY_URL = 'https://comtrade-proxy.yuval8787.workers.dev/trade';

const MAX_YEAR_RANGE = 12;
const CACHE_PREFIX = 'trade:v2:';
const AGRICULTURE_CHAPTERS = Array.from({ length: 24 }, (_, i) => String(i + 1).padStart(2, '0')).join(',');
// Country names the browser renders too long, per language (keyed by ISO code)
const COUNTRY_NAME_OVERRIDES = { he: { HK: 'הונג קונג' } };
// Unicode isolates keep a name intact when it sits inside text of the other direction
const isolate = (s) => `⁨${s}⁩`;

const translations = {
    en: {
        dashboardTitle: "International Trade Dashboard", labelDarkMode: "Toggle dark mode",
        labelStartYear: "Start Year", labelEndYear: "End Year", labelReportingCountry: "Reporting Country",
        labelPartnerCountry: "Partner Country", labelTradeCategory: "Trade Category",
        loadingTradeData: "Loading trade data...", errorLoadingCountryList: "Could not load country list: {{message}}",
        errorFetchTradeData: "Failed to fetch trade data: {{message}}",
        errorNoData: "No trade data found for {{reporter}} and {{partner}} (Category: {{category}}) for years {{years}}. Data might be unavailable.",
        errorInvalidYearRange: "Please select a valid year range.", errorMaxYearRange: "Please select a range of {{maxYears}} years or less.",
        errorSameCountry: "Reporting and partner countries cannot be the same (unless one is \"World\"). Please select different countries.",
        errorInvalidSelection: "Invalid selection", errorRenderingChart: "Error rendering chart.",
        chartTitleDefault: "Select countries to view trade data", chartTitleLoading: "Loading trade data...",
        chartTitleError: "Failed to load data", chartTitleNoData: "No data available for this selection/period",
        chartTitlePattern: "{{reporter}} ↔ {{partner}} · {{category}}",
        chartLegendExports: "{{reporter}} exports", chartLegendImports: "{{reporter}} imports",
        chartAxisYLabel: "Trade value (USD)", chartAxisXLabel: "Year",
        switchTitle: "Switch reporting and partner countries", countryWorld: "World",
        statExports: "Exports", statImports: "Imports", statBalance: "Trade balance", statTotal: "Total trade",
        statInYear: "In {{year}}", statChange: "{{change}} vs {{year}}", showTable: "Show data table",
        optionSelectCountry: "Select Country...", optionTOTAL: "Total Trade", optionAGRMULTI: "Agriculture",
        option25: "Minerals: Salt, Stone, Cement", option27: "Minerals: Fuels, Oils", option71: "Minerals: Pearls, Gems, Diamonds",
        option72: "Minerals: Iron & Steel", option28: "Chemicals: Inorganic", option29: "Chemicals: Organic",
        option30: "Pharmaceutical Products", option39: "Plastics & Articles Thereof", option64: "Footwear, Gaiters",
        option61: "Clothing: Knitted Apparel", option62: "Clothing: Non-Knitted Apparel", option84: "Machinery & Mechanical Appliances",
        option85: "Electrical Machinery & Equipment", option87: "Vehicles (Cars, Trucks, etc.)", option88: "Aircraft, Spacecraft & Parts",
        option90: "Optical, Photo, Medical Instruments", option94: "Furniture, Bedding, Lamps",
        footerText: "© {{year}} Simple International Trade Dashboard. All rights reserved.",
        footerText2: "Developed for Dr. Erez Shoshani's Israel's Foreign Policy Course Assignment - Ruppin Academic Center",
        footerText3: "This dashboard is powered by the UN Comtrade API and Chart.js. Data may not be available for all countries or years.",
    },
    he: {
        dashboardTitle: "לוח בקרה לסחר בינלאומי", labelDarkMode: "מעבר בין מצב כהה לבהיר",
        labelStartYear: "משנת", labelEndYear: "עד שנת", labelReportingCountry: "מדינה מדווחת",
        labelPartnerCountry: "מדינה שותפה", labelTradeCategory: "תחום סחר",
        loadingTradeData: "טוען נתוני סחר...", errorLoadingCountryList: "לא ניתן לטעון את רשימת המדינות: {{message}}",
        errorFetchTradeData: "טעינת נתוני הסחר נכשלה: {{message}}",
        errorNoData: "לא נמצאו נתוני סחר בין {{reporter}} ל{{partner}} ({{category}}) בשנים {{years}}. ייתכן שהנתונים אינם זמינים.",
        errorInvalidYearRange: "יש לבחור טווח שנים תקין.", errorMaxYearRange: "ניתן לבחור טווח של עד {{maxYears}} שנים.",
        errorSameCountry: "המדינה המדווחת והמדינה השותפה לא יכולות להיות זהות (אלא אם אחת מהן היא \"העולם\"). יש לבחור מדינות שונות.",
        errorInvalidSelection: "בחירה לא תקינה", errorRenderingChart: "אירעה שגיאה בהצגת התרשים.",
        chartTitleDefault: "בחרו מדינות כדי לראות את נתוני הסחר", chartTitleLoading: "טוען נתוני סחר...",
        chartTitleError: "טעינת הנתונים נכשלה", chartTitleNoData: "אין נתונים לבחירה או לתקופה זו",
        chartTitlePattern: "{{reporter}} ↔ {{partner}} · {{category}}",
        chartLegendExports: "יצוא {{reporter}}", chartLegendImports: "יבוא {{reporter}}",
        chartAxisYLabel: "ערך הסחר (דולר)", chartAxisXLabel: "שנה",
        switchTitle: "החלפה בין המדינה המדווחת למדינה השותפה", countryWorld: "העולם",
        statExports: "יצוא", statImports: "יבוא", statBalance: "מאזן סחר", statTotal: "היקף סחר",
        statInYear: "בשנת {{year}}", statChange: "{{change}} לעומת {{year}}", showTable: "הצגת טבלת נתונים",
        optionSelectCountry: "בחרו מדינה...", optionTOTAL: "סך כל הסחר", optionAGRMULTI: "חקלאות ומזון",
        option25: "מלח, אבן ומלט", option27: "דלקים ושמנים", option71: "יהלומים, אבני חן ופנינים",
        option72: "ברזל ופלדה", option28: "כימיקלים אנאורגניים", option29: "כימיקלים אורגניים",
        option30: "תרופות ומוצרי פרמצבטיקה", option39: "פלסטיק ומוצריו", option64: "הנעלה",
        option61: "ביגוד סרוג", option62: "ביגוד שאינו סרוג", option84: "מכונות וציוד מכני",
        option85: "מכונות וציוד חשמלי", option87: "כלי רכב", option88: "כלי טיס וחלליות",
        option90: "מכשירים אופטיים, רפואיים ומדעיים", option94: "רהיטים, מצעים ותאורה",
        footerText: "© {{year}} לוח בקרה לסחר בינלאומי. כל הזכויות שמורות.",
        footerText2: "פותח במסגרת מטלה בקורס \"מדיניות החוץ של ישראל\" של ד\"ר ארז שושני, המרכז האקדמי רופין",
        footerText3: "הנתונים מגיעים ממאגר UN Comtrade של האו\"ם, והתרשימים נבנו בעזרת Chart.js. ייתכן שחלק מהנתונים אינם זמינים עבור מדינות או שנים מסוימות.",
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const $ = (id) => document.getElementById(id);
    const root = document.documentElement;
    const reportingCountrySelect = $('reportingCountry');
    const partnerCountrySelect = $('partnerCountry');
    const categorySelect = $('tradeCategory');
    const chartCanvas = $('tradeChart');
    const loadingIndicator = $('loadingIndicator');
    const errorDisplay = $('errorDisplay');
    const chartTitleElement = $('chartTitle');
    const startYearSelect = $('startYear');
    const endYearSelect = $('endYear');
    const themeToggle = $('themeToggle');
    const switchButton = $('switch');
    const statsSection = $('stats');
    const tableView = $('tableView');
    const tableBody = $('tableBody');
    const langButtons = { en: $('lang-en'), he: $('lang-he') };

    let currentLang = safeStorageGet(localStorage, 'lang') === 'he' ? 'he' : 'en';
    let countries = []; // from countries.json: { id, iso2, text }
    let chartInstance = null;
    // Processed data: { labels: [...years], imports: [...], exports: [...] }
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

    // Isolated names are for HTML text; the chart canvas gets plain names.
    function selectionNames(isolated = true) {
        const wrap = isolated ? isolate : (s) => s;
        return {
            reporter: wrap(selectedText(reportingCountrySelect)),
            partner: wrap(selectedText(partnerCountrySelect)),
            category: wrap(selectedText(categorySelect)),
        };
    }

    function setTitle(key, options = {}) {
        titleState = { key, options };
        chartTitleElement.textContent = getText(key, options);
    }

    function showLoading(isLoading) {
        loadingIndicator.style.display = isLoading ? 'flex' : 'none';
    }

    function showError(message) {
        errorDisplay.textContent = message || '';
        errorDisplay.style.display = message ? 'block' : 'none';
    }

    // Exact amounts (table, tooltip) look the same in both languages.
    const usdExact = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    const formatUsd = (v) => (v == null ? '—' : usdExact.format(v));

    // Short amounts: "$4.2B" in English, "4.2 מיליארד $" in Hebrew.
    const usdCompactEn = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 });
    const heNumber = new Intl.NumberFormat('he-IL', { maximumFractionDigits: 1 });
    const HE_UNITS = [[1e9, 'מיליארד'], [1e6, 'מיליון'], [1e3, 'אלף']];
    function formatCompact(v) {
        if (v == null) return '—';
        if (currentLang !== 'he') return usdCompactEn.format(v);
        const unit = HE_UNITS.find(([n]) => Math.abs(v) >= n);
        return unit ? `${heNumber.format(v / unit[0])} ${unit[1]} $` : `${heNumber.format(v)} $`;
    }

    // ---------- Language ----------

    function updateUIText() {
        const year = String(new Date().getFullYear());
        document.querySelectorAll('[data-translate-key]').forEach(el => {
            el.textContent = getText(el.getAttribute('data-translate-key'), { year });
        });
        document.querySelectorAll('[data-translate-title]').forEach(el => {
            el.title = getText(el.getAttribute('data-translate-title'));
            el.setAttribute('aria-label', el.title);
        });
        categorySelect.querySelectorAll('option').forEach(opt => {
            if (opt.value) opt.textContent = getText('option' + opt.value.replace(/[^a-zA-Z0-9]/g, ''));
        });
        [reportingCountrySelect, partnerCountrySelect].forEach(sel => {
            const ph = sel.querySelector('option[value=""]');
            if (ph) ph.textContent = getText('optionSelectCountry');
        });
        // The layout never mirrors; only text blocks marked data-dir switch direction.
        root.lang = currentLang;
        const dir = currentLang === 'he' ? 'rtl' : 'ltr';
        document.querySelectorAll('[data-dir]').forEach(el => { el.dir = dir; });
        renderCountryOptions();
        for (const [lang, btn] of Object.entries(langButtons)) {
            btn?.setAttribute('aria-pressed', String(lang === currentLang));
        }

        // Title, stats and chart depend on language but not on data, so no refetch is needed.
        setTitle(titleState.key, titleState.key === 'chartTitlePattern' ? selectionNames() : titleState.options);
        renderAll();
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
            countries = await response.json();
            renderCountryOptions();
            reportingCountrySelect.value = '376'; // Israel
            partnerCountrySelect.value = '31';    // Azerbaijan
            handleSelectionChange();
        } catch (error) {
            showError(getText('errorLoadingCountryList', { message: error.message }));
        }
    }

    function countryName(country, regionNames) {
        if (country.id === '0') return getText('countryWorld');
        if (currentLang === 'en' || !country.iso2) return country.text;
        return COUNTRY_NAME_OVERRIDES[currentLang]?.[country.iso2] ?? regionNames?.of(country.iso2) ?? country.text;
    }

    // (Re)build both country dropdowns in the current language, keeping the selection.
    function renderCountryOptions() {
        if (!countries.length) return;
        let regionNames = null;
        try { regionNames = new Intl.DisplayNames([currentLang], { type: 'region' }); } catch { /* old browser: English names */ }
        const list = countries
            .map(c => ({ id: c.id, name: countryName(c, regionNames) }))
            .sort((a, b) => (a.id === '0' ? -1 : b.id === '0' ? 1 : a.name.localeCompare(b.name, currentLang)));
        for (const select of [reportingCountrySelect, partnerCountrySelect]) {
            const selected = select.value;
            select.length = 1; // keep the placeholder
            list.forEach(c => select.add(new Option(c.name, c.id)));
            select.value = selected;
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
                currentSeries = null;
            } else {
                currentSeries = processData(rows);
                setTitle('chartTitlePattern', selectionNames());
            }
            renderAll();
        } catch (error) {
            if (error.name === 'AbortError') return;
            console.error('Fetch trade data error:', error);
            showError(getText('errorFetchTradeData', { message: error.message }));
            setTitle('chartTitleError');
            currentSeries = null;
            renderAll();
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

    // ---------- Stats & table ----------

    function renderAll() {
        renderStats();
        renderTable();
        renderChart();
    }

    function changeText(series, i, labels) {
        const cur = series[i], prev = series[i - 1];
        if (cur == null || !prev) return getText('statInYear', { year: labels[i] });
        const pct = ((cur - prev) / Math.abs(prev)) * 100;
        const arrow = pct >= 0 ? '▲' : '▼';
        return getText('statChange', { change: `${arrow} ${Math.abs(pct).toFixed(1)}%`, year: labels[i - 1] });
    }

    function renderStats() {
        statsSection.hidden = !currentSeries;
        if (!currentSeries) return;
        const { labels, imports, exports } = currentSeries;
        const i = labels.length - 1; // latest year with data
        const imp = imports[i], exp = exports[i];
        const balance = imp != null && exp != null ? exp - imp : null;
        const total = (imp ?? 0) + (exp ?? 0);
        const inYear = getText('statInYear', { year: labels[i] });

        $('statExports').textContent = formatCompact(exp);
        $('statExportsSub').textContent = changeText(exports, i, labels);
        $('statImports').textContent = formatCompact(imp);
        $('statImportsSub').textContent = changeText(imports, i, labels);
        $('statBalance').textContent = balance == null ? '—' : (balance > 0 ? '+' : '') + formatCompact(balance);
        $('statBalanceSub').textContent = inYear;
        $('statTotal').textContent = formatCompact(total);
        $('statTotalSub').textContent = inYear;
        for (const id of ['statExports', 'statImports', 'statBalance', 'statTotal']) {
            const el = $(id);
            el.title = el.textContent;
        }
    }

    function renderTable() {
        tableView.hidden = !currentSeries;
        tableBody.replaceChildren();
        if (!currentSeries) return;
        const { labels, imports, exports } = currentSeries;
        [...labels].reverse().forEach((year, r) => {
            const i = labels.length - 1 - r;
            const balance = imports[i] != null && exports[i] != null ? exports[i] - imports[i] : null;
            const tr = document.createElement('tr');
            [year, formatUsd(exports[i]), formatUsd(imports[i]), formatUsd(balance)].forEach(text => {
                const td = document.createElement('td');
                td.textContent = text;
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    }

    // ---------- Chart ----------

    // Chart colors come from the CSS theme tokens (styles.css), so light/dark live in one place.
    function getThemeColors() {
        const style = getComputedStyle(root);
        const css = (name) => style.getPropertyValue(name).trim();
        return {
            text: css('--text'),
            text2: css('--text-2'),
            grid: css('--grid'),
            surface: css('--surface'),
            border: css('--border'),
            exports: css('--series-exports'),
            imports: css('--series-imports'),
            font: css('--font'),
        };
    }

    // Vertical guide line at the hovered year.
    const crosshairPlugin = {
        id: 'crosshair',
        afterDatasetsDraw(chart) {
            const active = chart.tooltip?.getActiveElements?.() ?? [];
            if (!active.length) return;
            const { ctx, chartArea } = chart;
            const x = active[0].element.x;
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, chartArea.top);
            ctx.lineTo(x, chartArea.bottom);
            ctx.lineWidth = 1;
            ctx.strokeStyle = chart.options.scales.y.grid.color;
            ctx.stroke();
            ctx.restore();
        },
    };

    function renderChart() {
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }
        if (!currentSeries || typeof Chart === 'undefined') return;

        const t = getThemeColors();
        // The chart keeps the same left-to-right layout in both languages; only text direction changes.
        const textDirection = currentLang === 'he' ? 'rtl' : 'ltr';
        const { reporter } = selectionNames(false);
        const line = (label, data, color) => ({
            label,
            data,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2,
            tension: 0.25,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: color,
            pointBorderColor: t.surface,
            pointBorderWidth: 2,
            spanGaps: false,
        });

        try {
            chartInstance = new Chart(chartCanvas.getContext('2d'), {
                type: 'line',
                data: {
                    labels: currentSeries.labels,
                    datasets: [
                        line(getText('chartLegendExports', { reporter }), currentSeries.exports, t.exports),
                        line(getText('chartLegendImports', { reporter }), currentSeries.imports, t.imports),
                    ],
                },
                plugins: [crosshairPlugin],
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    font: { family: t.font },
                    color: t.text2,
                    layout: { padding: { top: 4 } },
                    plugins: {
                        legend: {
                            position: 'top',
                            align: 'start',
                            textDirection,
                            labels: { color: t.text2, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, boxHeight: 8, padding: 16, font: { family: t.font, size: 12 } },
                        },
                        tooltip: {
                            rtl: textDirection === 'rtl',
                            textDirection,
                            backgroundColor: t.surface,
                            titleColor: t.text,
                            bodyColor: t.text2,
                            borderColor: t.border,
                            borderWidth: 1,
                            padding: 12,
                            cornerRadius: 10,
                            boxPadding: 6,
                            usePointStyle: true,
                            titleFont: { family: t.font, weight: '600' },
                            bodyFont: { family: t.font },
                            callbacks: {
                                label: (ctx) => ` ${ctx.dataset.label}: ${formatUsd(ctx.parsed.y)}`,
                            },
                        },
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            border: { color: t.border },
                            ticks: { color: t.text2, font: { family: t.font } },
                        },
                        y: {
                            beginAtZero: true,
                            grid: { color: t.grid },
                            border: { display: false },
                            title: { display: true, text: getText('chartAxisYLabel'), color: t.text2, font: { family: t.font, size: 12 } },
                            ticks: { color: t.text2, font: { family: t.font }, maxTicksLimit: 6, callback: formatCompact },
                        },
                    },
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
            showLoading(false);
            showError(getText('errorSameCountry'));
            currentSeries = null;
            setTitle('errorInvalidSelection');
            renderAll();
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

    // ---------- Theme (initial class is set by an inline script in <head>) ----------

    function syncThemeButton() {
        themeToggle?.setAttribute('aria-pressed', String(root.classList.contains('dark')));
    }

    themeToggle?.addEventListener('click', () => {
        const isDark = !root.classList.contains('dark');
        root.classList.toggle('dark', isDark);
        safeStorageSet(localStorage, 'darkModeEnabled', String(isDark));
        syncThemeButton();
        renderChart(); // getComputedStyle already sees the new theme tokens
    });

    // ---------- Init ----------

    syncThemeButton();
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

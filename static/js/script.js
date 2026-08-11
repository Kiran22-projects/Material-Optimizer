
let availableProperties = [];

let currentResults = null;




const standardSelect =
    document.getElementById("standardSelect");

const familySelect =
    document.getElementById("familySelect");

const propertyChecklist =
    document.getElementById("propertyChecklist");

const targetInputs =
    document.getElementById("targetInputs");

const xAxisSelect =
    document.getElementById("xAxisSelect");

const yAxisSelect =
    document.getElementById("yAxisSelect");

const findMaterialsBtn =
    document.getElementById("findMaterialsBtn");

const resetBtn =
    document.getElementById("resetBtn");

const errorMsg =
    document.getElementById("errorMsg");

const materialsEvaluated =
    document.getElementById("materialsEvaluated");

const resultsTableHead =
    document.getElementById("resultsTableHead");

const resultsTableBody =
    document.getElementById("resultsTableBody");

const topMaterialsList =
    document.getElementById("topMaterialsList");

const ashbyChart =
    document.getElementById("ashbyChart");

const chartTitle =
    document.getElementById("chartTitle");

const propertyCount =
    document.getElementById("propertyCount");


/* ============================================================
   MATERIAL FAMILY DISPLAY COLORS
============================================================ */

const familyColors = {

    "Ferrous": "#ef4444",

    "Non-Ferrous": "#2563eb",

    "Polymer": "#9333ea",

    "Composite": "#f59e0b",

    "Ceramic": "#14b8a6",

    "Other": "#64748b"

};


/* ============================================================
   PAGE INITIALIZATION
============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        loadProperties();

    }
);


/* ============================================================
   LOAD AVAILABLE NUMERICAL PROPERTIES
============================================================ */

async function loadProperties() {

    try {

        propertyChecklist.innerHTML = `
            <div class="loading-message">
                Loading properties...
            </div>
        `;


        const response =
            await fetch("/api/properties");


        if (!response.ok) {

            throw new Error(
                "Unable to load material properties."
            );

        }


        const data =
            await response.json();


        availableProperties =
            data.properties || [];


        propertyCount.textContent =
            availableProperties.length;


        if (availableProperties.length === 0) {

            propertyChecklist.innerHTML = `
                <div class="empty-message">
                    No numerical properties were found
                    in the material database.
                </div>
            `;

            return;
        }


        buildPropertyChecklist();

        buildAxisSelectors();


    }

    catch (error) {

        console.error(
            "Property loading error:",
            error
        );


        propertyChecklist.innerHTML = `
            <div class="empty-message">
                Failed to load properties.
            </div>
        `;


        showError(
            "Could not load material properties. " +
            "Check the Flask terminal for errors."
        );

    }

}


/* ============================================================
   CREATE PROPERTY CHECKBOXES
============================================================ */

function buildPropertyChecklist() {

    propertyChecklist.innerHTML = "";


    availableProperties.forEach(
        function (property, index) {


            const label =
                document.createElement("label");


            label.className =
                "property-item";


            const checkbox =
                document.createElement("input");


            checkbox.type =
                "checkbox";


            checkbox.className =
                "property-checkbox";


            checkbox.value =
                property;


            /*
             * Select the first two properties
             * automatically so the application
             * has something ready for testing.
             *
             * The user can uncheck them.
             */

            if (index < 2) {

                checkbox.checked =
                    true;

                label.classList.add(
                    "selected"
                );

            }


            const propertyName =
                document.createElement("span");


            propertyName.className =
                "property-name";


            propertyName.textContent =
                property;


            label.appendChild(
                checkbox
            );


            label.appendChild(
                propertyName
            );


            /*
             * Checkbox change event
             */

            checkbox.addEventListener(
                "change",
                function () {


                    if (checkbox.checked) {

                        label.classList.add(
                            "selected"
                        );

                    }

                    else {

                        label.classList.remove(
                            "selected"
                        );

                    }


                    rebuildTargetInputs();

                }
            );


            propertyChecklist.appendChild(
                label
            );

        }
    );


    rebuildTargetInputs();

}


/* ============================================================
   GET SELECTED PROPERTIES
============================================================ */

function getSelectedProperties() {

    const checkedBoxes =
        document.querySelectorAll(
            ".property-checkbox:checked"
        );


    return Array.from(
        checkedBoxes
    ).map(
        function (checkbox) {

            return checkbox.value;

        }
    );

}


/* ============================================================
   CREATE TARGET VALUE INPUTS
============================================================ */

function rebuildTargetInputs() {

    /*
     * Save existing values before rebuilding.
     */

    const oldValues = {};


    document.querySelectorAll(
        ".target-input"
    ).forEach(
        function (input) {

            oldValues[
                input.dataset.property
            ] = input.value;

        }
    );


    const selectedProperties =
        getSelectedProperties();


    /*
     * No selected properties
     */

    if (
        selectedProperties.length === 0
    ) {

        targetInputs.innerHTML = `
            <div class="empty-message">
                Select properties above
                to enter target values.
            </div>
        `;

        return;
    }


    targetInputs.innerHTML = "";


    selectedProperties.forEach(
        function (property) {


            const row =
                document.createElement("div");


            row.className =
                "target-row";


            /*
             * Label
             */

            const label =
                document.createElement("label");


            label.className =
                "target-label";


            label.textContent =
                property;


            /*
             * Input
             */

            const input =
                document.createElement("input");


            input.type =
                "number";


            input.step =
                "any";


            input.className =
                "target-input";


            input.dataset.property =
                property;


            input.placeholder =
                "Value";


            /*
             * Restore previous value
             */

            if (
                Object.prototype.hasOwnProperty.call(
                    oldValues,
                    property
                )
            ) {

                input.value =
                    oldValues[property];

            }


            row.appendChild(
                label
            );


            row.appendChild(
                input
            );


            targetInputs.appendChild(
                row
            );

        }
    );

}


/* ============================================================
   BUILD ASHBY X/Y AXIS SELECTORS
============================================================ */

function buildAxisSelectors() {

    xAxisSelect.innerHTML = "";

    yAxisSelect.innerHTML = "";


    availableProperties.forEach(
        function (property) {


            const xOption =
                document.createElement("option");


            xOption.value =
                property;


            xOption.textContent =
                property;


            xAxisSelect.appendChild(
                xOption
            );


            const yOption =
                document.createElement("option");


            yOption.value =
                property;


            yOption.textContent =
                property;


            yAxisSelect.appendChild(
                yOption
            );

        }
    );


    /*
     * Prefer Density (Ro) for X axis
     * when available.
     */

    if (
        availableProperties.includes("Ro")
    ) {

        xAxisSelect.value =
            "Ro";

    }


    /*
     * Prefer Yield Strength (Sy)
     * for Y axis.
     */

    if (
        availableProperties.includes("Sy")
    ) {

        yAxisSelect.value =
            "Sy";

    }

    else if (
        availableProperties.includes("Su")
    ) {

        yAxisSelect.value =
            "Su";

    }


    updateChartTitle();

}


/* ============================================================
   UPDATE CHART TITLE
============================================================ */

function updateChartTitle() {

    const x =
        xAxisSelect.value || "X";

    const y =
        yAxisSelect.value || "Y";


    chartTitle.textContent =
        `${y} vs ${x}`;

}


/* ============================================================
   AXIS CHANGE EVENTS
============================================================ */

xAxisSelect.addEventListener(
    "change",
    updateChartTitle
);


yAxisSelect.addEventListener(
    "change",
    updateChartTitle
);


/* ============================================================
   FIND MATERIALS BUTTON
============================================================ */

findMaterialsBtn.addEventListener(
    "click",
    optimizeMaterials
);


/* ============================================================
   MAIN OPTIMIZATION FUNCTION
============================================================ */

async function optimizeMaterials() {

    hideError();


    /*
     * Get selected properties
     */

    const selectedProperties =
        getSelectedProperties();


    /*
     * Validate properties
     */

    if (
        selectedProperties.length === 0
    ) {

        showError(
            "Please select at least one material property."
        );

        return;
    }


    /*
     * Collect target values
     */

    const targets = {};


    for (
        const property of selectedProperties
    ) {


        const input =
            document.querySelector(
                `.target-input[data-property="${escapeSelector(property)}"]`
            );


        if (!input) {

            showError(
                `Target input for ${property} was not found.`
            );

            return;
        }


        const value =
            input.value.trim();


        /*
         * Empty value
         */

        if (value === "") {

            showError(
                `Please enter a target value for ${property}.`
            );

            input.focus();

            return;
        }


        /*
         * Convert to number
         */

        const numericValue =
            Number(value);


        if (
            !Number.isFinite(numericValue)
        ) {

            showError(
                `Invalid target value for ${property}.`
            );

            input.focus();

            return;
        }


        targets[property] =
            numericValue;

    }


    /*
     * Axis selections
     */

    const xAxis =
        xAxisSelect.value;


    const yAxis =
        yAxisSelect.value;


    /*
     * Prepare request
     *
     * These values correspond directly
     * to the Flask /optimize endpoint.
     */

    const payload = {

        standard:
            standardSelect.value,

        family:
            familySelect.value,

        properties:
            selectedProperties,

        targets:
            targets,

        x_axis:
            xAxis,

        y_axis:
            yAxis

    };


    console.log(
        "Optimization request:",
        payload
    );


    /*
     * Show loading state
     */

    setButtonLoading(
        true
    );


    try {


        /*
         * Send request to Flask
         */

        const response =
            await fetch(
                "/optimize",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


        /*
         * Convert response to JSON
         */

        const data =
            await response.json();


        console.log(
            "Optimization response:",
            data
        );


        /*
         * Flask returned an error
         */

        if (!response.ok) {

            throw new Error(
                data.error ||
                `Server error: ${response.status}`
            );

        }


        /*
         * Save result
         */

        currentResults =
            data;


        /*
         * Display table
         */

        displayResults(
            data,
            selectedProperties
        );


        /*
         * Display top 10 list
         */

        displayTopMaterials(
            data.top_materials || []
        );


        /*
         * Display Ashby chart
         */

        displayAshbyChart(
            data,
            xAxis,
            yAxis
        );


    }

    catch (error) {

        console.error(
            "Optimization error:",
            error
        );


        showError(
            error.message ||
            "Unable to calculate material recommendations."
        );

    }

    finally {

        setButtonLoading(
            false
        );

    }

}


/* ============================================================
   DISPLAY RESULTS TABLE
============================================================ */

function displayResults(
    data,
    selectedProperties
) {

    const materials =
        data.top_materials || [];


    /*
     * Number of materials evaluated
     */

    materialsEvaluated.textContent =
        data.materials_evaluated ?? 0;


    /*
     * Clear existing table header
     */

    resultsTableHead.innerHTML = "";


    /*
     * Rank
     */

    addTableHeader(
        "Rank"
    );


    /*
     * Material
     */

    addTableHeader(
        "Material"
    );


    /*
     * Family
     */

    addTableHeader(
        "Family"
    );


    /*
     * Selected properties
     */

    selectedProperties.forEach(
        function (property) {

            addTableHeader(
                property
            );

        }
    );


    /*
     * Distance
     */

    addTableHeader(
        "Distance"
    );


    /*
     * Similarity
     */

    addTableHeader(
        "Similarity %"
    );


    /*
     * No materials
     */

    if (
        materials.length === 0
    ) {

        resultsTableBody.innerHTML = `
            <tr>
                <td
                    colspan="${selectedProperties.length + 5}"
                    class="table-empty">

                    No materials were found
                    for the selected filters.

                </td>
            </tr>
        `;

        return;
    }


    /*
     * Clear table body
     */

    resultsTableBody.innerHTML = "";


    /*
     * Create each material row
     */

    materials.forEach(
        function (material, index) {


            const row =
                document.createElement("tr");


            /*
             * Highlight Rank 1
             */

            if (
                index === 0
            ) {

                row.classList.add(
                    "top-ranked"
                );

            }


            /*
             * Rank
             */

            const rankCell =
                document.createElement("td");


            rankCell.className =
                "rank-cell";


            rankCell.textContent =
                material.rank;


            row.appendChild(
                rankCell
            );


            /*
             * Material name
             */

            const materialCell =
                document.createElement("td");


            materialCell.className =
                "material-cell";


            materialCell.textContent =
                material.material;


            row.appendChild(
                materialCell
            );


            /*
             * Family
             */

            const familyCell =
                document.createElement("td");


            const familyBadge =
                document.createElement("span");


            familyBadge.className =
                "family-badge";


            familyBadge.textContent =
                material.family;


            /*
             * Give family badge
             * the corresponding color.
             */

            const familyColor =
                getFamilyColor(
                    material.family
                );


            familyBadge.style.color =
                familyColor;


            familyBadge.style.border =
                `1px solid ${familyColor}40`;


            familyBadge.style.background =
                `${familyColor}12`;


            familyCell.appendChild(
                familyBadge
            );


            row.appendChild(
                familyCell
            );


            /*
             * Properties
             */

            selectedProperties.forEach(
                function (property) {


                    const cell =
                        document.createElement("td");


                    const value =
                        material.properties
                            ? material.properties[property]
                            : null;


                    if (
                        value === null ||
                        value === undefined ||
                        Number.isNaN(value)
                    ) {

                        cell.textContent =
                            "—";

                    }

                    else {

                        cell.textContent =
                            formatNumber(value);

                    }


                    row.appendChild(
                        cell
                    );

                }
            );


            /*
             * Similarity Distance
             */

            const distanceCell =
                document.createElement("td");


            distanceCell.className =
                "distance-cell";


            distanceCell.textContent =
                formatNumber(
                    material.distance,
                    4
                );


            row.appendChild(
                distanceCell
            );


            /*
             * Similarity %
             */

            const similarityCell =
                document.createElement("td");


            similarityCell.className =
                "similarity-cell";


            similarityCell.textContent =
                `${formatNumber(material.similarity, 2)}%`;


            row.appendChild(
                similarityCell
            );


            resultsTableBody.appendChild(
                row
            );

        }
    );

}


/* ============================================================
   ADD TABLE HEADER
============================================================ */

function addTableHeader(
    text
) {

    const th =
        document.createElement("th");


    th.textContent =
        text;


    resultsTableHead.appendChild(
        th
    );

}


/* ============================================================
   DISPLAY TOP MATERIALS
============================================================ */

function displayTopMaterials(
    materials
) {

    if (
        !materials ||
        materials.length === 0
    ) {

        topMaterialsList.innerHTML = `
            <div class="top-empty">
                No recommended materials found.
            </div>
        `;

        return;
    }


    topMaterialsList.innerHTML = "";


    materials.forEach(
        function (material, index) {


            const item =
                document.createElement("div");


            item.className =
                "top-material-item";


            if (
                index === 0
            ) {

                item.classList.add(
                    "first"
                );

            }


            /*
             * Rank circle
             */

            const rank =
                document.createElement("div");


            rank.className =
                "rank-circle";


            rank.textContent =
                material.rank;


            /*
             * Material name
             */

            const name =
                document.createElement("div");


            name.className =
                "top-material-name";


            name.textContent =
                material.material;


            name.title =
                material.material;


            /*
             * Similarity percentage
             */

            const similarity =
                document.createElement("div");


            similarity.className =
                "top-material-similarity";


            similarity.textContent =
                `${formatNumber(
                    material.similarity,
                    2
                )}%`;


            /*
             * Assemble item
             */

            item.appendChild(
                rank
            );


            item.appendChild(
                name
            );


            item.appendChild(
                similarity
            );


            topMaterialsList.appendChild(
                item
            );

        }
    );

}


/* ============================================================
   ASHBY CHART
============================================================ */

function displayAshbyChart(
    data,
    xAxis,
    yAxis
) {

    /*
     * Update title
     */

    chartTitle.textContent =
        `${yAxis} vs ${xAxis}`;


    /*
     * Get chart data
     */

    const chartData =
        data.chart || {};


    const byFamily =
        chartData.by_family || {};


    const topMaterials =
        chartData.top || [];


    /*
     * Create Plotly traces
     */

    const traces = [];


    /*
     * Display each family
     * as a separate trace.
     */

    Object.keys(byFamily).forEach(
        function (family) {


            const materials =
                byFamily[family] || [];


            if (
                materials.length === 0
            ) {

                return;

            }


            const xValues =
                materials.map(
                    material => material.x
                );


            const yValues =
                materials.map(
                    material => material.y
                );


            const names =
                materials.map(
                    material => material.material
                );


            const color =
                getFamilyColor(
                    family
                );


            traces.push({

                x:
                    xValues,

                y:
                    yValues,

                text:
                    names,

                name:
                    family,

                type:
                    "scatter",

                mode:
                    "markers",

                marker: {

                    size: 8,

                    color:
                        color,

                    opacity: 0.65,

                    line: {

                        width: 0.5,

                        color:
                            "#ffffff"

                    }

                },

                hovertemplate:
                    "<b>%{text}</b>" +
                    "<br>" +
                    `${xAxis}: %{x}` +
                    "<br>" +
                    `${yAxis}: %{y}` +
                    "<extra>" +
                    `${family}` +
                    "</extra>"

            });

        }
    );


    /*
     * Create lookup for Top 10
     */

    const topNames =
        new Set(
            topMaterials.map(
                material =>
                    material.material
            )
        );


    /*
     * Highlight Top 10
     */

    if (
        topMaterials.length > 0
    ) {


        const topX =
            topMaterials.map(
                material =>
                    material.x
            );


        const topY =
            topMaterials.map(
                material =>
                    material.y
            );


        const topText =
            topMaterials.map(
                material =>
                    `Rank ${material.rank}: ${material.material}`
            );


        const topRank =
            topMaterials.map(
                material =>
                    `#${material.rank}`
            );


        traces.push({

            x:
                topX,

            y:
                topY,

            text:
                topText,

            customdata:
                topRank,

            name:
                "Top 10",

            type:
                "scatter",

            mode:
                "markers+text",

            textposition:
                "top center",

            textfont: {

                size: 9,

                color:
                    "#111827"

            },

            marker: {

                size: 14,

                color:
                    "#f59e0b",

                symbol:
                    "star",

                line: {

                    width: 2,

                    color:
                        "#111827"

                }

            },

            hovertemplate:
                "<b>%{text}</b>" +
                "<br>" +
                `${xAxis}: %{x}` +
                "<br>" +
                `${yAxis}: %{y}` +
                "<extra>Top 10</extra>"

        });

    }


    /*
     * If there is no chart data
     */

    if (
        traces.length === 0
    ) {

        ashbyChart.innerHTML = `
            <div class="chart-placeholder">

                <div>
                    📈
                </div>

                <p>
                    No chart data available
                    for the selected properties.
                </p>

            </div>
        `;

        return;
    }


    /*
     * Plotly layout
     */

    const layout = {

        margin: {

            l: 65,

            r: 20,

            t: 15,

            b: 55

        },


        paper_bgcolor:
            "#ffffff",


        plot_bgcolor:
            "#fbfcfe",


        hovermode:
            "closest",


        legend: {

            orientation:
                "h",

            y:
                1.02,

            x:
                0,

            font: {

                size: 9

            }

        },


        xaxis: {

            title: {

                text:
                    xAxis,

                font: {

                    size: 10

                }

            },

            tickfont: {

                size: 8

            },

            gridcolor:
                "#e5e7eb",

            zeroline:
                false

        },


        yaxis: {

            title: {

                text:
                    yAxis,

                font: {

                    size: 10

                }

            },

            tickfont: {

                size: 8

            },

            gridcolor:
                "#e5e7eb",

            zeroline:
                false

        }

    };


    /*
     * Plotly configuration
     */

    const config = {

        responsive:
            true,

        displaylogo:
            false,

        modeBarButtonsToRemove: [

            "lasso2d",

            "select2d"

        ]

    };


    /*
     * Draw chart
     */

    Plotly.newPlot(
        ashbyChart,
        traces,
        layout,
        config
    );

}


/* ============================================================
   FAMILY COLOR
============================================================ */

function getFamilyColor(
    family
) {

    return (
        familyColors[family]
        ||
        familyColors["Other"]
    );

}


/* ============================================================
   NUMBER FORMATTING
============================================================ */

function formatNumber(
    value,
    decimals = 2
) {

    const numericValue =
        Number(value);


    if (
        !Number.isFinite(
            numericValue
        )
    ) {

        return "—";

    }


    return numericValue.toLocaleString(
        undefined,
        {
            maximumFractionDigits:
                decimals
        }
    );

}


/* ============================================================
   BUTTON LOADING STATE
============================================================ */

function setButtonLoading(
    loading
) {

    if (loading) {

        findMaterialsBtn.disabled =
            true;


        findMaterialsBtn.dataset.originalText =
            findMaterialsBtn.innerHTML;


        findMaterialsBtn.innerHTML = `
            <span class="loading-spinner"></span>
            CALCULATING...
        `;

    }

    else {

        findMaterialsBtn.disabled =
            false;


        findMaterialsBtn.innerHTML =
            findMaterialsBtn.dataset.originalText
            ||
            "🔍 FIND MATERIALS";

    }

}


/* ============================================================
   ERROR DISPLAY
============================================================ */

function showError(
    message
) {

    errorMsg.textContent =
        message;


    errorMsg.classList.add(
        "show"
    );


    /*
     * Scroll the error into view
     * when necessary.
     */

    errorMsg.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });

}


/* ============================================================
   HIDE ERROR
============================================================ */

function hideError() {

    errorMsg.textContent =
        "";


    errorMsg.classList.remove(
        "show"
    );

}


/* ============================================================
   RESET APPLICATION
============================================================ */

resetBtn.addEventListener(
    "click",
    function () {

        resetApplication();

    }
);


function resetApplication() {

    /*
     * Reset standard
     */

    standardSelect.value =
        "ANSI";


    /*
     * Reset family
     */

    familySelect.value =
        "All";


    /*
     * Uncheck all properties
     */

    document.querySelectorAll(
        ".property-checkbox"
    ).forEach(
        function (checkbox) {

            checkbox.checked =
                false;


            const parent =
                checkbox.closest(
                    ".property-item"
                );


            if (parent) {

                parent.classList.remove(
                    "selected"
                );

            }

        }
    );


    /*
     * Clear target values
     */

    rebuildTargetInputs();


    /*
     * Reset chart

     */

    clearResults();


    /*
     * Clear error

     */

    hideError();


    /*
     * Reset axis defaults
     */

    buildAxisSelectors();

}


/* ============================================================
   CLEAR RESULTS
============================================================ */

function clearResults() {

    currentResults =
        null;


    materialsEvaluated.textContent =
        "—";


    /*
     * Reset table
     */

    resultsTableHead.innerHTML = `
        <th>Rank</th>
        <th>Material</th>
        <th>Family</th>
    `;


    resultsTableBody.innerHTML = `
        <tr>

            <td colspan="3"
                class="table-empty">

                Run
                <strong>Find Materials</strong>
                to see results.

            </td>

        </tr>
    `;


    /*
     * Reset top materials
     */

    topMaterialsList.innerHTML = `
        <div class="top-empty">
            Results will appear here.
        </div>
    `;


    /*
     * Reset chart
     */

    ashbyChart.innerHTML = `
        <div class="chart-placeholder">

            <div>
                📈
            </div>

            <p>
                Run Find Materials to
                generate the Ashby chart.
            </p>

        </div>
    `;


    chartTitle.textContent =
        "Material Property Comparison";

}




function escapeSelector(
    value
) {

    /*
     * CSS.escape is supported by modern
     * browsers, but this fallback makes
     * the application safer.
     */

    if (
        window.CSS &&
        typeof window.CSS.escape === "function"
    ) {

        return window.CSS.escape(
            value
        );

    }


    return value.replace(
        /([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g,
        "\\$1"
    );

}
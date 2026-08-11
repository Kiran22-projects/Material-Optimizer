# ============================================================
# MATERIAL OPTIMIZER
# Flask Backend
#
# Workflow:
# CSV Database
#      ↓
# Standard Filter
#      ↓
# Material Family Filter
#      ↓
# Selected Properties
#      ↓
# Normalize Database
#      ↓
# Normalize Target
#      ↓
# Euclidean Distance
#      ↓
# Rank
#      ↓
# Top 10 Materials
#      ↓
# Ashby Chart Data
# ============================================================


# ============================================================
# IMPORT LIBRARIES
# ============================================================

from flask import Flask, render_template, jsonify, request

import pandas as pd

import numpy as np

import re

import os


# ============================================================
# CREATE FLASK APPLICATION
# ============================================================

app = Flask(__name__)


# ============================================================
# LOAD MATERIAL DATABASE
# ============================================================

CSV_PATH = os.path.join(
    os.path.dirname(__file__),
    "materials.csv"
)


try:

    df = pd.read_csv(CSV_PATH)

except Exception as error:

    raise RuntimeError(
        f"Could not load materials.csv: {error}"
    )


# ============================================================
# BASIC DATABASE VALIDATION
# ============================================================

if "Material" not in df.columns:

    raise ValueError(
        "The materials.csv file must contain "
        "a 'Material' column."
    )


NAME_COL = "Material"


# ============================================================
# MATERIAL STANDARD
#
# Your database uses the column:
#
#     Std
#
# The application supports:
#
#     ANSI
#     All Standards
# ============================================================

STANDARD_COL = None


if "Std" in df.columns:

    STANDARD_COL = "Std"

elif "Standard" in df.columns:

    STANDARD_COL = "Standard"


HAS_STANDARD_COL = (
    STANDARD_COL is not None
)


# ============================================================
# MATERIAL FAMILY
#
# If Family already exists in CSV, use it.
#
# Otherwise derive Family from Material name.
# ============================================================

HAS_FAMILY_COL = (
    "Family" in df.columns
)


# ============================================================
# NON-PROPERTY COLUMNS
#
# These columns are not used as material
# property candidates.
# ============================================================

NON_PROPERTY_COLUMNS = {

    "Std",

    "Standard",

    "ID",

    "Material",

    "Family"

}


# ============================================================
# DETERMINE NUMERICAL MATERIAL PROPERTIES
#
# Only numerical CSV columns are considered.
#
# Example:
#
# Su
# Sy
# A5
# Bhn
# E
# G
# mu
# Ro
# ============================================================

NUMERIC_PROPERTIES = [

    column

    for column
    in df.select_dtypes(
        include=np.number
    ).columns.tolist()

    if column not in NON_PROPERTY_COLUMNS

]


# ============================================================
# FAMILY CLASSIFICATION KEYWORDS
# ============================================================

FAMILY_KEYWORDS = {

    "Ferrous": [

        "steel",

        "iron",

        "stainless"

    ],


    "Non-Ferrous": [

        "aluminum",

        "aluminium",

        "copper",

        "brass",

        "bronze",

        "titanium",

        "magnesium",

        "zinc",

        "nickel",

        "muntz"

    ],


    "Polymer": [

        "nylon",

        "pvc",

        "abs",

        "polymer",

        "plastic",

        "peek",

        "delrin",

        "acetal",

        "polycarbonate",

        "pom",

        "polyethylene",

        "polypropylene"

    ],


    "Composite": [

        "composite",

        "carbon fiber",

        "carbon-fiber",

        "fiberglass",

        "frp",

        "cfrp",

        "gfrp"

    ],


    "Ceramic": [

        "ceramic",

        "alumina",

        "zirconia",

        "silicon carbide",

        "sic"

    ]

}


# ============================================================
# COPPER UNS CODE
#
# Examples:
#
# C99300
# C28000
# ============================================================

UNS_COPPER_PATTERN = re.compile(
    r"\bC\d{5}\b"
)


# ============================================================
# CLASSIFY MATERIAL FAMILY
# ============================================================

def classify_family(
    material_name
):

    name = str(
        material_name
    ).lower()


    for family, keywords in FAMILY_KEYWORDS.items():

        for keyword in keywords:

            if keyword in name:

                return family


    if UNS_COPPER_PATTERN.search(
        str(material_name)
    ):

        return "Non-Ferrous"


    return "Other"


# ============================================================
# CREATE FAMILY COLUMN IF NECESSARY
# ============================================================

if not HAS_FAMILY_COL:

    df["Family"] = df[
        NAME_COL
    ].apply(
        classify_family
    )


# ============================================================
# CREATE STANDARD COLUMN IF NECESSARY
# ============================================================

if not HAS_STANDARD_COL:

    df["Standard"] = "N/A"

    STANDARD_COL = "Standard"


# ============================================================
# PAGE ROUTE
# ============================================================

@app.route("/")
def index():

    return render_template(
        "index.html"
    )


# ============================================================
# API — AVAILABLE PROPERTIES
# ============================================================

@app.route(
    "/api/properties",
    methods=["GET"]
)
def api_properties():

    return jsonify({

        "properties":
            NUMERIC_PROPERTIES,

        "total_materials":
            int(df.shape[0]),

        "standard_filter_available":
            HAS_STANDARD_COL,

        "standard_column":
            STANDARD_COL,

        "family_source":
            (
                "csv_column"
                if HAS_FAMILY_COL
                else "derived_from_name"
            )

    })


# ============================================================
# API — MATERIAL OPTIMIZATION
# ============================================================

@app.route(
    "/optimize",
    methods=["POST"]
)
def optimize():

    try:

        # ====================================================
        # READ REQUEST
        # ====================================================

        payload = request.get_json(
            force=True
        )


        if payload is None:

            return jsonify({

                "error":
                    "No JSON data was received."

            }), 400


        # ====================================================
        # GET USER INPUT
        # ====================================================

        standard = payload.get(
            "standard",
            "All"
        )


        family = payload.get(
            "family",
            "All"
        )


        selected_properties = payload.get(
            "properties",
            []
        )


        target_values = payload.get(
            "targets",
            {}
        )


        x_axis = payload.get(
            "x_axis"
        )


        y_axis = payload.get(
            "y_axis"
        )


        # ====================================================
        # VALIDATE PROPERTIES
        # ====================================================

        if not selected_properties:

            return jsonify({

                "error":
                    "Select at least one material property."

            }), 400


        invalid_properties = [

            property_name

            for property_name
            in selected_properties

            if property_name
            not in NUMERIC_PROPERTIES

        ]


        if invalid_properties:

            return jsonify({

                "error":
                    "Unknown properties: "
                    f"{invalid_properties}"

            }), 400


        # ====================================================
        # VALIDATE TARGET VALUES
        # ====================================================

        missing_targets = [

            property_name

            for property_name
            in selected_properties

            if property_name
            not in target_values

        ]


        if missing_targets:

            return jsonify({

                "error":
                    "Missing target values for: "
                    f"{missing_targets}"

            }), 400


        # ====================================================
        # COPY ORIGINAL DATABASE
        # ====================================================

        filtered_df = df.copy()


        # ====================================================
        # STEP 1 — STANDARD FILTER
        #
        # IMPORTANT:
        #
        # Your CSV uses "Std".
        #
        # Therefore we use STANDARD_COL instead
        # of hard-coding "Standard".
        # ====================================================

        if (
            HAS_STANDARD_COL
            and standard != "All"
        ):

            filtered_df = filtered_df[
                filtered_df[
                    STANDARD_COL
                ].astype(str).str.strip()
                == str(standard).strip()
            ]


        # ====================================================
        # STEP 2 — MATERIAL FAMILY FILTER
        # ====================================================

        if family != "All":

            filtered_df = filtered_df[
                filtered_df["Family"]
                == family
            ]


        # ====================================================
        # NUMBER OF MATERIALS AFTER FILTERING
        # ====================================================

        materials_evaluated = int(
            filtered_df.shape[0]
        )


        # ====================================================
        # NO MATERIALS AFTER FILTER
        # ====================================================

        if materials_evaluated == 0:

            return jsonify({

                "materials_evaluated":
                    0,

                "top_materials":
                    [],

                "chart": {

                    "by_family":
                        {},

                    "top":
                        []

                },

                "x_axis":
                    x_axis,

                "y_axis":
                    y_axis

            })


        # ====================================================
        # STEP 3 — SELECT MATERIAL PROPERTIES
        # ====================================================

        comparison_df = filtered_df[
            selected_properties
        ].copy()


        # ====================================================
        # REMOVE ROWS WITH MISSING SELECTED PROPERTIES
        # ====================================================

        valid_mask = (
            comparison_df.notna().all(
                axis=1
            )
        )


        comparison_df = comparison_df[
            valid_mask
        ]


        # ====================================================
        # KEEP SAME INDEX IN ORIGINAL FILTERED DATA
        # ====================================================

        filtered_valid_df = filtered_df.loc[
            comparison_df.index
        ].copy()


        # ====================================================
        # CHECK WHETHER ANY MATERIALS REMAIN
        # ====================================================

        if comparison_df.empty:

            return jsonify({

                "materials_evaluated":
                    materials_evaluated,

                "top_materials":
                    [],

                "chart": {

                    "by_family":
                        {},

                    "top":
                        []

                },

                "x_axis":
                    x_axis,

                "y_axis":
                    y_axis

            })


        # ====================================================
        # STEP 4 — MIN-MAX NORMALIZATION
        #
        # Same mathematical method as your
        # existing Material Optimizer algorithm.
        #
        # normalized =
        #
        # (value - minimum)
        # ------------------
        # (maximum - minimum)
        # ====================================================

        property_ranges = {}


        for property_name in selected_properties:

            minimum = comparison_df[
                property_name
            ].min()


            maximum = comparison_df[
                property_name
            ].max()


            property_ranges[
                property_name
            ] = (
                minimum,
                maximum
            )


            if maximum != minimum:

                comparison_df[
                    property_name
                ] = (

                    comparison_df[
                        property_name
                    ] - minimum

                ) / (

                    maximum - minimum

                )

            else:

                comparison_df[
                    property_name
                ] = 0


        # ====================================================
        # STEP 5 — NORMALIZE TARGET
        # ====================================================

        normalized_target = {}


        for property_name in selected_properties:

            minimum, maximum = (
                property_ranges[
                    property_name
                ]
            )


            try:

                raw_target = float(
                    target_values[
                        property_name
                    ]
                )

            except (
                TypeError,
                ValueError
            ):

                return jsonify({

                    "error":
                        f"Invalid target value "
                        f"for {property_name}."

                }), 400


            if maximum != minimum:

                normalized_value = (

                    raw_target - minimum

                ) / (

                    maximum - minimum

                )

            else:

                normalized_value = 0


            normalized_target[
                property_name
            ] = normalized_value


        # ====================================================
        # STEP 6 — CREATE TARGET ARRAY
        # ====================================================

        target_array = np.array([

            normalized_target[
                property_name
            ]

            for property_name
            in selected_properties

        ])


        # ====================================================
        # CREATE MATERIAL PROPERTY ARRAY
        # ====================================================

        material_array = (
            comparison_df[
                selected_properties
            ].values
        )


        # ====================================================
        # STEP 7 — EUCLIDEAN DISTANCE
        #
        # Existing algorithm:
        #
        # distance =
        # sqrt(
        #   sum(
        #      (material - target)^2
        #   )
        # )
        # ====================================================

        differences = (
            material_array
            - target_array
        )


        distances = np.sqrt(
            np.sum(
                differences ** 2,
                axis=1
            )
        )


        # ====================================================
        # STORE DISTANCE
        # ====================================================

        comparison_df[
            "Similarity Distance"
        ] = distances


        filtered_valid_df[
            "Similarity Distance"
        ] = distances


        # ====================================================
        # STEP 8 — RANK MATERIALS
        #
        # Smallest distance = best match.
        # ====================================================

        ranked_materials = (
            filtered_valid_df
            .sort_values(
                by="Similarity Distance",
                ascending=True
            )
            .copy()
        )


        ranked_materials.insert(
            0,
            "Rank",
            range(
                1,
                len(ranked_materials) + 1
            )
        )


        # ====================================================
        # STEP 9 — TOP 10
        # ====================================================

        top_materials = (
            ranked_materials
            .head(10)
            .copy()
        )


        # ====================================================
        # STEP 10 — SIMILARITY %
        #
        # Preserve the existing logic:
        #
        # similarity =
        # (1 - distance / max_distance) * 100
        # ====================================================

        max_distance = (
            ranked_materials[
                "Similarity Distance"
            ].max()
        )


        if max_distance > 0:

            top_materials[
                "Similarity (%)"
            ] = (

                1
                - (
                    top_materials[
                        "Similarity Distance"
                    ]
                    / max_distance
                )

            ) * 100

        else:

            top_materials[
                "Similarity (%)"
            ] = 100


        # ====================================================
        # ROUND DISPLAY VALUES
        # ====================================================

        top_materials[
            "Similarity Distance"
        ] = top_materials[
            "Similarity Distance"
        ].round(4)


        top_materials[
            "Similarity (%)"
        ] = top_materials[
            "Similarity (%)"
        ].round(2)


        # ====================================================
        # STEP 11 — BUILD TOP MATERIAL JSON
        # ====================================================

        top_list = []


        for _, row in top_materials.iterrows():

            properties = {}


            for property_name in selected_properties:

                value = row[
                    property_name
                ]


                if pd.isna(value):

                    properties[
                        property_name
                    ] = None

                else:

                    properties[
                        property_name
                    ] = float(value)


            top_list.append({

                "rank":
                    int(row["Rank"]),

                "material":
                    str(row[NAME_COL]),

                "family":
                    str(row["Family"]),

                "properties":
                    properties,

                "distance":
                    float(
                        row[
                            "Similarity Distance"
                        ]
                    ),

                "similarity":
                    float(
                        row[
                            "Similarity (%)"
                        ]
                    )

            })


        # ====================================================
        # STEP 12 — ASHBY CHART DATA
        # ====================================================

        chart_by_family = {}


        if (
            x_axis in filtered_valid_df.columns
            and
            y_axis in filtered_valid_df.columns
        ):


            chart_df = (
                filtered_valid_df
                .dropna(
                    subset=[
                        x_axis,
                        y_axis
                    ]
                )
            )


            for family_name, group in (
                chart_df.groupby(
                    "Family"
                )
            ):


                chart_by_family[
                    str(family_name)
                ] = []


                for _, row in group.iterrows():

                    chart_by_family[
                        str(family_name)
                    ].append({

                        "x":
                            float(
                                row[x_axis]
                            ),

                        "y":
                            float(
                                row[y_axis]
                            ),

                        "material":
                            str(
                                row[NAME_COL]
                            )

                    })


            # =================================================
            # TOP 10 CHART POINTS
            # =================================================

            chart_top = []


            for _, row in top_materials.iterrows():

                if (
                    pd.notna(
                        row[x_axis]
                    )
                    and
                    pd.notna(
                        row[y_axis]
                    )
                ):

                    chart_top.append({

                        "x":
                            float(
                                row[x_axis]
                            ),

                        "y":
                            float(
                                row[y_axis]
                            ),

                        "material":
                            str(
                                row[NAME_COL]
                            ),

                        "rank":
                            int(
                                row["Rank"]
                            )

                    })

        else:

            chart_top = []


        # ====================================================
        # FINAL JSON RESPONSE
        # ====================================================

        return jsonify({

            "materials_evaluated":
                materials_evaluated,

            "top_materials":
                top_list,

            "chart": {

                "by_family":
                    chart_by_family,

                "top":
                    chart_top

            },

            "x_axis":
                x_axis,

            "y_axis":
                y_axis,

            "standard_filter_applied":
                (
                    HAS_STANDARD_COL
                    and standard != "All"
                ),

            "family_filter_applied":
                (
                    family != "All"
                )

        })


    # ========================================================
    # ERROR HANDLING
    # ========================================================

    except Exception as error:

        print(
            "\n======================================"
        )

        print(
            "OPTIMIZATION ERROR:"
        )

        print(
            str(error)
        )

        print(
            "======================================\n"
        )


        return jsonify({

            "error":
                str(error)

        }), 500


# ============================================================
# RUN APPLICATION
# ============================================================

if __name__ == "__main__":

    app.run(
        debug=True
    )
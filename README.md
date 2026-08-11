# Material Optimizer

### Material Selection & Comparison Web Application

Material Optimizer is a web-based engineering application for selecting and comparing materials based on user-defined material property requirements.

The application uses a material database and calculates material similarity using normalized material properties and Euclidean distance.

## 🚀 Live Demo

👉 **[Open Material Optimizer](https://material-optimizer-1.onrender.com/)**

## Features

- Material Standard filtering
- Material Family filtering
- Dynamic material property selection
- Dynamic target value inputs
- Min-Max normalization
- Euclidean distance-based material similarity
- Top 10 recommended materials
- Similarity percentage
- Interactive Ashby-style material chart
- Material comparison table

## Technology Stack

### Backend
- Python
- Flask
- Pandas
- NumPy
- Gunicorn

### Frontend
- HTML
- CSS
- JavaScript
- Plotly.js

### Database

- CSV-based material database
- 621 materials
- Material properties including:
  - Su
  - Sy
  - A5
  - Bhn
  - E
  - G
  - μ
  - Ro

## Material Selection Workflow

```text
User Requirements
        ↓
Material Standard Filter
        ↓
Material Family Filter
        ↓
Property Selection
        ↓
Target Values
        ↓
Min-Max Normalization
        ↓
Euclidean Distance
        ↓
Material Ranking
        ↓
Top 10 Materials
        ↓
Ashby Chart

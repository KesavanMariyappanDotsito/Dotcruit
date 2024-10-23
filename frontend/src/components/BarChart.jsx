import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS } from "chart.js/auto";

function BarChart({ chartData, options, barHeight }) {

    return <div
        style={{ height: barHeight }}
    >
        <Bar data={chartData} options={options} />
    </div>;
}

export default BarChart;
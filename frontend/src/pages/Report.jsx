import React, { useState, useEffect } from 'react';
import { Card, CardContent, Grid, Typography, Box } from '@mui/material';
import BarChart from '../components/BarChart';
import axios from 'axios';

const Report = () => {
    const [reportData, setReportData] = useState([]);
    const [hrNames, setHrNames] = useState([]);
    const [userData, setUserData] = useState({
        labels: [],
        datasets: []
    });

    useEffect(() => {
        const fetchFormFields = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URI}/candidate/`);
                const fields = response.data.fields;
                setReportData(fields);

                const uniqueHrNames = Array.from(new Set(fields.map((data) => data.hrName)));
                setHrNames(uniqueHrNames);
            } catch (error) {
                console.error('Error fetching form fields:', error);
            }
        };

        fetchFormFields();
    }, []);

    useEffect(() => {
        if (hrNames.length > 0) {
            setUserData({
                labels: hrNames,
                datasets: [
                    {
                        label: "New Entries",
                        data: hrNames.map((hrName) => calculateStatusCounts(hrName, "New")),
                        backgroundColor: "#2196F3",
                        borderColor: "#1976D2",
                        borderWidth: 1,
                    },
                    {
                        label: "Confirmed Entries",
                        data: hrNames.map((hrName) => calculateStatusCounts(hrName, "Submitted")),
                        backgroundColor: "#388E3C",
                        borderColor: "#388E3C",
                        borderWidth: 1,
                    },
                    {
                        label: "Failed Entries",
                        data: hrNames.map((hrName) => calculateStatusCounts(hrName, "Error")),
                        backgroundColor: "tomato",
                        borderColor: "#1976D2",
                        borderWidth: 1,
                    },
                    {
                        label: "Pending Interviews",
                        data: hrNames.map((hrName) => calculateStatusCounts(hrName, "Processing")),
                        backgroundColor: "orange",
                        borderColor: "#1976D2",
                        borderWidth: 1,
                    },
                    {
                        label: "Onboarded",
                        data: hrNames.map((hrName) => calculateStatusCounts(hrName, "Onboarded")),
                        backgroundColor: "#ffd700",
                        borderColor: "#ffd700",
                        borderWidth: 1,
                    },
                    {
                        label: "Rejected",
                        data: hrNames.map((hrName) => calculateStatusCounts(hrName, "Rejected")),
                        backgroundColor: "#F44336",
                        borderColor: "#D32F2F",
                        borderWidth: 1,
                    },
                ],
            });
        }
    }, [hrNames]);

    const calculateStatusCounts = (hrName, status) => {
        const tempStatus = status?.split(',');
        return reportData.filter((data) => data.hrName === hrName && tempStatus.includes(data.status)).length;
    };
    const chartOptions = {
        chart: {
            type: 'bar',
            height: '200px',
        },
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'HR Names',
                    color: '#333',
                    font: {
                        size: 14,
                    },
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Count of Candidates',
                    color: '#333',
                    font: {
                        size: 14,
                    },
                },
                // ticks: {
                //     callback: function (value) {
                //         return Number.isInteger(value) ? value : value.toFixed(0);
                //     }
                // },
                beginAtZero: true,
            },
        },
        layout: {
            padding: 20,
        },
    };

    return (
        <Box padding={2}>
            <Grid container spacing={3}>
                <Grid item xs={12} md={12}>
                    <Card elevation={3} sx={{ backgroundColor: '#FAFAFA' }} >
                        <CardContent>
                            <Typography variant="h6" component="div" sx={{ marginBottom: 2, fontWeight: 'bold' }}>
                                HR Status Overview
                            </Typography>
                            {userData.labels.length > 0 && (
                                <BarChart chartData={userData} options={chartOptions} barHeight='600px' />
                            )}
                        </CardContent>
                    </Card>
                </Grid>

            </Grid>
        </Box>
    );
};

export default Report;
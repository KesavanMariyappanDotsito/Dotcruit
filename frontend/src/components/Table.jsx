import * as React from 'react';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { toNormalString } from '../utils/ToNormalString';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { CircularProgress, IconButton, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import toast from 'react-hot-toast';

export default function Table() {
    const [tableViewArr, setTableViewArr] = useState([]);
    const [columns, setColumns] = useState([]);
    const [rows, setRows] = useState([]);
    const navigate = useNavigate();

    // Fetch form fields on initial render
    useEffect(() => {
        const fetchFormFields = async () => {
            try {
                const responseForm = await axios.get(`${process.env.REACT_APP_API_URI}/formfields`);
                const tableViewArray = responseForm.data?.fields?.filter((field) => {
                    return field.tableView == 1;
                }).map((value) => {
                    return value.key;
                });

                setTableViewArr(tableViewArray);
            } catch (error) {
                console.error('Error fetching form fields:', error);
            }
        };

        fetchFormFields();
    }, []); // Empty dependency array ensures this only runs on mount

    useEffect(() => {
        if (tableViewArr.length > 0) {
            const fetchCandidates = async () => {
                try {
                    const response = await axios.get(`${process.env.REACT_APP_API_URI}/candidate`);
                    const data = response.data.fields;
                    setRows(data);

                    // Generate columns
                    const generatedColumns = tableViewArr.map((key) => ({
                        field: key,
                        headerName: toNormalString(key),
                        width: 150,
                    }));

                    generatedColumns.push({
                        field: 'Retry',
                        headerName: ' ',
                        width: 1,
                        sortable: false,
                        renderCell: (params) => (
                            <IconButton
                                onClick={() => retryButtonClick(params.row.id)}
                                color="primary"
                            >
                                <ChangeCircleIcon />
                            </IconButton>
                        ),
                    });

                    // Add the edit and delete icon columns
                    generatedColumns.push({
                        field: 'edit',
                        headerName: ' ',
                        width: 1,
                        sortable: false,
                        renderCell: (params) => (
                            <IconButton
                                onClick={() => handleEditClick(params.row.id)}
                                color="info"
                            >
                                <EditIcon />
                            </IconButton>
                        ),
                    });
                    generatedColumns.push({
                        field: 'delete',
                        headerName: ' ',
                        width: 1,
                        sortable: false,
                        renderCell: (params) => (
                            <IconButton
                                onClick={() => handleDeleteClick(params.row.id)}
                                color="error"
                            >
                                <DeleteIcon />
                            </IconButton>
                        ),
                    });


                    setColumns(generatedColumns);
                } catch (error) {
                    console.error('Error fetching candidates:', error);
                }
            };

            fetchCandidates();
        }
    }, [tableViewArr]); // Runs only when tableViewArr changes


    const handleEditClick = (id) => {
        // Navigate to the edit page with the selected row ID
        navigate(`/editcandidate/${id}`);
    };

    const handleDeleteClick = async (id) => {
        try {
            // Make a DELETE request to the server
            await axios.delete(`${process.env.REACT_APP_API_URI}/candidate/${id}`);
            // Refresh the data after deletion
            setRows(prevRows => prevRows.filter(row => row.id !== id));
            toast.success('Deleted Successfully')
        } catch (error) {
            console.error('Error deleting candidate:', error);
        }
    };

    const retryButtonClick = async (id) => {
        try {
            // Make a DELETE request to the server
            await axios.get(`${process.env.REACT_APP_API_URI}/api/automation/${id}`);
            toast.success('Manually Triggered!')
            // Refresh the data after deletion

        } catch (error) {
            console.error('Error retrying candidate:', error);
            toast.error('Trigger Error')
        }
    }

    return (
        <Box sx={{ height: 500, width: '100%' }}>

            {columns.length > 0 ?
                (
                    <>
                        <Typography variant="h4" align="center" gutterBottom>
                            Submitted Candidate Applications
                        </Typography><br />
                        <DataGrid
                            rows={rows}
                            columns={columns}
                            initialState={{
                                pagination: {
                                    paginationModel: {
                                        pageSize: 10,
                                    },
                                },
                            }}
                            pageSizeOptions={[10]}
                            disableRowSelectionOnClick
                        />
                    </>
                ) : (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            height: '50vh',
                        }}
                    >
                        <CircularProgress />
                    </Box>
                )}
        </Box>
    );
}

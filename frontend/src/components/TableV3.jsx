import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { AgGridReact } from '@ag-grid-community/react';
import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-quartz.css';
import { StrictMode, useMemo, useState } from 'react';
import * as React from 'react';
import Box from '@mui/material/Box';
import { DataGrid } from '@mui/x-data-grid';
import { useEffect } from 'react';
import axios from 'axios';
import { toNormalString } from '../utils/ToNormalString';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { CircularProgress, IconButton, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import toast from 'react-hot-toast';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    ExclamationCircleOutlined,
    MinusCircleOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import { Divider, Flex, Tag } from 'antd';
import { Login, PanoramaWideAngleSharp } from '@mui/icons-material';

ModuleRegistry.registerModules([ClientSideRowModelModule]);

const gridDiv = document.querySelector('#myGrid');

const GridExample = ({ filter }) => {
    const [count, setCount] = useState(0)
    const [triggerOnce, setTriggerOnce] = useState([])

    const defaultColDef = useMemo(() => {
        return {
            filter: 'agTextColumnFilter',
            floatingFilter: true,
        };
    }, []);

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
                    return { key: value.key, header: value.label };
                });

                setTableViewArr(tableViewArray);
            } catch (error) {
                console.error('Error fetching form fields:', error);
            }
        };

        fetchFormFields();
    }, [count, triggerOnce]); // Empty dependency array ensures this only runs on mount

    useEffect(() => {

        if (tableViewArr.length > 0) {

            const fetchCandidates = async () => {
                try {
                    let table = filter === 'Schedule Job Log' ? 'schedulejob' : 'candidate'
                    const response = await axios.get(`${process.env.REACT_APP_API_URI}/${table}/filter/${filter}`);
                    const data = response.data.fields;
                    setRows(data);


                    // Generate columns
                    const generatedColumns = tableViewArr.map((key) => (
                        {
                            field: key.key,
                            headerName: key.header,
                        }
                    ));
                    generatedColumns[0].pinned = 'left'
                    generatedColumns.push({
                        field: 'status',
                        headerName: 'Status',
                        pinned: "right",
                        // cellEditor: 'agRichSelectCellEditor',
                        // cellEditorParams: {
                        //     values: ['New','Error','Submitted','Rejected','Processing','Onboarded'],
                        // },
                        cellRenderer: (params) => (
                            <>
                                {params.data.status === 'Processing' ? (
                                    <Tag icon={<SyncOutlined spin />} color="processing">
                                        {params.data.status}
                                    </Tag>
                                ) : (params.data.status === 'Submitted' || params.data.status === 'Onboarded') ? (
                                    <Tag icon={<CheckCircleOutlined />} color="success">
                                        {params.data.status}
                                    </Tag>
                                ) :
                                    params.data.status === 'New' ? (
                                        <Tag icon={<ClockCircleOutlined />} color="default">
                                            {params.data.status}
                                        </Tag>
                                    )
                                        : (
                                            <Tag icon={<CloseCircleOutlined />} color="error">
                                                {params.data.status}
                                            </Tag>
                                        )}
                            </>

                        ),
                    });

                    generatedColumns.push({
                        field: 'Retry',
                        headerName: 'Actions',
                        width: 160,
                        sortable: false,
                        filter: '',
                        floatingFilter: false,
                        pinned: "right",
                        cellRenderer: (params) => (
                            <>
                                {(params.data.status == 'New' || params.data.status == 'Error') && (
                                <IconButton
                                    onClick={() => retryButtonClick(params.data.id)}
                                    color="primary"
                                    disabled={triggerOnce.includes(params.data.id) || params.data.isProcessing}
                                >
                                    <ChangeCircleIcon />
                                </IconButton>
                                )}

                                <IconButton
                                    onClick={() => handleEditClick(params.data.id)}
                                    color="info"
                                >
                                    <EditIcon />
                                </IconButton>
                                <IconButton
                                    onClick={() => handleDeleteClick(params.data.id)}
                                    color="error"
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </>
                        ),
                    });

                    setColumns(generatedColumns);
                } catch (error) {
                    console.error('Error fetching candidates:', error);
                }
            };

            fetchCandidates();
        }
    }, [tableViewArr, filter, count]); // Runs only when tableViewArr changes


    const handleEditClick = (id) => {

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
            await axios.get(`${process.env.REACT_APP_API_URI}/api/automation/${id}`).then(() => {
                toast.success('Manually Triggered!')
                setCount(count + 1)
                setTriggerOnce([...triggerOnce, id])
            });

            // Refresh the data after deletion

        } catch (error) {
            console.error('Error retrying candidate:', error);
            toast.error('Trigger Error')
        }
    }

    return (
        <div
            className={
                "ag-theme-quartz"
            }
            style={{ height: 590 }}
        >
            <AgGridReact
                rowData={rows}
                columnDefs={columns}
                defaultColDef={defaultColDef}
                rowSelection="multiple"
                suppressRowClickSelection={true}
                pagination={true}
                paginationPageSize={10}
                paginationPageSizeSelector={[10, 25, 50]}
            />
        </div>
    );
};


const TableV3 = ({ filter }) => {
    return (
        <div><GridExample filter={filter} /></div>
    )
}

export default TableV3
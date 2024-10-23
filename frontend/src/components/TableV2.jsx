import React, { useState, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
// import { CustomerService } from './service/CustomerService'; // Adjust according to your service location
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import axios from 'axios';
import { toNormalString } from '../utils/ToNormalString';
import { useNavigate } from 'react-router-dom';


export default function Table1() {
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [columns, setColumns] = useState([]);
    const [globalFilterValue, setGlobalFilterValue] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchFormFields = async () => {
            try {
                const responseForm = await axios.get('http://localhost:8000/formfields');
                const tableViewArray = responseForm.data?.fields?.filter((field) => {
                    return field.tableView == 1;
                }).map((value) => {
                    return value.key;
                });

                setColumns(tableViewArray.map((key) => ({
                    field: key,
                    header: toNormalString(key),
                    sortable: true,
                    filter: true,
                    style: { minWidth: '150px' }
                })));

                setColumns((prevColumns) => [
                    ...prevColumns,
                    {
                        field: 'retry',
                        header: '',
                        body: retryButtonTemplate,
                        style: { width: '1rem' }
                    },
                    {
                        field: 'edit',
                        header: '',
                        body: editButtonTemplate,
                        style: { width: '1rem' }
                    },
                    {
                        field: 'delete',
                        header: '',
                        body: deleteButtonTemplate,
                        style: { width: '1rem' }
                    }
                ]);
            } catch (error) {
                console.error('Error fetching form fields:', error);
            }
        };

        fetchFormFields();
    }, []);

    useEffect(() => {
        const fetchCandidates = async () => {
            try {
                const response = await axios.get('http://localhost:8000/candidate');
                const data = response.data.fields;
                setRows(data);
            } catch (error) {
                console.error('Error fetching candidates:', error);
            }
        };

        fetchCandidates();
    }, []);

    const retryButtonTemplate = (rowData) => {
        return (
            <Button
                icon="pi pi-refresh"
                className="p-button-text"
                onClick={() => retryButtonClick(rowData.id)}
            />
        );
    };

    const editButtonTemplate = (rowData) => {
        return (
            <Button
                icon="pi pi-pencil"
                className="p-button-text"
                onClick={() => handleEditClick(rowData.id)}
            />
        );
    };

    const deleteButtonTemplate = (rowData) => {
        return (
            <Button
                icon="pi pi-trash"
                className="p-button-text"
                severity="danger"
                onClick={() => handleDeleteClick(rowData.id)}
            />
        );
    };

    const handleEditClick = (id) => {
        navigate(`/editcandidate/${id}`);
    };

    const handleDeleteClick = async (id) => {
        try {
            await axios.delete(`http://localhost:8000/candidate/${id}`);
            setRows(prevRows => prevRows.filter(row => row.id !== id));
            console.log('Deleted Successfully');
        } catch (error) {
            console.error('Error deleting candidate:', error);
        }
    };

    const retryButtonClick = async (id) => {
        try {
            await axios.get(`http://localhost:8000/api/automation/${id}`);
        } catch (error) {
            console.error('Error retrying candidate:', error);
        }
    };

    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        setGlobalFilterValue(value);
    };

    const renderHeader = () => {
        return (
            <div className="flex justify-content-between">
                <IconField iconPosition="left">
                    <InputIcon className="pi pi-search" />
                    <InputText value={globalFilterValue} onChange={onGlobalFilterChange} placeholder="Keyword Search" />
                </IconField>
            </div>
        );
    };

    const header = renderHeader();

    return (
        <div className="card">
            <DataTable
                value={rows}
                paginator
                rows={10}
                loading={loading}
                globalFilterFields={columns.map(col => col.field)}
                header={header}
                responsiveLayout="scroll"
            >
                {columns.map(col => (
                    <Column key={col.field} field={col.field} header={col.header} sortable={col.sortable} filter={col.filter} style={col.style} />
                ))}
            </DataTable>
        </div>
    );
}

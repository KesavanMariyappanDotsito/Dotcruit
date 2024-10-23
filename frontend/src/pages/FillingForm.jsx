import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { TextField, Select, MenuItem, InputLabel, FormControl, Button, Grid, Typography, Box, TextareaAutosize, Autocomplete, Snackbar, Alert, CircularProgress, Card } from '@mui/material';
import { UploadOutlined } from '@ant-design/icons';
import { Upload, Switch } from 'antd';
import AntDButton from 'antd/lib/button';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AuthContext } from '../context/AuthContext';
import { getCurrentDate } from '../utils/getCurrentDate';

const FillingForm = ({ isUpdate }) => {
    const { id } = useParams();
    const [fields, setFields] = useState([]);
    const [formValues, setFormValues] = useState({});
    const [errors, setErrors] = useState({});
    const [filteredFields, setFilteredFields] = useState(fields);
    const [snackbar, setSnackBar] = useState("")
    const navigate = useNavigate()
    const { user } = useContext(AuthContext)
    const [scriptList, setScriptList] = useState([])

    const handleAddOption = async (key, newOption) => {
        try {
            await axios.patch(`${process.env.REACT_APP_API_URI}/formfields/autocomplete/edit/`, { fieldKey: key, option: newOption });
        } catch (error) {
            console.error('Error updating autocomplete :', error);
        }
    };

    const handlePortalChange = (event, portal) => {
        const selectedPortal = event?.target?.value || portal;

        const newFilteredFields = fields.filter(field => {
            return field.portalRelation === 'common' || field.portalRelation.split(',').includes(selectedPortal);
        }).map((field) => {
            return {
                ...field,
                mandatory: (field.portalMandatory === 'common' || field.portalMandatory.split(',').includes(selectedPortal)) ? 1 : 0
            }
        });

        setFilteredFields(newFilteredFields);
    };

    // useEffect(() => {
    //     const scriptCall = async () => {
    //         const res = await axios.get(`${process.env.REACT_APP_API_URI}/api/script/`);
    //         setScriptList(res.data.fields);
    //     }
    //     scriptCall();
    // })


    useEffect(() => {
        const fetchFormFields = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URI}/formfields`);
                setFields(response.data.fields);
                setFilteredFields(response.data.fields);
            } catch (error) {
                console.error('Error fetching form fields:', error);
            }
        };

        const fetchFieldValues = async (id) => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URI}/candidate/${id}`);
                const fieldData = response.data.fields[0];
                setFormValues(fieldData);
            } catch (error) {
                console.error('Error fetching form values:', error);
            }
        };

        fetchFormFields();

        if (isUpdate && id) {
            fetchFieldValues(id);
            handlePortalChange(null, formValues.portal);
        } else {
            setFormValues({});
        }
    }, [isUpdate, id]);

    useEffect(() => {
        if (isUpdate) {
            handlePortalChange(null, formValues.portal)
        }

    }, [filteredFields])

    const handleInputChange = (key, value, inputType, regex) => {
        // Validate if regex exists and apply the validation
        if (regex && value && !new RegExp(regex).test(value)) {
            setErrors(prevErrors => ({
                ...prevErrors,
                [key]: `Invalid value for ${key}`
            }));
        } else {
            setErrors(prevErrors => ({
                ...prevErrors,
                [key]: ''
            }));
        }

        if (inputType === 'aadhaar') {
            setFormValues(prevValues => ({
                ...prevValues,
                [key]: value.replace(/(\d{4})(?=\d)/g, '$1 ')?.trim(),
            }));
        } else {
            setFormValues(prevValues => ({
                ...prevValues,
                [key]: value?.trim(),
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        filteredFields.forEach(field => {
            const { key, regex, mandatory } = field;
            const value = formValues[key];

            
            if (mandatory && !value) {
                newErrors[key] = `${key} is required`;
            }

            if (regex && value && !new RegExp(regex).test(value)) {
                newErrors[key] = `Invalid value for ${key}`;
            }
        });

        setErrors(newErrors);
        
        console.log(Object.keys(newErrors).length === 0);

        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        // console.log(JSON.stringify(formValues, null, 2));

        // Reset the resume field if it's empty
        if (!formValues.resume) {
            setFormValues({
                ...formValues,
                resume: ''
            });
        }
        if (!formValues.isPreviousEmployee) {
            setFormValues({
                ...formValues,
                isPreviousEmployee: '0'
            });
        }
        if (!formValues.isAnyRelative) {
            setFormValues({
                ...formValues,
                isAnyRelative: '0'
            });
        }

        if (validateForm()) {
            try {
                if (isUpdate && id) {
                    formValues.updatedAt = getCurrentDate();
                    await axios.put(`${process.env.REACT_APP_API_URI}/candidate/${id}`, formValues);
                    toast.success('Updated Successfully!');
                    navigate(-1);
                } else {
                    await axios.post(`${process.env.REACT_APP_API_URI}/submitform`, { ...formValues, status: 'New' });
                    toast.success('Submitted Successfully');
                    navigate('/new-entries');
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                toast.error('Error submitting form');
            }
        }
        else {
            toast.error('Form validation failed!')
        }
    };

    const renderField = (field) => {
        const { key, label, type, options, disabled, inputType, regex } = field;
        const gridItemProps = { xs: 12, sm: 6 }; // Default grid item properties

        if (type === 'textarea') {
            gridItemProps.xs = 12; // Make the textarea span the full width
        }

        switch (type) {
            case 'textbox':
                if (inputType === 'systemName' && !isUpdate) {
                    formValues[key] = user?.displayName;
                }
                if (key === 'createdAt' && !isUpdate) {
                    formValues[key] = getCurrentDate();
                }
                return (
                    <Grid item {...gridItemProps} key={key}>
                        <TextField
                            label={label}
                            id={key}
                            variant="outlined"
                            fullWidth
                            disabled={disabled === "1"}
                            required={field.mandatory === 1}
                            value={formValues[key] || ''}
                            error={!!errors[key]}
                            helperText={errors[key]}
                            onChange={(e) => handleInputChange(key, e.target.value, inputType, regex)}
                        />
                    </Grid>
                );

            case 'textarea':
                return (
                    <Grid item xs={12} key={key}>
                        <InputLabel>{field.mandatory === 1 ? label + '*' : label}</InputLabel>
                        <TextareaAutosize
                            minRows={10}
                            onChange={(e) => handleInputChange(key, e.target.value, inputType, regex)}
                            style={{ width: '100%' }}
                            id={key}
                            value={formValues[key] || ''}
                            fullWidth
                            disabled={disabled === "1"}
                            required={field.mandatory === 1}
                        />
                    </Grid>
                );

            case 'switch':
                return (
                    <Grid item {...gridItemProps} key={key}>
                        <InputLabel>{field.mandatory === 1 ? label + '*' : label}</InputLabel>
                        <Switch id={key} onChange={(checked) => {
                            checked = checked === true ? 1 : 0;
                            handleInputChange(key, checked.toString());
                        }} defaultChecked={formValues[key] === '1'} />
                    </Grid>
                );

            case 'select':
                return (
                    <Grid item {...gridItemProps} key={key}>
                        <FormControl fullWidth variant="outlined" error={!!errors[key]}>
                            <InputLabel>{field.mandatory === 1 ? label + '*' : label}</InputLabel>
                            <Select
                                id={key}
                                label={label}
                                disabled={disabled === "1"}
                                required={field.mandatory === 1}
                                value={formValues[key] || ''}
                                onChange={(e) => {
                                    handleInputChange(key, e.target.value, '', regex);
                                    if (key === 'portal') handlePortalChange(e);
                                }}
                            >
                                {options.split(',').map(option => (
                                    <MenuItem key={option} value={option}>
                                        {option.charAt(0).toUpperCase() + option.slice(1).replaceAll('#', ',')}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors[key] && <Typography color="error">{errors[key]}</Typography>}
                        </FormControl>
                    </Grid>
                );

            case 'multiselect':
                let optionAC = options.split(',');
                return (
                    <Grid item {...gridItemProps} key={key}>
                        <Autocomplete
                            multiple
                            freeSolo
                            options={optionAC}
                            id={key}
                            value={formValues[key]?.split(',') || []}
                            renderInput={(params) => (
                                <TextField
                                    id={key}
                                    {...params}
                                    label={label}
                                    placeholder={key}
                                />

                            )}
                            onChange={(event, newValue, reason) => {
                                handleAddOption(key, newValue[newValue.length - 1]);
                                const valuesAC = newValue.map(option => option).join(',');
                                handleInputChange(key, valuesAC);
                            }}
                            sx={{ width: '100%' }}
                        />
                    </Grid>
                );

            case 'fileupload':
                const decodedFilename = decodeURIComponent(formValues[key + "Url"]?.match(/[^/]+$/)[0]);
                return (
                    <Grid item {...gridItemProps} key={key}>
                        <InputLabel>{field.mandatory === 1 ? label + '*' : label}</InputLabel>
                        <Upload
                            action={`${process.env.REACT_APP_API_URI}/api/file-upload`}
                            listType="picture"
                            maxCount={1}
                            id={key}
                            accept={inputType === 'image' ? 'image/*' : '*'}
                            onChange={({ file }) => {
                                if (file.status === 'done') {
                                    const filePath = file.response?.path;
                                    const fileUrl = file.response?.url
                                    if (filePath) handleInputChange(key, filePath);
                                    if (fileUrl) handleInputChange(key + 'Url', fileUrl)
                                }
                            }}
                            defaultFileList={formValues[key + "Url"] && [{ url: formValues[key + "Url"], name: decodedFilename }] || []}
                            onRemove={() => handleInputChange(key, '')}
                        >
                            <AntDButton icon={<UploadOutlined />} disabled={disabled === "1"} >
                                Upload {label}
                            </AntDButton>
                        </Upload>
                    </Grid>
                );

            default:
                return null;
        }
    };

    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
            <form onSubmit={handleSubmit}>
                {filteredFields.length > 0 ? (
                    <Grid container spacing={3}>
                        <Grid item sm={7}>
                            <Card style={{ padding: '30px' }} sx={{ backgroundColor: '#fafafa' }}>
                                <Typography variant="h4" align="center" gutterBottom>
                                    {isUpdate ? "Update Candidate" : "New Candidate"}
                                </Typography><br />
                                <Grid container spacing={2}>
                                    {filteredFields.map(field => renderField(field))}
                                </Grid>
                                <br />
                                <Button type="submit" variant="contained" color="primary" fullWidth>
                                    {isUpdate ? "Update" : "Submit"}
                                </Button>
                            </Card>
                        </Grid>
                        <Grid item sm={5}>
                            <img src="https://dotsito.s3.ap-south-1.amazonaws.com/HR+Portal+Flow.png" alt="" style={{ width: '100%' }} />

                        </Grid>
                    </Grid>
                ) : (
                    <CircularProgress />
                )}
            </form>
        </Box>
    );
};

export default FillingForm;
// src/pages/ATSChecker.jsx
import React, { useState } from 'react';
import { Button, TextField, Typography } from '@mui/material';
import axios from 'axios';
import './AtsChecker.css'; // Import your CSS file
import { Margin } from '@mui/icons-material';

const AtsChecker = ({
  apiEndpoint = `${process.env.REACT_APP_API_URI}/api/auth/atschecker`,
  title = "ATS Resume Checker",
  nameLabel = "Candidate's Name",
  jobDescriptionLabel = "Job Description",
  resumeLabel = "Upload Resume",
  buttonText = "Submit",
  responseTitle = "Evaluation Result",
  scoreTitle = "Match Score",
  styles = {},
}) => {
  const [name, setName] = useState(''); 
  const [jobDescription, setJobDescription] = useState(''); 
  const [resume, setResume] = useState(null); 
  const [response, setResponse] = useState(''); 

  const handleResumeUpload = (event) => {
    setResume(event.target.files[0]);
  };

  const handleNameChange = (event) => {
    setName(event.target.value);
  };

  const handleJobDescriptionChange = (event) => {
    setJobDescription(event.target.value);
  };

  const handleSubmit = async () => {
    if (!name || !jobDescription || !resume) {
      alert('Please provide the name, job description, and upload a resume.');
      return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('jobDescription', jobDescription);
    formData.append('resume', resume);

    try {
      const res = await axios.post(apiEndpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResponse(res.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div className={`ats-resume-expert ${styles.container || ''}`}>
      <h1 className={`title ${styles.title || ''}`}>{title}</h1>

      <TextField
        className={`input-field ${styles.inputField || ''}`}
        style={{ marginTop: "10px" }}
        label={nameLabel}
        variant="outlined"
        value={name}
        onChange={handleNameChange}
        fullWidth
        required
      />

      <TextField
        className={`input-field ${styles.inputField || ''}`}
        label={jobDescriptionLabel}
        variant="outlined"
        value={jobDescription}
        onChange={handleJobDescriptionChange}
        multiline
        rows={4}
        fullWidth
        required
      />

      <div className={`file-upload ${styles.fileUpload || ''}`}>
        <label>{resumeLabel}</label>
        <input
          type="file"
          accept=".pdf, .doc, .docx"
          onChange={handleResumeUpload}
          required
        />
        {resume && <p>Uploaded Resume: {resume.name}</p>}
      </div>

      <Button
        className={`submit-button ${styles.submitButton || ''}`}
        variant="contained"
        color="primary"
        onClick={handleSubmit}
      >
        {buttonText}
      </Button>

      {response && (
        <div className={`response ${styles.response || ''}`}>
          <Typography variant="h6">{responseTitle}:</Typography>
          <p>{response.message}</p>
          <Typography variant="h6">{scoreTitle}:</Typography>
          <p>{response.score}%</p>
        </div>
      )}
    </div>
  );
};

export default AtsChecker;

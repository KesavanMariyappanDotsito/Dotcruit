const multer = require('multer');
const path = require('path');
const axios = require('axios');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth'); // Import mammoth for DOCX files

// Configure multer storage settings
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join('C:', 'Users', 'kesav', 'OneDrive', 'Desktop', 'resumeupload'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Set up multer with the defined storage settings
const upload = multer({ storage: storage }).single('resume');

// Controller function that handles the file upload, form data, and AI processing
const atscontroller = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({ message: 'File upload failed.', error: err.message });
    }

    const resumeFile = req.file;
    const name = req.body.name;
    const jobDescription = req.body.jobDescription;

    if (!resumeFile || !name || !jobDescription) {
      return res.status(400).json({ message: 'Missing file or form data.' });
    }

    try {
      // Extract text from the resume based on file type
      let resumeText;
      if (resumeFile.mimetype === 'application/pdf') {
        // For PDF files
        const fileBuffer = await fs.readFile(resumeFile.path);
        const pdfData = await pdfParse(fileBuffer);
        resumeText = pdfData.text;
      } else if (resumeFile.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // For DOCX files
        const fileBuffer = await fs.readFile(resumeFile.path);
        const { value: docxText } = await mammoth.extractRawText({ buffer: fileBuffer });
        resumeText = docxText;
      } else {
        // Unsupported file type
        return res.status(400).json({ message: 'Unsupported file format. Please upload a PDF or DOCX file.' });
      }

      // Prepare data for Google Gemini AI request
      const payload = {
        contents: [
          {
            parts: [
              {
                text: `Act as a trained ATS (Applicant Tracking System) checker, assessing this resume against the given job description for suitability. Focus on relevant skills, experience, keywords, and alignment with the job description requirements. Assign a score out of 100, and ensure consistency in scoring for similar evaluations, regardless of resume eligibility.

                Return only the score and a brief, professional assessment in the following format:

                Score: X/100
                Description: A short evaluation of the resume’s relevance to the job, focusing on the match quality for essential skills and experience.

                Job Description: ${jobDescription}
                Resume: ${resumeText}`,
              },
            ],
          },
        ],
      };

      // Send request to Google Gemini AI
      const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyDHFlIzVzikAJVDdRCoBbrqrhCCAeQHmSI',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      // Access response text
      const aiResponseText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      console.log("res:", aiResponseText);

      if (!aiResponseText) {
        throw new Error('Unexpected response format from Gemini API.');
      }

      const scoreMatch = aiResponseText.match(/Score:\s*(\d+)\s*\/\s*100/); 
      console.log('scoreMatch:', scoreMatch);

      const atsScore = scoreMatch ? parseInt(scoreMatch[1], 10) : 'N/A';
      console.log('atsScore:', atsScore);

      const messageMatch = aiResponseText.match(/Description:\s*(.*)/); 
      const message = messageMatch ? messageMatch[1].trim() : 'No description provided';
      console.log('message:', message);

      // Respond with the score and message
      res.json({
        score: atsScore,
        message: message,
      });
    } catch (error) {
      console.error('Error with AI processing:', error);
      res.status(500).json({ message: 'Failed to process ATS score using Gemini AI.', error: error.message });
    }
  });
};

module.exports = { atscontroller };

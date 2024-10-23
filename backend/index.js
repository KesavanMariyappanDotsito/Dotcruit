const express = require('express');
const connection = require('./db');
const multer = require('multer');
const automationRouter = require('./router/automation.routes');
const authRoutes = require('./router/auth.routes');
const authenticateToken = require('./middlewares/authenticateToken');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT;
const AWS = require('aws-sdk');
const fs = require('fs');

app.use(express.json());
app.use(require('cors')());


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const PATH = process.env.ASSETS_PATH
        cb(null, 'C:\\Users\\Recruitment\\assets');
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname;
        cb(null, fileName);
    }
});

const upload = multer({ storage: storage })

const awsConfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: process.env.AWS_REGION,
};

AWS.config.update(awsConfig);
const s3 = new AWS.S3();
app.post('/api/file-upload', upload.single('file'), async (req, res) => {
    try {
        console.log(req.file.path);
        const file = req.file; 

        const params = {
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: `${req.file.filename}`,
            Body: fs.createReadStream(file.path),
            ContentType: file.mimetype,
        };

        const uploadResult = await s3.upload(params).promise();
        console.log(uploadResult.Location);

        res.status(200).json({ path: req.file.path, url: uploadResult.Location })
    } catch (error) {
        console.log(error);

        res.status(500).json({ error: error })
    }
})

app.use('/api/automation/', automationRouter)

app.use('/api/auth/', authRoutes)

app.get("/formfields", async (req, res) => {
    try {
        const data = await connection.promise().query(`SELECT * FROM form ORDER BY formOrder;`);
        res.status(202).json({
            fields: data[0],
        });
    } catch (err) {
        res.status(500).json({
            message: err,
        });
    }
});

app.patch("/formfields/autocomplete/edit/", async (req, res) => {
    try {
        const { fieldKey, option } = req.body;
        const tableName = 'form';

        const data = await connection.promise().query(`SELECT * FROM form`);

        const specificData = data[0].find((d) => d.key == fieldKey)

        let options = specificData.options
        if (specificData.options?.split(',').length > 0) {

            if (!specificData.options.includes(option))
                options = specificData.options + "," + option
        }
        else {
            options = option
        }

        const updateQuery = `
            UPDATE ${tableName}
            SET options = ?
            WHERE \`key\` = ?;
        `;

        await connection.promise().query(updateQuery, [options, fieldKey]);

        res.status(200).json({
            message: options,
        });
    } catch (err) {
        console.error('Error updating candidate:', err);
        res.status(500).json({
            message: "Error updating candidate",
            error: err.message, // Include error message for debugging
        });
    }
});

app.post("/submitform", async (req, res) => {
    try {
        const formData = req.body;
        const tableName = 'candidate';

        // Get the existing columns in the table
        const [existingColumns] = await connection.promise().query(`
            SHOW COLUMNS FROM ${tableName};
        `);

        const existingColumnNames = existingColumns.map(column => column.Field);

        // Iterate through formData keys and add new columns if they don't exist
        for (const key of Object.keys(formData)) {
            if (!existingColumnNames.includes(key)) {
                let columnType;

                // Determine the type of the column based on the data
                if (typeof formData[key] === 'string') {
                    columnType = 'TEXT';
                } else if (Buffer.isBuffer(formData[key])) {
                    columnType = 'BLOB';
                } else if (typeof formData[key] === 'number') {
                    columnType = 'INT';
                } else {
                    columnType = 'VARCHAR(255)';
                }

                // Alter the table to add the new column
                const alterQuery = `
                    ALTER TABLE ${tableName}
                    ADD COLUMN ${key} ${columnType};
                `;
                await connection.promise().query(alterQuery);
            }
        }

        // Dynamically create placeholders and values for the INSERT statement
        const keys = Object.keys(formData);
        const placeholders = keys.map(() => '?').join(', ');
        const values = keys.map(key => formData[key]);

        const insertQuery = `
            INSERT INTO ${tableName} (${keys.join(', ')})
            VALUES (${placeholders});
        `;

        await connection.promise().query(insertQuery, values);

        res.status(201).json({
            message: "Form submitted and data inserted successfully",
        });
    } catch (err) {
        console.error('Error submitting form:', err);
        res.status(500).json({
            message: "Error submitting form",
        });
    }
});

app.get("/candidate/", async (req, res) => {
    try {
        const data = await connection.promise().query(`SELECT * FROM candidate;`, [req.params.id]);
        res.status(202).json({
            fields: data[0],
        });
    } catch (err) {
        res.status(500).json({
            message: err,
        });
    }
});

app.get("/candidate/:id", async (req, res) => {
    try {
        const data = await connection.promise().query(`SELECT * FROM candidate WHERE ID = ?`, [req.params.id]);
        res.status(202).json({
            fields: data[0],
        });
    } catch (err) {
        res.status(500).json({
            message: err,
        });
    }
});

app.get("/candidate/filter/:filter", async (req, res) => {
    try {
        let filter = req.params.filter
        if (filter.includes(',')) {
            filter = filter.split(',')
        }

        const data = await connection.promise().query(`SELECT * FROM candidate WHERE status IN (?) ORDER BY createdAt DESC`, [filter]);
        res.status(202).json({
            fields: data[0],
        });
    } catch (err) {
        res.status(500).json({
            message: err,
        });
    }
});

app.put("/candidate/:id", async (req, res) => {
    try {
        const formData = req.body;
        const id = req.params.id;
        const tableName = 'candidate';

        // Check if ID is provided
        if (!id) {
            return res.status(400).json({ message: "ID is required" });
        }

        // Get the existing columns in the table
        const [existingColumns] = await connection.promise().query(`
            SHOW COLUMNS FROM ${tableName};
        `);

        const existingColumnNames = existingColumns.map(column => column.Field);

        // Iterate through formData keys and add new columns if they don't exist
        for (const key of Object.keys(formData)) {
            if (!existingColumnNames.includes(key)) {
                let columnType;

                // Determine the type of the column based on the data
                if (typeof formData[key] === 'string') {
                    columnType = 'TEXT';
                } else if (Buffer.isBuffer(formData[key])) {
                    columnType = 'BLOB';
                } else if (typeof formData[key] === 'number') {
                    columnType = Number.isInteger(formData[key]) ? 'INT' : 'FLOAT';
                } else if (typeof formData[key] === 'boolean') {
                    columnType = 'BOOLEAN';
                } else {
                    columnType = 'VARCHAR(255)';
                }

                // Alter the table to add the new column
                const alterQuery = `
                    ALTER TABLE ${tableName}
                    ADD COLUMN \`${key}\` ${columnType};
                `;
                await connection.promise().query(alterQuery);
            }
        }

        // Dynamically build the SET clause for the update query
        const setClause = Object.keys(formData).map(key => `\`${key}\` = ?`).join(', ');
        const values = Object.values(formData);

        // Add ID to the values for the WHERE clause
        const updateQuery = `
            UPDATE ${tableName}
            SET ${setClause}
            WHERE \`id\` = ?;
        `;

        await connection.promise().query(updateQuery, [...values, id]);

        res.status(200).json({
            message: "Candidate updated successfully",
        });
    } catch (err) {
        console.error('Error updating candidate:', err);
        res.status(500).json({
            message: "Error updating candidate",
            error: err.message, // Include error message for debugging
        });
    }
});

app.delete("/candidate/:id", async (req, res) => {
    try {
        const id = req.params.id;
        const deleteQuery = `
            DELETE FROM candidate
            WHERE ID = ?;
        `;

        await connection.promise().query(deleteQuery, [id]);

        res.status(200).json({
            message: "Candidate deleted successfully",
        });
    } catch (err) {
        console.error('Error deleting candidate:', err);
        res.status(500).json({
            message: "Error deleting candidate",
        });
    }
});

app.get("/api/script/", async (req, res) => {
    try {
        const data = await connection.promise().query(`SELECT * FROM ClientScripts;`, [req.params.id]);
        res.status(202).json({
            fields: data[0],
        });
    } catch (err) {
        res.status(500).json({
            message: err,
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server listening on PORT ${PORT}`);
});
const express = require('express');
const multer = require('multer')
const excelToJSON = require('convert-excel-to-json');
const fs = require("fs-extra")

const PORT = 3000;

const app = express()


const upload = multer({ dest: 'uploads/' })

app.post('/read', upload.single(), (req, res, next) => {
    try {
        if (req.file.filename === null || req.file.filename === 'undefined') {
            res.status(400).json("No file")
        } else {
            const filePath = 'uploads/' + req.file.filename;
            const excelData = excelToJSON({
                sourceFile: filePath,
                header: {
                    rows: 0
                },
                columnToKey: {
                    '*': '{{columnHeader}}'
                }
            })
            fs.remove(filePath)
            
            res.status(200).send(excelData)
        }
    }
    catch (err) {
        res.status(err)
    }
    next()
})

app.get('/', (req, res) => {
    res.json({ "Here": 'Ready to dance now' })
})
app.listen(PORT, () => {
    console.log(`Server is up and learning on port ${PORT}`)
});




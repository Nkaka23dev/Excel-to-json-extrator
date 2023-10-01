const express = require("express");
const multer = require("multer");
const excelToJSON = require("convert-excel-to-json");
const fs = require("fs-extra");

interface ExcelDataType {
  "Code y'igisubizo": string;
  "izina ry'ikibazo Cyambere": string;
  "igisubizo cy'ukuri": string;
  "Code y'ikibazo": number;
  "izina ry'ikibazo": string;
}

interface Choice {
  id: number;
  alf: string;
  q: string;
  userChoiceOnItem: null | any; 
  answer: boolean;
}

interface FinalAnswer {
  id: number;
  title: string;
  userChoice: null | any; 
  choices: Choice[];
  img: string;
}

const PORT = 3000;

const app = express();

const upload = multer({ dest: "uploads/" });

app.post("/read", upload.single(), (req: any, res: any) => {
  try {
    if (req.file.filename === null || req.file.filename === "undefined") {
      res.status(400).json("No file");
    } else {
      const filePath = "uploads/" + req.file.filename;
      const excelData = excelToJSON({
        sourceFile: filePath,
        header: {
          rows: 0,
        },
        sheets: ["Answers"],
        columnToKey: {
          "*": "{{columnHeader}}",
        },
      });
      fs.remove(filePath);
      dataTransform(excelData.Answers);
      res.status(200).send(dataTransform(excelData.Answers));
    }
  } catch (err) {
    res.status(err);
  }
});

app.get("/", (req: any, res: any) => {
  res.json("Here is the ho");
});

app.listen(PORT, () => {
  console.log(`Server is up and learning on port ${PORT}`);
});

function dataTransform(excelData: ExcelDataType[]) {
  const questions = new Set(excelData.map((el) => el["izina ry'ikibazo"]));
  const finalAnswers: FinalAnswer[] = [...questions].map((question, index) => {
    const sameQuestions = excelData.filter(
      (el) => el["izina ry'ikibazo"] === question
    );
    return {
      id: index + 1,
      title: question,
      userChoice: null,
      choices: sameQuestions.map((sqs, i) => {
        return {
          id: i + 1,
          alf: sqs["Code y'igisubizo"],
          q: sqs["izina ry'ikibazo Cyambere"],
          userChoiceOnItem: null,
          answer: sqs["Code y'igisubizo"] === sqs["igisubizo cy'ukuri"],
        };
      }),
      img: "",
    };
  });
  return finalAnswers;
}

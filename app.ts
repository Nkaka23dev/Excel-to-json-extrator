const express = require("express");
const multer = require("multer");
const excelToJSON = require("convert-excel-to-json");
// const fs = require("fs-extra");
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from "firebase/storage";
import fs from "fs";
import ExcelJS from "exceljs";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
} from "firebase/firestore/lite";
import path from "path";

const firebaseConfig = {
  apiKey: "AIzaSyAmxMyow5nSdr79O8-uht5QImKVn2eD4Tc",
  authDomain: "provisoire-ee9f8.firebaseapp.com",
  projectId: "provisoire-ee9f8",
  storageBucket: "provisoire-ee9f8.appspot.com",
  messagingSenderId: "702380799985",
  appId: "1:702380799985:web:ca5d25a471382947c23650",
  measurementId: "G-M3TCEYZQLB",
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const collectionRef = collection(db, "Questions");
let finalData: FinalAnswer[];

async function getCities(db: any) {
  const citiesCol = collection(db, "Questions");
  const citySnapshot = await getDocs(citiesCol);
  const cityList = citySnapshot.docs.map((doc) => doc.data());
  return cityList;
}

interface ExcelDataType {
  "Code y'igisubizo": string;
  "izina ry'ikibazo Cyambere": string;
  "igisubizo cy'ukuri": string;
  "Code y'ikibazo": number;
  "izina ry'ikibazo": string;
}

interface ImageExtractor {
  questionId: number;
  image: string;
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
  img: any;
}

const PORT = 3000;

const app = express();

const upload = multer({ dest: "uploads/" });
const workbook = new ExcelJS.Workbook();
const storage = getStorage();

app.post("/read", upload.single(), async (req: any, res: any) => {
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
      const finalData: FinalAnswer[] = await dataTransform(excelData.Answers);
      finalData.map((value: FinalAnswer) => {
        (async () => {
          console.log("THIS IS RUNNING INSIDE POSTING OBJECT");
          try {
            let imgUrl: null | string = null;
            if (value.img) {
              const imgRef = ref(storage, value.img);
              const uploadTask = await uploadBytesResumable(
                imgRef,
                Buffer.from(fs.readFileSync(path.join(__dirname, value.img)))
              );
              imgUrl = await getDownloadURL(uploadTask.ref);
            }
            const dataToAdd = {
              title: value.title,
              userChoice: value.userChoice,
              choices: value.choices,
              img: imgUrl,
            };

            await addDoc(collectionRef, dataToAdd);
          } catch (e) {
            console.log("Error occurred!", e);
          }
        })();
      });
      res.status(200).send(await dataTransform(excelData.Answers));
    }
  } catch (err) {
    res.status(err);
  }
});

const extraxt_images = async () => {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(
      "images/ibibazo n'ibisubizo-25092023 (1) (1).xlsx"
    );

    const worksheet = workbook.worksheets[2];
    const images: any = [];

    for (const image of worksheet.getImages().slice(1, 100)) {
      const img: any = workbook.model.media.find(
        (m: any) => m.index === image.imageId
      );

      const rowNativeId = image.range.tl.nativeRow;
      const customRowId = worksheet.getRow(rowNativeId + 1).getCell(1).value;

      const path = `images/image-${customRowId}.${img.extension}`;

      fs.writeFileSync(path, img.buffer);

      images.push({ questionId: customRowId, image: path });
    }
    return images;
  } catch (error) {
    console.error(error);
  }
};

app.get("/", (req: any, res: any) => {
  res.json("My data are here:");
});

async function dataTransform(excelData: ExcelDataType[]) {
  const questions = new Set(excelData.map((el) => el["izina ry'ikibazo"]));
  const images: ImageExtractor[] = await extraxt_images();
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
      img:
        images.find(
          (value) => value.questionId === sameQuestions[0]["Code y'ikibazo"]
        )?.image || null,
    };
  });
  return finalAnswers;
}

app.listen(PORT, () => {
  console.log(`Server is up and learning on port ${PORT}`);
});

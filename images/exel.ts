import fs from "fs";
import ExcelJS from "exceljs";

(async () => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile("ibibazo n'ibisubizo-25092023 (1) (1).xlsx");

  const worksheet = workbook.worksheets[2];

  const images: any = [];

  for (const image of worksheet.getImages().slice(1, 1000)) {
    // const image = worksheet.getImages()[37];
    const img: any = workbook.model.media.find(
      (m: any) => m.index === image.imageId
    );

    const rowNativeId = image.range.tl.nativeRow;
    const customRowId = worksheet.getRow(rowNativeId + 1).getCell(1).value;

    const path = `images/image-${customRowId}.${img.extension}`;

    fs.writeFileSync(path, img.buffer);

    images.push({ questionId: customRowId, image: path });
  }
  console.log(images);
})();

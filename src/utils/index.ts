import * as ExcelJS from 'exceljs';
import * as path from 'path';

type ruleItem = (row1: any, row2: any) => boolean;
export function compareTwoListByTargetedKey(
  l1: any[], // 在这个业务中会传入公司数据列表
  l2: any[], // 在这个业务中会传入客户数据列表
  rules: ruleItem[],
) {
  return l1.filter((companyRow) =>
    l2.some((customerRow) =>
      // 每条rule是一个条件函数，会比对公司数据和客户数据中对应字段名的值，必须全部符合条件
      rules.reduce(
        (pre, condition) => pre && condition(companyRow, customerRow),
        true,
      ),
    ),
  );
}

export async function createWorkbook(file: Express.Multer.File) {
  if (!file || !file.path) return null;
  // 创建一个新的工作簿实例
  const workbook = new ExcelJS.Workbook();
  const filePath = path.resolve(file.path);

  // 读取 Excel 文件
  await workbook.xlsx.readFile(filePath);
  return workbook;
}

export function getJsonDataFromWorkbook(workbook: ExcelJS.Workbook) {
  if (!workbook) return null;
  const sheetDataList = [];
  workbook.eachSheet((sheet, id) => {
    console.log(sheet.name);
    const sheetData = [];
    const headers = [];

    sheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) {
        row.eachCell((cell, colNumber) => {
          headers[colNumber - 1] = cell.value;
        });
      } else {
        const rowData = {};
        row.eachCell((cell, colNumber) => {
          rowData[headers[colNumber - 1]] = cell.value;
        });
        sheetData.push(rowData);
      }
    });

    sheetDataList.push({ id, sheetName: sheet.name, headers, data: sheetData });
  });
  return sheetDataList;
}
export async function getFirstSheetData(file: Express.Multer.File) {
  const workbook = await createWorkbook(file);
  const jsonData = getJsonDataFromWorkbook(workbook);
  return { header: jsonData[0].headers, data: jsonData[0].data };
}

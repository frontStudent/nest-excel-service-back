import {
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseInterceptors,
  Res,
  // Body,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { AppService } from './app.service';

import { getFirstSheetData, compareTwoListByTargetedKey } from './utils';
import * as ExcelJS from 'exceljs';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  private companyFile: Express.Multer.File;
  private customerFile: Express.Multer.File;

  // 符合筛选条件的rows
  private targetRows: any;
  private companyHeaders: any;

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('upload')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'companyFile', maxCount: 2 },
        { name: 'customerFile', maxCount: 3 },
      ],
      {
        dest: 'uploads',
      },
    ),
  )
  async uploadFile(
    @UploadedFiles()
    files: {
      companyFile?: Express.Multer.File[];
      customerFile?: Express.Multer.File[];
    },
    // @Body() body,
  ) {
    console.log(files?.companyFile, 'files.companyFile');
    console.log(files?.customerFile, 'files.customerFile');
    if (files?.companyFile) this.companyFile = files.companyFile[0];
    if (files?.customerFile) this.customerFile = files.customerFile[0];
  }

  @Get('export')
  async exportXLS(@Res() res: any) {
    if (this.companyFile && this.customerFile) {
      const companyData = await getFirstSheetData(this.companyFile);
      const customerData = await getFirstSheetData(this.customerFile);

      const rows = compareTwoListByTargetedKey(
        companyData.data,
        customerData.data,
        [
          (companyRow, customerRow) => {
            const value1 = companyRow['Order No'];
            const value2 = customerRow['订单号'];
            if (!value1 || !value2) return false;
            return value1.toString() === value2.toString();
          },
          (companyRow, customerRow) => {
            const value1 = companyRow['客户图号'];
            const value2 = customerRow['物品编码'];
            const remark = customerRow['订单行备注'];
            if (!value1) return false;
            if (value2) return value1.indexOf(value2) !== -1;
            return value1
              .split(' ')
              .map((item) => remark.indexOf(item) !== -1)
              .some(Boolean);
          },
        ],
      );
      const columns = companyData.header.map((header: string) => {
        return { header, key: header };
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('TestExportXLS');
      worksheet.columns = columns;
      // worksheet.addRow(this.headers);
      worksheet.addRows(rows);

      const buffer = await workbook.xlsx.writeBuffer();

      res.header(
        'Content-Disposition',
        'attachment; filename=anlikodullendirme.xlsx',
      );
      res.type(
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.send(buffer);
      return;
    }
    res.send('文件不全');
  }
}

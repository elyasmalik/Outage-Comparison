import { Component, EventEmitter, Output } from '@angular/core';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-excel-import',
  templateUrl: './excel-import.component.html',
  styleUrls: ['./excel-import.component.scss']
})
export class ExcelImportComponent {
  @Output() roshanDataChange = new EventEmitter<any[]>();
  @Output() otherDataChange = new EventEmitter<any[]>();

  loading = false;
  successMessage = '';
  roshanData: any[] = [];
  otherData: any[] = [];

  onFileChange(event: any, operator: string) {
    const file = event.target.files[0];
    if (!file) return;

    this.loading = true;
    this.successMessage = '';

    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const rows = jsonData.slice(2); // skip first 2 header rows
        const cleanData = rows.map(row => ({
          TT: row[0] ? String(row[0]).trim() : '',
          StartTime: row[1] ? this.formatExcelDate(row[1]) : '',
          EndTime: row[2] ? this.formatExcelDate(row[2]) : '',
          SiteID: row[3] ? String(row[3]).trim() : '',
          RoshanSiteID: row[4] ? String(row[4]).trim() : ''
        })).filter(r => r.TT || r.SiteID || r.StartTime || r.EndTime);

        if (operator === 'roshan') {
          this.roshanData = cleanData;
          this.roshanDataChange.emit(cleanData);
          this.successMessage = 'Roshan Excel imported successfully!';
        } else {
          this.otherData = cleanData;
          this.otherDataChange.emit(cleanData);
          this.successMessage = 'Share Operator Excel imported successfully!';
        }

      } catch (err) {
        console.error('Error parsing excel', err);
        this.successMessage = 'Error reading file';
      } finally {
        this.loading = false;
        (event.target as HTMLInputElement).value = '';
      }
    };
    reader.readAsArrayBuffer(file);
  }

  // Convert Excel date to string exactly as in Excel
 formatExcelDate(value: any): string {
  if (typeof value === 'number') {
    // Convert Excel number to JS Date in UTC first
    const utc_days = Math.floor(value - 25569);
    const utc_value = utc_days * 86400 * 1000;
    const date_info = new Date(utc_value);
    const fractional_day = value - Math.floor(value);
    const total_seconds = Math.floor(86400 * fractional_day);

    const seconds = total_seconds % 60;
    const minutes = Math.floor(total_seconds / 60) % 60;
    const hours = Math.floor(total_seconds / 3600);

    date_info.setHours(hours, minutes, seconds);

    // Format exactly as M/D/YYYY  H:MM:SS AM/PM
    const ampm = date_info.getHours() >= 12 ? 'PM' : 'AM';
    const hours12 = date_info.getHours() % 12 || 12;
    const minutesStr = String(date_info.getMinutes()).padStart(2, '0');
    const secondsStr = String(date_info.getSeconds()).padStart(2, '0');
    return `${date_info.getMonth() + 1}/${date_info.getDate()}/${date_info.getFullYear()}  ${hours12}:${minutesStr}:${secondsStr} ${ampm}`;
  }
  return value; // if it's already string in Excel
}
}
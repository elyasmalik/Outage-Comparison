import { Component } from '@angular/core';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-outage-page',
  templateUrl: './outage-page.component.html',
  styleUrls: ['./outage-page.component.scss']
})
export class OutagePageComponent {
  roshanData: any[] = [];
  shareData: any[] = [];
  filter = { roshan: '', other: '' };

  comparisonResults: any[] = [];

  totalTTs = 0;
  totalAccepted = 0;
  totalRejected = 0;
  totalConfirmedMinutes = 0;

  onRoshanData(data: any[]) {
    this.roshanData = data || [];
    this.buildTableAndSummary();
  }

  onShareData(data: any[]) {
    this.shareData = data || [];
    this.buildTableAndSummary();
  }

  onFilterChange(filter: { roshan: string; other: string }) {
    this.filter = filter || { roshan: '', other: '' };
    this.buildTableAndSummary();
  }

  private buildTableAndSummary() {
    // --- comparison & summary logic same as before ---
    const roshanFilter = (this.filter.roshan || '').toLowerCase();
    const otherFilter = (this.filter.other || '').toLowerCase();

    const tempResults: any[] = [];
    const usedOtherIndexes = new Set<number>();

    this.roshanData.forEach((r) => {
      let matched = false;
      this.shareData.forEach((o, idx) => {
        if (usedOtherIndexes.has(idx)) return;

        const siteMatch =
          (o.SiteID && o.SiteID === r.SiteID) ||
          (o.RoshanSiteID && o.RoshanSiteID === r.SiteID);
        if (!siteMatch) return;

        const isAccepted = this.isAccepted(r, o);
        tempResults.push({
          roshanTTs: r.TT,
          roshanSiteID: r.SiteID,
          roshanStart: r.StartTime,
          roshanEnd: r.EndTime,
          otherTTs: o.TT,
          otherSiteID: o.SiteID,
          otherStart: o.StartTime,
          otherEnd: o.EndTime,
          status: isAccepted ? 'Confirmed' : 'Rejected',
        });
        matched = true;
        usedOtherIndexes.add(idx);
      });

      if (!matched) {
        tempResults.push({
          roshanTTs: r.TT,
          roshanSiteID: r.SiteID,
          roshanStart: r.StartTime,
          roshanEnd: r.EndTime,
          otherTTs: '',
          otherSiteID: '',
          otherStart: '',
          otherEnd: '',
          status: 'Rejected',
        });
      }
    });

    this.shareData.forEach((o, idx) => {
      if (usedOtherIndexes.has(idx)) return;
      tempResults.push({
        roshanTTs: '',
        roshanSiteID: '',
        roshanStart: '',
        roshanEnd: '',
        otherTTs: o.TT,
        otherSiteID: o.SiteID,
        otherStart: o.StartTime,
        otherEnd: o.EndTime,
        status: 'Rejected',
      });
    });

    // -------------------------
    // IMPORTANT: compute summaries from full (unfiltered) tempResults
    // so totals always represent Roshan + Operator TTs (not only displayed rows)
    // -------------------------
    const fullResults = tempResults;

    // Total TTs is the sum of original lists (Roshan + Operator)
    this.totalTTs = this.roshanData.length + this.shareData.length;

    // Accepted = number of confirmed rows (pairs) in full results
    this.totalAccepted = fullResults.filter((r) => r.status === 'Confirmed').length;

    // Rejected = total TTs minus accepted pairs (matches your expected calculation)
    this.totalRejected = this.totalTTs - this.totalAccepted;

    // total confirmed minutes computed from confirmed rows in full results
    this.totalConfirmedMinutes = fullResults
      .filter((r) => r.status === 'Confirmed')
      .reduce((sum, r) => {
        const start = this.parseDate(r.roshanStart);
        const end = this.parseDate(r.roshanEnd);
        if (this.isValidDate(start) && this.isValidDate(end)) {
          return sum + (end.getTime() - start.getTime()) / 60000;
        }
        return sum;
      }, 0);

    // Apply UI filters only to displayed comparison results (do not affect summary)
    this.comparisonResults = fullResults
      .filter(
        (r) =>
          Object.values(r).some((v) =>
            (v + '').toLowerCase().includes(roshanFilter)
          ) &&
          Object.values(r).some((v) =>
            (v + '').toLowerCase().includes(otherFilter)
          )
      )
      .sort((a, b) =>
        a.status === b.status ? 0 : a.status === 'Confirmed' ? -1 : 1
      );
  }

  formatMinutes(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h}h ${m}m`;
  }

  private isAccepted(r: any, o: any): boolean {
    const start1 = this.parseDate(r.StartTime);
    const end1 = this.parseDate(r.EndTime);
    const start2 = this.parseDate(o.StartTime);
    const end2 = this.parseDate(o.EndTime);

    if (
      !this.isValidDate(start1) ||
      !this.isValidDate(end1) ||
      !this.isValidDate(start2) ||
      !this.isValidDate(end2)
    ) {
      return r.SiteID && o.SiteID && r.SiteID === o.SiteID;
    }

    const overlap = start1 <= end2 && end1 >= start2;
    const diffEndStart = (start2.getTime() - end1.getTime()) / 60000;
    const tolerance = diffEndStart >= 0 && diffEndStart <= 30;

    return overlap || tolerance;
  }

  private parseDate(value: any): Date {
    if (!value) return new Date(NaN);
    if (typeof value === 'number')
      return new Date((value - 25569) * 86400 * 1000);
    if (typeof value === 'string') {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
      const m = value.match(
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+(\d{1,2}:\d{2}:\d{2}(?:\s?[APMapm]{2})?))?/
      );
      if (m) {
        const month = m[1].padStart(2, '0');
        const day = m[2].padStart(2, '0');
        const year = m[3].length === 2 ? '20' + m[3] : m[3];
        const time = m[4] || '00:00:00';
        return new Date(`${year}-${month}-${day}T${time}`);
      }
      return new Date(value);
    }
    return new Date(value);
  }

  private isValidDate(d: Date) {
    return d instanceof Date && !isNaN(d.getTime());
  }

  // Export summary + table in one sheet
  exportToExcel() {
    const summaryAoA: any[][] = [
      ['Metric', 'Value'],
      ['Roshan TTs', this.roshanData.length],
      ['Accepted', this.totalAccepted],
      ['Rejected', this.totalRejected],
      ['Operator TTs', this.shareData.length],
      ['Total Confirmed Minutes', Math.round(this.totalConfirmedMinutes)],
    ];

    const tableHeader = [
      '#',
      'Roshan TTs',
      'Roshan Site ID',
      'Roshan Start',
      'Roshan End',
      'Operator TTs',
      'Operator Site ID',
      'Operator Start',
      'Operator End',
      'Status',
    ];
    const tableRows = this.comparisonResults.map((r, i) => [
      i + 1,
      r.roshanTTs,
      r.roshanSiteID,
      r.roshanStart,
      r.roshanEnd,
      r.otherTTs,
      r.otherSiteID,
      r.otherStart,
      r.otherEnd,
      r.status,
    ]);

    const combinedAoA = [...summaryAoA, [], tableHeader, ...tableRows];
    const ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(combinedAoA);

    const colWidths = tableHeader.map((h) => ({
      wch: Math.max(12, String(h).length + 2),
    }));
    ws['!cols'] = colWidths;

    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Outage Comparison');
    XLSX.writeFile(wb, 'Outage_Comparison.xlsx');
  }
}

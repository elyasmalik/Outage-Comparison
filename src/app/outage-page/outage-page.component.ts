import { Component } from '@angular/core';

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
    const roshanFilter = (this.filter.roshan || '').toLowerCase();
    const otherFilter = (this.filter.other || '').toLowerCase();

    const tempResults: any[] = [];
    const usedOtherIndexes = new Set<number>();

    this.roshanData.forEach((r) => {
      let matched = false;
      this.shareData.forEach((o, idx) => {
        if (usedOtherIndexes.has(idx)) return;

        const siteMatch = (o.SiteID && o.SiteID === r.SiteID) || (o.RoshanSiteID && o.RoshanSiteID === r.SiteID);
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
          status: isAccepted ? 'Confirmed' : 'Rejected'
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
          status: 'Rejected'
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
        status: 'Rejected'
      });
    });

    this.comparisonResults = tempResults
      .filter(r =>
        Object.values(r).some(v => (v + '').toLowerCase().includes(roshanFilter)) &&
        Object.values(r).some(v => (v + '').toLowerCase().includes(otherFilter))
      )
      .sort((a, b) => (a.status === b.status ? 0 : a.status === 'Confirmed' ? -1 : 1));

    this.totalTTs = this.comparisonResults.length;
    this.totalAccepted = this.comparisonResults.filter(r => r.status === 'Confirmed').length;
    this.totalRejected = this.comparisonResults.filter(r => r.status === 'Rejected').length;
  }

  private isAccepted(r: any, o: any): boolean {
    const start1 = this.parseDate(r.StartTime);
    const end1 = this.parseDate(r.EndTime);
    const start2 = this.parseDate(o.StartTime);
    const end2 = this.parseDate(o.EndTime);

    if (!this.isValidDate(start1) || !this.isValidDate(end1) ||
        !this.isValidDate(start2) || !this.isValidDate(end2)) {
      return r.SiteID && o.SiteID && r.SiteID === o.SiteID;
    }

    // Case 1: Normal overlap
    const overlap = start1 <= end2 && end1 >= start2;

    // Case 2: Gap tolerance (Roshan End → Operator Start ≤ 30 min)
    const diffEndStart = (start2.getTime() - end1.getTime()) / 60000;
    const tolerance = diffEndStart >= 0 && diffEndStart <= 30;

    return overlap || tolerance;
  }

  private parseDate(value: any): Date {
    if (!value) return new Date(NaN);
    if (typeof value === 'number') return new Date((value - 25569) * 86400 * 1000);
    if (typeof value === 'string') {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
      const m = value.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})(?:\s+(\d{1,2}:\d{2}))?/);
      if (m) {
        const day = m[1].padStart(2, '0');
        const month = m[2].padStart(2, '0');
        const year = m[3].length === 2 ? '20' + m[3] : m[3];
        const time = m[4] || '00:00';
        return new Date(`${year}-${month}-${day}T${time}:00`);
      }
    }
    return new Date(value);
  }

  private isValidDate(d: Date) {
    return d instanceof Date && !isNaN(d.getTime());
  }
}

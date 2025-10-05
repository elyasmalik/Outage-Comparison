import { Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-outage-table',
  templateUrl: './outage-table.component.html',
  styleUrls: ['./outage-table.component.scss']
})
export class OutageTableComponent implements OnChanges {
  @Input() roshanData: any[] = [];
  @Input() otherData: any[] = [];
  @Input() filter: { roshan: string; other: string } = { roshan: '', other: '' };

  comparisonResults: any[] = [];

  ngOnChanges() {
    this.compareData();
  }

  compareData() {
    const roshanFilter = (this.filter.roshan || '').toLowerCase();
    const otherFilter = (this.filter.other || '').toLowerCase();

    const tempResults: any[] = [];
    const usedOtherIndexes = new Set<number>();

    this.roshanData.forEach((r) => {
      let matched = false;
      this.otherData.forEach((o, idx) => {
        if (usedOtherIndexes.has(idx)) return;

        const siteMatch = (o.SiteID && o.SiteID === r.SiteID) || (o.RoshanSiteID && o.RoshanSiteID === r.SiteID);
        if (!siteMatch) return;

        const isAccepted = this.isAccepted(r, o);
        const row = {
          roshanTTs: r.TT,
          roshanSiteID: r.SiteID,
          roshanStart: r.StartTime,
          roshanEnd: r.EndTime,
          otherTTs: o.TT,
          otherSiteID: o.SiteID,
          otherStart: o.StartTime,
          otherEnd: o.EndTime,
          status: isAccepted ? 'Confirmed' : 'Rejected'
        };
        tempResults.push(row);
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

    this.otherData.forEach((o, idx) => {
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

    const filtered = tempResults.filter(r =>
      Object.values(r).some(v => (v + '').toLowerCase().includes(roshanFilter)) &&
      Object.values(r).some(v => (v + '').toLowerCase().includes(otherFilter))
    );

    this.comparisonResults = filtered.sort((a, b) => a.status === 'Confirmed' ? -1 : 1);
  }

  private isAccepted(r: any, o: any): boolean {
    if (!r.StartTime || !r.EndTime || !o.StartTime || !o.EndTime) return r.SiteID === o.SiteID;

    const start1 = new Date(r.StartTime);
    const end1 = new Date(r.EndTime);
    const start2 = new Date(o.StartTime);
    const end2 = new Date(o.EndTime);

    // Case 1: Normal overlap
    const overlap = start1 <= end2 && end1 >= start2;

    // Case 2: Gap tolerance (Roshan End → Operator Start ≤ 30 min)
    const diffEndStart = (start2.getTime() - end1.getTime()) / 60000; // in minutes
    const tolerance = diffEndStart >= 0 && diffEndStart <= 30;

    return overlap || tolerance;
  }
}

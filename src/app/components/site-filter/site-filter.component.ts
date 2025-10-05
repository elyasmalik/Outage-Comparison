import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-site-filter',
  templateUrl: './site-filter.component.html',
  styleUrls: ['./site-filter.component.scss']
})
export class SiteFilterComponent {
  searchText: string = '';
  @Output() filterChange = new EventEmitter<{ roshan: string, other: string }>();

  onFilterChange() {
    const q = this.searchText.trim();
    this.filterChange.emit({ roshan: q, other: q });
  }
}

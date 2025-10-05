import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutageTableComponent } from './outage-table.component';

describe('OutageTableComponent', () => {
  let component: OutageTableComponent;
  let fixture: ComponentFixture<OutageTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OutageTableComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OutageTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

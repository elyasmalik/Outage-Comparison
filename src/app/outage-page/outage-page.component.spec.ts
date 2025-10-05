import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OutagePageComponent } from './outage-page.component';

describe('OutagePageComponent', () => {
  let component: OutagePageComponent;
  let fixture: ComponentFixture<OutagePageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OutagePageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OutagePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

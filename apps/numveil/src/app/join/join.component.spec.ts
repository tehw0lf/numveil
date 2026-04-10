import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SessionService } from '../services/session.service';
import { JoinComponent } from './join.component';

const mockSessionService = {
  joinSession: jest.fn(),
};

describe('JoinComponent', () => {
  let component: JoinComponent;
  let fixture: ComponentFixture<JoinComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JoinComponent],
      providers: [{ provide: SessionService, useValue: mockSessionService }],
    }).compileComponents();

    fixture = TestBed.createComponent(JoinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should join a session without a set user name', () => {
    component.joinSession();
    expect(mockSessionService.joinSession).toHaveBeenCalled();
  });

  it('should join a session with a set user name', () => {
    component.name.set('user');
    component.joinSession();
    expect(mockSessionService.joinSession).toHaveBeenCalled();
  });
});

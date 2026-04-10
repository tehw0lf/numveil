import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Player } from '@numveil/core';

import { SessionService } from '../services/session.service';
import { ResultComponent } from './result.component';

const mockSessionService = {
  newRound: jest.fn(),
  leaveSession: jest.fn(),
};

const mockPlayer: Player = {
  uuid: '',
  name: '',
  pic: '',
  guess: 0,
  won: false,
};

describe('ResultComponent', () => {
  let component: ResultComponent;
  let fixture: ComponentFixture<ResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultComponent],
      providers: [{ provide: SessionService, useValue: mockSessionService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should return true if a guess is undefined, aka the player has chosen a number', () => {
    mockPlayer.guess = undefined;
    expect(component.hasGuessed(mockPlayer)).toBeTruthy();
  });

  it('should return true if a player has guessed', () => {
    mockPlayer.guess = 1;
    expect(component.hasGuessed(mockPlayer)).toBeTruthy();
  });

  it('should return false if a guess is less than 0', () => {
    mockPlayer.guess = -1;
    expect(component.hasGuessed(mockPlayer)).toBeFalsy();
  });

  it('should start a new round', () => {
    component.newRound();
    expect(mockSessionService.newRound).toHaveBeenCalled();
  });

  it('should leave a session', () => {
    component.leaveSession();
    expect(mockSessionService.leaveSession).toHaveBeenCalled();
  });
});

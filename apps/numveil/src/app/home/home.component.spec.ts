import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Player } from '@numveil/core';

import { SessionService } from '../services/session.service';
import { HomeComponent } from './home.component';

const mockSessionService = {
  leaveSession: jest.fn(),
  joinSession: jest.fn(),
  sendGuess: jest.fn(),
};

const mockPlayer: Player = {
  uuid: '',
  name: '',
  pic: '',
  guess: 0,
  won: false,
};

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [{ provide: SessionService, useValue: mockSessionService }],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
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

  it('should leave a session', () => {
    component.leaveSession();
    expect(mockSessionService.leaveSession).toHaveBeenCalled();
  });

  it('should send a guess if one is set and it is greater than 0', () => {
    component.guess.set(1);
    component.sendGuess();
    expect(mockSessionService.sendGuess).toHaveBeenCalled();
  });

  it('should not send a guess if one is set and it is 0', () => {
    const calls = mockSessionService.sendGuess.mock.calls.length;
    component.guess.set(0);
    component.sendGuess();
    expect(mockSessionService.sendGuess).toHaveBeenCalledTimes(calls);
  });

  it('should not send a guess if none is set', () => {
    const calls = mockSessionService.sendGuess.mock.calls.length;
    component.guess.set(undefined);
    component.sendGuess();
    expect(mockSessionService.sendGuess).toHaveBeenCalledTimes(calls);
  });
});

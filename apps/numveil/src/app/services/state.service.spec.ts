import { TestBed } from '@angular/core/testing';

import { StateService } from './state.service';

const mockWinnersOneWinner = {
  players: [
    { uuid: '123', name: '', pic: '', guess: 0, won: true },
    { uuid: '132', name: '', pic: '', guess: 0, won: false },
    { uuid: '231', name: '', pic: '', guess: 0, won: false },
  ],
};
const mockWinnersTwoWinners = {
  players: [
    { uuid: '123', name: '', pic: '', guess: 0, won: true },
    { uuid: '132', name: '', pic: '', guess: 0, won: true },
    { uuid: '231', name: '', pic: '', guess: 0, won: false },
  ],
};
const mockWinnersNoWinners = {
  players: [
    { uuid: '123', name: '', pic: '', guess: 0, won: false },
    { uuid: '132', name: '', pic: '', guess: 0, won: false },
    { uuid: '231', name: '', pic: '', guess: 0, won: false },
  ],
};

const mockNumberDecider = {
  sessionUser: { uuid: '123', sessionID: '' },
  players: [{ uuid: '123', name: '', pic: '', guess: undefined, won: false }],
};
const mockNoNumberDecider = {
  sessionUser: { uuid: '123', sessionID: '' },
  players: [{ uuid: '123', name: '', pic: '', guess: -1, won: false }],
};

const mockIsWinner = {
  sessionUser: { uuid: '123', sessionID: '' },
  players: [{ uuid: '123', name: '', pic: '', guess: 0, won: true }],
};
const mockIsNoWinner = {
  sessionUser: { uuid: '123', sessionID: '' },
  players: [{ uuid: '123', name: '', pic: '', guess: 0, won: false }],
};
const mockIsInvalidWinner = {
  sessionUser: { uuid: '', sessionID: '' },
  players: [{ uuid: '', name: '', pic: '', guess: 0, won: true }],
};

const mockCanVisitHome = { sessionUser: { uuid: '123', sessionID: '123456' } };
const mockCanNotVisitHome = { sessionUser: { uuid: '', sessionID: '' } };

const mockCanVisitResult = {
  sessionUser: { uuid: '123', sessionID: '123456' },
  userGuess: 0,
};
const mockCanNotVisitResult = {
  sessionUser: { uuid: '', sessionID: '' },
  userGuess: -1,
};

describe('StateService', () => {
  let service: StateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return one winner if one player has won', () => {
    service.players.set(mockWinnersOneWinner.players);

    expect(service.winners().length).toBe(1);
  });

  it('should return two winners if two players have won', () => {
    service.players.set(mockWinnersTwoWinners.players);

    expect(service.winners().length).toBe(2);
  });

  it('should return no winners if no players have won', () => {
    service.players.set(mockWinnersNoWinners.players);

    expect(service.winners().length).toBe(0);
  });

  it('should return true if a player has decided a number', () => {
    service.players.set(mockNumberDecider.players);
    service.sessionUser.set(mockNumberDecider.sessionUser);

    expect(service.isNumberDecider()).toBe(true);
  });

  it('should return false if a player has not decided a number', () => {
    service.players.set(mockNoNumberDecider.players);
    service.sessionUser.set(mockNoNumberDecider.sessionUser);

    expect(service.isNumberDecider()).toBe(false);
  });

  it('should return true if a player has won', () => {
    service.players.set(mockIsWinner.players);
    service.sessionUser.set(mockIsWinner.sessionUser);

    expect(service.isWinner()).toBe(true);
  });

  it('should return false if no player has won', () => {
    service.players.set(mockIsNoWinner.players);
    service.sessionUser.set(mockIsNoWinner.sessionUser);

    expect(service.isWinner()).toBe(false);
  });

  it('should return false if the player has no uuid', () => {
    service.players.set(mockIsInvalidWinner.players);
    service.sessionUser.set(mockIsInvalidWinner.sessionUser);

    expect(service.isWinner()).toBe(false);
  });

  it('should visit home if a session is established', () => {
    service.sessionUser.set(mockCanVisitHome.sessionUser);

    expect(service.canVisitHome()).toBe(true);
  });

  it('should not visit home if no session is established', () => {
    service.sessionUser.set(mockCanNotVisitHome.sessionUser);

    expect(service.canVisitHome()).toBe(false);
  });
  it('should visit result if a session is established and a guess is set', () => {
    service.sessionUser.set(mockCanVisitResult.sessionUser);
    service.userGuess.set(mockCanVisitResult.userGuess);

    expect(service.canVisitResult()).toBe(true);
  });

  it('should not visit result if no session is established and no guess is set', () => {
    service.sessionUser.set(mockCanNotVisitResult.sessionUser);
    service.userGuess.set(mockCanNotVisitResult.userGuess);

    expect(service.canVisitResult()).toBe(false);
  });

  it('should reset session data', () => {
    service.sessionUser.set({ uuid: '', sessionID: '' });
    service.players.set([
      { uuid: '123', name: '', pic: '', guess: 0, won: false },
    ]);
    service.userGuess.set(1);
    service.winningNumber.set(1);

    service.resetSession();

    expect(service.sessionUser()).toBeNull();
    expect(service.players()).toEqual([]);
    expect(service.userGuess()).toEqual(-1);
    expect(service.winningNumber()).toEqual(-1);
  });

  it('should reset user info', () => {
    service.userInfo.set({
      name: 'user',
    });

    service.resetUserInfo();

    expect(service.userInfo()).toBeNull();
  });
});

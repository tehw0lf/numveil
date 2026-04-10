import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { SessionService } from './session.service';
import { StateService } from './state.service';

const mockJoinData = {
  name: 'user',
  uuid: '123',
  sessionID: '123456',
};

const mockJoinSessionState = {
  players: [],
  sessionUser: {
    sessionID: '123456',
    uuid: '123',
  },
  userGuess: -1,
  winningNumber: -1,
};

const mockJoinUserState = {
  name: 'user',
};

const mockRestartData = {
  players: [
    {
      uuid: '123',
      name: 'playerRestart',
      pic: 'pic',
      guess: -1,
      won: false,
    },
  ],
  winningNumber: -1,
};

const mockRestartState = {
  players: [
    {
      guess: -1,
      name: 'playerRestart',
      pic: 'pic',
      uuid: '123',
      won: false,
    },
  ],
  sessionUser: null,
  userGuess: -1,
  winningNumber: -1,
};

const mockRunningData = {
  players: [
    {
      uuid: '123',
      name: 'playerRunning',
      pic: 'pic',
      guess: 1,
      won: false,
    },
  ],
  winningNumber: 42,
};

const mockRunningState = {
  players: [
    {
      guess: 1,
      name: 'playerRunning',
      pic: 'pic',
      uuid: '123',
      won: false,
    },
  ],
  sessionUser: null,
  userGuess: -1,
  winningNumber: 42,
};

const mockResetState = {
  players: [],
  sessionUser: null,
  userGuess: -1,
  winningNumber: -1,
};

const mockGuessedState = {
  players: [],
  sessionUser: null,
  userGuess: 1,
  winningNumber: -1,
};

const mockRouter = { navigate: jest.fn() };

describe('SessionService', () => {
  let service: SessionService;
  let stateService: StateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: mockRouter }],
    });
    service = TestBed.inject(SessionService);
    stateService = TestBed.inject(StateService);
    stateService.resetSession();
    stateService.resetUserInfo();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should do nothing if event is empty', () => {
    expect(() => {
      service.handleIncomingData('', {});
    }).toThrow('default case, this should never happen');
  });

  it('should update state if event is join', () => {
    service.handleIncomingData('join', mockJoinData);

    expect(stateService.players()).toEqual(mockJoinSessionState.players);
    expect(stateService.sessionUser()).toEqual(
      mockJoinSessionState.sessionUser,
    );
    expect(stateService.userGuess()).toEqual(mockJoinSessionState.userGuess);
    expect(stateService.winningNumber()).toEqual(
      mockJoinSessionState.winningNumber,
    );
    expect(stateService.userInfo()).toEqual(mockJoinUserState);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['home']);
  });

  it('should restart the session if event is restart', () => {
    service.handleIncomingData('restart', mockRestartData);

    expect(stateService.players()).toEqual(mockRestartState.players);
    expect(stateService.sessionUser()).toEqual(mockRestartState.sessionUser);
    expect(stateService.userGuess()).toEqual(mockRestartState.userGuess);
    expect(stateService.winningNumber()).toEqual(
      mockRestartState.winningNumber,
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['home']);
  });

  it('should update state if event is running', () => {
    service.handleIncomingData('running', mockRunningData);

    expect(stateService.players()).toEqual(mockRunningState.players);
    expect(stateService.sessionUser()).toEqual(mockRunningState.sessionUser);
    expect(stateService.userGuess()).toEqual(mockRunningState.userGuess);
    expect(stateService.winningNumber()).toEqual(
      mockRunningState.winningNumber,
    );
  });

  it('should leave the session', () => {
    service.leaveSession();

    expect(stateService.players()).toEqual(mockResetState.players);
    expect(stateService.sessionUser()).toEqual(mockResetState.sessionUser);
    expect(stateService.userGuess()).toEqual(mockResetState.userGuess);
    expect(stateService.winningNumber()).toEqual(mockResetState.winningNumber);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['join']);
  });

  it('should join a session', () => {
    service.joinSession(mockJoinData.name, mockJoinData.sessionID);
    // What to expect here?
  });

  it('should send a guess', () => {
    service.sendGuess(1);

    expect(stateService.players()).toEqual(mockGuessedState.players);
    expect(stateService.sessionUser()).toEqual(mockGuessedState.sessionUser);
    expect(stateService.userGuess()).toEqual(mockGuessedState.userGuess);
    expect(stateService.winningNumber()).toEqual(
      mockGuessedState.winningNumber,
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['result']);
  });

  it('should start a new round', () => {
    service.newRound();
  });
});

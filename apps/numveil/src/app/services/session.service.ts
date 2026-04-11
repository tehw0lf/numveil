import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

import { ConfigService } from './config.service';
import { StateService } from './state.service';

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private router: Router = inject(Router);
  private stateService: StateService = inject(StateService);
  private configService: ConfigService = inject(ConfigService);

  private closeSubject$ = new Subject();
  private subject$: WebSocketSubject<any> | null = null;

  closeObservable$: Observable<any> = this.closeSubject$.asObservable();

  private getSocket(): WebSocketSubject<any> {
    if (!this.subject$) {
      this.subject$ = webSocket({
        url: this.configService.getServerUrl(),
        closeObserver: this.closeSubject$,
      });
    }
    return this.subject$;
  }

  reconnect(): void {
    this.subject$ = null;
  }

  initializeConnection(): void {
    this.getSocket()
      .asObservable()
      .pipe(
        tap((data: { eventType: string; serverState: any }) => {
          this.handleIncomingData(data.eventType, data.serverState);
        }),
      )
      .subscribe();
  }

  handleIncomingData(eventType: string, serverState: any) {
    switch (eventType) {
      case 'join':
        this.stateService.userInfo.set({
          name: serverState.name,
          pic: serverState.pic,
        });
        this.stateService.sessionUser.set({
          uuid: serverState.uuid,
          sessionID: serverState.sessionID,
        });
        this.router.navigate(['home']);
        break;

      case 'restart':
        this.stateService.userGuess.set(-1);
        this.stateService.players.set(serverState.players);
        this.stateService.winningNumber.set(serverState.winningNumber);
        this.router.navigate(['home']);
        break;

      case 'running':
        this.stateService.players.set(serverState.players);
        this.stateService.winningNumber.set(serverState.winningNumber);
        break;

      default:
        throw new Error('default case, this should never happen');
    }
  }

  leaveSession(): void {
    this.getSocket().next({
      event: 'leaveSession',
      data: this.stateService.sessionUser(),
    });
    this.router.navigate(['join']);
  }

  joinSession(name: string, sessionID: string): void {
    this.closeObservable$.subscribe(() => {
      this.stateService.resetSession();
    });
    this.getSocket().next({
      event: 'joinSession',
      data: {
        uuid: '',
        sessionID,
        name,
      },
    });
  }

  sendGuess(guess?: number): void {
    this.getSocket().next({
      event: 'guess',
      data: {
        uuid: this.stateService.sessionUser()?.uuid,
        sessionID: this.stateService.sessionUser()?.sessionID,
        guess,
      },
    });
    this.stateService.userGuess.set(guess);
    this.router.navigate(['result']);
  }

  newRound(): void {
    this.getSocket().next({
      event: 'newRound',
      data: {
        uuid: this.stateService.sessionUser()?.uuid,
        sessionID: this.stateService.sessionUser()?.sessionID,
      },
    });
  }
}

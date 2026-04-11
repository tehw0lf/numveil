import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Player } from '@numveil/core';

import { SessionService } from '../services/session.service';
import { StateService } from '../services/state.service';

@Component({
  selector: 'app-result',
  imports: [],
  templateUrl: './result.component.html',
  styleUrl: './result.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultComponent {
  public stateService: StateService = inject(StateService);
  private sessionService: SessionService = inject(SessionService);

  hasGuessed(player: Player): boolean {
    if (player.guess === undefined || player.guess >= 0) {
      return true;
    }
    return false;
  }

  newRound(): void {
    this.sessionService.newRound();
  }

  leaveSession(): void {
    this.sessionService.leaveSession();
  }
}

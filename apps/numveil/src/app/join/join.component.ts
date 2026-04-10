import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { SessionService } from '../services/session.service';

@Component({
  selector: 'app-join',
  imports: [FormsModule],
  templateUrl: './join.component.html',
  styleUrl: './join.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JoinComponent {
  name: WritableSignal<string> = signal('');
  sessionID: WritableSignal<string> = signal('');
  mode: WritableSignal<'create' | 'join'> = signal('create');

  private sessionService: SessionService = inject(SessionService);

  setMode(m: 'create' | 'join'): void {
    this.mode.set(m);
    this.sessionID.set('');
  }

  joinSession(): void {
    if (!this.name()) {
      this.name.set(`Guest${Math.floor(Math.random() * 100000)}`);
    }
    this.sessionService.joinSession(this.name(), this.sessionID());
  }
}

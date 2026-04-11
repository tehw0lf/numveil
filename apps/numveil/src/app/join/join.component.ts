import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  WritableSignal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ConfigService } from '../services/config.service';
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
  showAdvanced: WritableSignal<boolean> = signal(false);

  private configService: ConfigService = inject(ConfigService);
  private sessionService: SessionService = inject(SessionService);

  serverUrl: WritableSignal<string> = this.configService.serverUrl;

  setMode(m: 'create' | 'join'): void {
    this.mode.set(m);
    this.sessionID.set('');
  }

  toggleAdvanced(): void {
    this.showAdvanced.set(!this.showAdvanced());
  }

  applyServerUrl(url: string): void {
    this.configService.setServerUrl(url);
    this.sessionService.reconnect();
  }

  resetServerUrl(): void {
    this.configService.resetServerUrl();
    this.sessionService.reconnect();
  }

  joinSession(): void {
    if (!this.name()) {
      this.name.set(`Guest${Math.floor(Math.random() * 100000)}`);
    }
    this.sessionService.joinSession(this.name(), this.sessionID());
  }
}

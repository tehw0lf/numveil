import { Injectable } from '@angular/core';

interface AppConfig {
  api_url: string;
  api_port: number;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private config: AppConfig = { api_url: 'ws://localhost', api_port: 4444 };

  async load(): Promise<void> {
    const response = await fetch('/config.json');
    this.config = await response.json();
  }

  get apiUrl(): string {
    return this.config.api_url;
  }

  get apiPort(): number {
    return this.config.api_port;
  }
}

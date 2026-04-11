import { Injectable, signal, WritableSignal } from '@angular/core';

const STORAGE_KEY = 'numveil_server_url';

interface AppConfig {
  api_url: string;
  api_port: number;
}

@Injectable({ providedIn: 'root' })
export class ConfigService {
  private config: AppConfig = { api_url: 'ws://localhost', api_port: 4444 };

  readonly serverUrl: WritableSignal<string> = signal(this.buildUrl());

  async load(): Promise<void> {
    const response = await fetch('/config.json');
    this.config = await response.json();
    this.serverUrl.set(this.buildUrl());
  }

  get apiUrl(): string {
    return this.config.api_url;
  }

  get apiPort(): number {
    return this.config.api_port;
  }

  getServerUrl(): string {
    return localStorage.getItem(STORAGE_KEY) ?? this.buildUrl();
  }

  setServerUrl(url: string): void {
    localStorage.setItem(STORAGE_KEY, url);
    this.serverUrl.set(url);
  }

  resetServerUrl(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.serverUrl.set(this.buildUrl());
  }

  private buildUrl(): string {
    if (!this.config.api_port) {
      return this.config.api_url;
    }
    return `${this.config.api_url}:${this.config.api_port}`;
  }
}

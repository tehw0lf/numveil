import { Route } from '@angular/router';

import { RouteGuard } from './route.guard';

export const appRoutes: Route[] = [
  {
    path: 'join',
    loadComponent: () =>
      import('./join/join.component').then((c) => c.JoinComponent),
  },
  {
    path: 'home',
    canActivate: [RouteGuard],
    loadComponent: () =>
      import('./home/home.component').then((c) => c.HomeComponent),
  },
  {
    path: 'result',
    canActivate: [RouteGuard],
    loadComponent: () =>
      import('./result/result.component').then((c) => c.ResultComponent),
  },
  { path: '', redirectTo: 'join', pathMatch: 'full' },
];

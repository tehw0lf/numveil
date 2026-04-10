import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { of } from 'rxjs';

import { RouteGuard } from './route.guard';
import { StateService } from './services/state.service';

const mockActivatedRouteSnapshot = {
  _data: '',
  data: jest.fn(() => {
    return (this as any)._data;
  }),
};

const mockRouterStateSnapshot = {
  url: '/home',
};

const mockStateService = {
  canVisitHome: jest.fn(() => {
    return of(true);
  }),
  canVisitResult: jest.fn(() => {
    return of(true);
  }),
};

describe('RouteGuard', () => {
  let guard: RouteGuard;
  let route: ActivatedRouteSnapshot;
  let state: RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: ActivatedRouteSnapshot,
          useValue: mockActivatedRouteSnapshot,
        },
        {
          provide: RouterStateSnapshot,
          useValue: mockRouterStateSnapshot,
        },
        { provide: StateService, useValue: mockStateService },
      ],
    });
  });

  beforeEach(() => {
    guard = TestBed.inject(RouteGuard);
    route = TestBed.inject(ActivatedRouteSnapshot);
    state = TestBed.inject(RouterStateSnapshot);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should lead to /home', () => {
    state.url = '/home';
    expect(guard.canActivate(route, state)).toBeTruthy();
  });

  it('should lead to /result', () => {
    state.url = '/result';
    expect(guard.canActivate(route, state)).toBeTruthy();
  });

  it('should do nothing otherwise', () => {
    state.url = '';
    expect(guard.canActivate(route, state)).toBeFalsy();
  });
});

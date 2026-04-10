import { inject, Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';

import { StateService } from './services/state.service';

@Injectable({
  providedIn: 'root',
})
export class RouteGuard implements CanActivate {
  private stateService: StateService = inject(StateService);

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    switch (state.url) {
      case '/home':
        return this.stateService.canVisitHome();
      case '/result':
        return this.stateService.canVisitResult();
      default:
        return false;
    }
  }
}

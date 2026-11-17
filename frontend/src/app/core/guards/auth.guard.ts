import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth-service";
export const authGuard: CanActivateFn = async (_, state) => {
  const auth = inject(AuthService),
    router = inject(Router);
  return (await auth.vigente())
    ? true
    : router.createUrlTree(["/login"], {
        queryParams: { returnUrl: state.url },
      });
};
export const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService),
    router = inject(Router);
  const roles = route.data["roles"] as string[];
  return !roles || auth.tiene(...roles)
    ? true
    : router.createUrlTree(["/sin-permiso"]);
};

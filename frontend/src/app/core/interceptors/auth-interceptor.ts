import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { from, switchMap, catchError, throwError } from "rxjs";
import { AuthService } from "../services/auth-service";
import { environment } from "../../../environments/environment";
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService),
    router = inject(Router);
  const base = environment.apiBaseUrl + "/api/";
  if (!req.url.startsWith(base)) return next(req);
  const request = () =>
    req.clone({
      setHeaders: {
        ...(auth.token() ? { Authorization: "Bearer " + auth.token() } : {}),
        "X-Trace-ID": crypto.randomUUID(),
      },
    });
  const expired = () => {
    auth.limpiar();
    void router.navigate(["/login"], {
      queryParams: { returnUrl: router.url },
    });
  };
  return from(auth.vigente()).pipe(
    switchMap((ok) => {
      if (!ok) {
        expired();
        return throwError(() => new Error("Sesión vencida"));
      }
      return next(request()).pipe(
        catchError((err) => {
          if (err.status !== 401) return throwError(() => err);
          return from(auth.refresh()).pipe(
            switchMap((refreshed) => {
              if (!refreshed) {
                expired();
                return throwError(() => err);
              }
              return next(request()).pipe(
                catchError((retryError) => {
                  if (retryError.status === 401) expired();
                  return throwError(() => retryError);
                }),
              );
            }),
          );
        }),
      );
    }),
  );
};

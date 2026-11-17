import { ApplicationConfig, LOCALE_ID } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { registerLocaleData } from "@angular/common";
import es from "@angular/common/locales/es-PE";
import { routes } from "./app.routes";
import { authInterceptor } from "./core/interceptors/auth-interceptor";
registerLocaleData(es);
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: LOCALE_ID, useValue: "es-PE" },
  ],
};

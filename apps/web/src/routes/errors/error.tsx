/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link, useRouteError } from "react-router-dom";

export const ErrorPage = () => {
  const error = useRouteError();
  console.error(error);

  const errorCode = (error as any)?.status || 500;
  const errorMessage =
    (error as any)?.statusText ||
    (error as any)?.message ||
    "Internal Server Error";

  return (
    <main
      id="error-page"
      className="grid min-h-full place-items-center bg-background px-6 py-24 sm:py-32 lg:px-8"
    >
      <p className="text-base font-semibold text-accent">{errorCode}</p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
        Oops!
      </h1>
      <p className="mt-6 text-base leading-7 text-foreground/80">
        Sorry, an unexpected error has occurred
      </p>
      <p className="mt-6 text-base leading-7 text-muted-foreground">
        Details: {errorMessage}
      </p>
      <div className="mt-10 flex items-center justify-center gap-x-6">
        <Link
          to="/"
          className="rounded-md bg-accent px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Go back home
        </Link>
        <a
          href="mailto:support@meelio.io"
          className="text-sm font-semibold text-foreground"
        >
          Contact support <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    </main>
  );
};

import { Link } from "react-router-dom";
import { GuestAuthForm } from "@repo/shared";
import { Logo } from "@repo/shared";
import { AuthLayout } from "@/layouts/auth-layout";

const GuestLogin = () => {
  return (
    <AuthLayout>
      <div className="mx-auto w-full max-w-md sm:px-4 md:w-96 md:max-w-sm md:px-0">
        <div className="flex flex-col justify-center items-center gap-y-8">
          <Link aria-label="Home" to="/">
            <Logo className="w-16 flex-none" />
          </Link>
          <div className="mx-auto flex w-full flex-col justify-center space-y-6">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                Hello! What's your name?
              </h1>
              <p className="text-sm text-muted-foreground">
                Please enter your first name or the name you prefer to be called.
              </p>
            </div>

            <GuestAuthForm />

            <p className="px-8 text-center text-sm text-muted-foreground">
              <Link
                to="/login"
                className="hover:text-brand underline underline-offset-4"
              >
                Have an account? Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
};

export default GuestLogin; 
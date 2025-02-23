import { Button } from "@repo/ui/components/ui/button";
import { Link } from "react-router-dom";

export const LoginProtected = () => {
  return (
    <div className="flex flex-col gap-4 h-full items-center justify-center">
      <div className="text-sm text-muted-foreground">
        Please login to view this page.
      </div>
      <Button asChild>
        <Link to="/login">Login</Link>
      </Button>
    </div>
  );
};

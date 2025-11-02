import { Button } from "@/components/ui/button";
import { Chrome } from "lucide-react";

const SocialLogin = () => {
  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      {/* Google Login Only */}
      <Button
        variant="outline"
        onClick={handleGoogleLogin}
        className="w-full hover:bg-red-50 hover:border-red-200 h-12 text-sm font-medium"
      >
        <Chrome className="h-5 w-5 text-red-500 mr-3" />
        Continue with Google
      </Button>
    </div>
  );
};

export default SocialLogin;
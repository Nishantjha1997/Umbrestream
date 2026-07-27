"use client";

import { Google } from "@/utils/icons";
import { addToast, Button } from "@heroui/react";
import { useCallback } from "react";

type GoogleLoginButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  "children" | "startContent" | "onPress"
>;

// NOTE: no module-scope createClient() here. Doing so runs at import time,
// which is exactly how a missing env var became a page-wide hydration crash.
// Create the client inside the handler if/when OAuth is re-enabled.

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ variant = "faded", ...props }) => {
  const handleGoogleLogin = useCallback(async () => {
    addToast({
      title: "Sorry, Google login is temporarily unavailable.",
      color: "warning",
    });

    return;

    // TODO: Uncomment this when Google login is available again
    // try {
    //   const { error } = await supabase.auth.signInWithOAuth({
    //     provider: "google",
    //     options: {
    //       redirectTo: `${location.origin}/api/auth/callback`,
    //       queryParams: {
    //         access_type: "offline",
    //         prompt: "consent",
    //       },
    //     },
    //   });
    //   if (error) {
    //     addToast({
    //       title: error.message,
    //       color: "danger",
    //     });
    //   }
    // } catch (error) {
    //   console.error("Google login error:", error);
    //   addToast({
    //     title: error instanceof Error ? error.message : "An error occurred. Please try again.",
    //     color: "danger",
    //   });
    // }
  }, []);

  return (
    <Button
      startContent={<Google width={24} />}
      onPress={handleGoogleLogin}
      variant={variant}
      {...props}
    >
      Continue with Google
    </Button>
  );
};

export default GoogleLoginButton;

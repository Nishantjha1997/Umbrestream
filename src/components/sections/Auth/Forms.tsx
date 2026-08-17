"use client";

import { tmdbBrowser, type TrendingResult } from "@/api/tmdb-browser";
import ThreeDMarquee from "@/components/ui/background/ThreeDMarquee";
import IconButton from "@/components/ui/button/IconButton";
import Brand from "@/components/ui/other/BrandLogo";
import { SpacingClasses } from "@/utils/constants";
import { cn, isEmpty, shuffleArray } from "@/utils/helpers";
import { ArrowLeft } from "@/utils/icons";
import { transition, useReducedMotionSafe } from "@/utils/motion";
import { getImageUrl } from "@/utils/movies";
import { Card, CardBody, CardHeader, ScrollShadow } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { parseAsBoolean, parseAsStringLiteral, useQueryState } from "nuqs";
import { useMemo } from "react";
import FormAlert from "./FormAlert";
import AuthForgotPasswordForm from "./ForgotPassword";
import AuthLoginForm from "./Login";
import AuthRegisterForm from "./Register";
import AuthResetPasswordForm from "./ResetPassword";

const ValidForms = ["login", "register", "forgot"] as const;

export interface AuthFormProps {
  setForm: (form: (typeof ValidForms)[number]) => void;
}

const HEADINGS: Record<(typeof ValidForms)[number] | "reset", string> = {
  login: "Welcome back",
  register: "Create your account",
  forgot: "Reset your password",
  reset: "Choose a new password",
};

const AuthForms: React.FC = () => {
  const pathname = usePathname();
  const reset = pathname === "/auth/reset-password";
  const reduceMotion = useReducedMotionSafe();

  const [error, setError] = useQueryState("error", parseAsBoolean.withDefault(false));
  const [form, setForm] = useQueryState(
    "form",
    parseAsStringLiteral(ValidForms).withDefault("login"),
  );

  const { data: movies } = useQuery({
    queryFn: () => tmdbBrowser.trending.trending<TrendingResult>("movie", "day"),
    queryKey: ["movie-auth-posters"],
  });

  const { data: tvShows } = useQuery({
    queryFn: () => tmdbBrowser.trending.trending<TrendingResult>("tv", "day"),
    queryKey: ["tv-auth-posters"],
  });

  const IMAGES = useMemo(() => {
    // Either source alone is enough for a wall. Requiring both meant one failed
    // TMDB call removed the decoration entirely.
    const moviePosters = (movies?.results ?? [])
      .filter((movie) => movie.poster_path)
      .map((movie) => getImageUrl(movie.poster_path ?? undefined, "poster"));
    const tvPosters = (tvShows?.results ?? [])
      .filter((show) => show.poster_path)
      .map((show) => getImageUrl(show.poster_path ?? undefined, "poster"));
    return shuffleArray([...moviePosters, ...tvPosters]);
  }, [movies?.results, tvShows?.results]);

  const activeKey = reset ? "reset" : form;

  return (
    <div
      className={cn(
        "relative z-50 flex h-screen w-screen flex-col items-center justify-center overflow-hidden",
        "before:pointer-events-none before:absolute before:inset-0 before:z-20 before:opacity-40 dark:before:opacity-70",
        "dark:before:bg-[radial-gradient(circle_at_center,transparent_0%,black_100%)]",
        "before:bg-[radial-gradient(circle_at_center,transparent_0%,white_100%)]",
        SpacingClasses.reset,
      )}
    >
      <div className="pointer-events-none relative z-50 container mx-auto flex size-full flex-col items-center justify-center p-3">
        <Card
          shadow="none"
          className="glass-panel pointer-events-auto w-full max-w-lg rounded-(--radius-panel) border p-1 md:p-3"
        >
          <CardHeader className="relative flex flex-col items-center justify-center gap-2 pt-4">
            {form === "forgot" && !reset && (
              <IconButton
                size="md"
                variant="light"
                aria-label="Back to sign in"
                onPress={() => setForm("login")}
                className="group motion-preset-focus absolute top-2 left-2 data-[hover=true]:bg-transparent"
                icon={
                  <ArrowLeft className="text-4xl transition-transform duration-(--duration-fast) ease-(--ease-out-quint) group-hover:scale-125 motion-reduce:transition-none" />
                }
              />
            )}
            <Brand className="text-3xl md:text-4xl" animate />
            {/* The auth screen previously had no h1 at all (§5.8). The <main>
                landmark comes from the root layout, so one is not added here. */}
            <h1 className="text-center text-base font-medium md:text-lg">{HEADINGS[activeKey]}</h1>
          </CardHeader>
          <ScrollShadow hideScrollBar visibility="none">
            <CardBody className="flex flex-col gap-4">
              {error && (
                <FormAlert onDismiss={() => setError(null)}>
                  We couldn&apos;t complete that request. The link may have expired — try again below.
                </FormAlert>
              )}
              {/*
                `mode="wait"` matters: with the previous `mode="sync"` the
                outgoing and incoming forms were mounted at the same time and
                both animated `height: 0 -> auto`, so switching login <-> register
                (two fields taller) visibly punched the card's height up and
                down. Only one form is mounted at a time now, and nothing
                animates a layout property (§5.5).
              */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeKey}
                  // Reduced motion keeps the cross-fade — opacity is not
                  // motion — but drops the travel, which is the part that
                  // actually moves on screen.
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                  transition={reduceMotion ? transition.fast : transition.base}
                >
                  {reset ? (
                    <AuthResetPasswordForm />
                  ) : (
                    {
                      login: <AuthLoginForm setForm={setForm} />,
                      register: <AuthRegisterForm setForm={setForm} />,
                      forgot: <AuthForgotPasswordForm setForm={setForm} />,
                    }[form]
                  )}
                </motion.div>
              </AnimatePresence>
            </CardBody>
          </ScrollShadow>
        </Card>
      </div>
      <div className="pointer-events-none absolute inset-0 z-10 h-full w-full bg-black/60 backdrop-blur-[2px] dark:bg-black/20" />
      {/*
        The poster wall is decoration and nothing else. It used to gate the
        whole screen: `isPendingMovies || isPendingTv` replaced the entire auth
        UI with a bare spinner, so you could not sign in until TMDB answered and
        a TMDB outage left a permanent spinner with no error or timeout branch
        (§5.1). The form above renders immediately and unconditionally; the wall
        fades in behind it if and when it arrives, and its absence costs nothing.
      */}
      {!isEmpty(IMAGES) && (
        <motion.div
          aria-hidden
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          // Opacity only, so this stays on under reduced motion; the wall's
          // own drift is what ThreeDMarquee freezes.
          transition={transition.cinematic}
        >
          <ThreeDMarquee className="absolute" images={IMAGES} aspect="poster" />
        </motion.div>
      )}
    </div>
  );
};

export default AuthForms;

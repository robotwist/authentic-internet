import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * Onboarding is discovered in-world (World Guide NPC, other NPCs) — not via overlay tutorials.
 */
const OnboardingTrigger = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    localStorage.setItem("hasVisitedBefore", "true");
    localStorage.setItem("onboardingCompleted", "true");
  }, [user]);

  return null;
};

export default OnboardingTrigger;

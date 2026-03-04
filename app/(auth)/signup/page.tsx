"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./signup.module.css";
import OwnerCard from "./components/OwnerCard";
import RenterCard from "./components/RenterCard";

export default function Signup() {
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

 const handleContinue = () => {
  if (role === "owner") router.push("/dashboard/owner");
  if (role === "renter") router.push("/dashboard/renter");
};

  return (
    <div className={styles.signupPage}>
      <h1 className={styles.signupHeading}>Join LeaseVerse</h1>

      <p className={styles.signupSubheading}>
        How would you like to use the platform?
      </p>

      <div className={styles.signupCards}>
        <OwnerCard
          active={role === "owner"}
          onClick={() => setRole("owner")}
        />

        <RenterCard
          active={role === "renter"}
          onClick={() => setRole("renter")}
        />
      </div>

      <button
        disabled={!role}
        className={styles.continueButton}
        onClick={handleContinue}
      >
        Continue
      </button>

      <p className={styles.loginText}>
        Already have an account? <span>Log In</span>
      </p>
    </div>
  );
}
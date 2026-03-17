"use client";

import { useEffect, useCallback } from "react";

const PROFILE_KEY = "lab-student-profile";

type Profile = { studentName: string; registerNumber: string };

function readProfile(): Profile {
  if (typeof window === "undefined") return { studentName: "", registerNumber: "" };
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as Profile) : { studentName: "", registerNumber: "" };
  } catch {
    return { studentName: "", registerNumber: "" };
  }
}

export function loadSavedProfile(): Profile {
  return readProfile();
}

export function useSaveProfile() {
  return useCallback((name: string, regNo: string) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify({ studentName: name, registerNumber: regNo }));
    } catch {}
  }, []);
}

"use client";

import { useEffect } from "react";

/** Each screen names itself in the tab / history / screen reader (WCAG 2.4.2). */
export function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · CampusEvent`;
  }, [title]);
}

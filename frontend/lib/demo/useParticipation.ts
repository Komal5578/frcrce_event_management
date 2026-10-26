"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getStoredParticipation,
  markStudentStatus,
  markAllRegisteredAsParticipated,
  resetDemoData,
  type ParticipationRecord,
  type ParticipationStatus,
  demoStudents,
  getStudentById,
} from "./participation";

export function useParticipation() {
  const [records, setRecords] = useState<ParticipationRecord[]>(() => getStoredParticipation());

  const reload = useCallback(() => {
    setRecords(getStoredParticipation());
  }, []);

  useEffect(() => {
    queueMicrotask(() => reload());

    const onCustomUpdate = () => reload();
    const onStorage = (e: StorageEvent) => {
      if (e.key === "demo-v2" || !e.key) {
        reload();
      }
    };
    const onFocus = () => reload();

    window.addEventListener("demo-v2-updated", onCustomUpdate);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("demo-v2-updated", onCustomUpdate);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
    };
  }, [reload]);

  const mark = useCallback(
    (studentId: string, eventId: string, status: ParticipationStatus) => {
      const updated = markStudentStatus(studentId, eventId, status);
      setRecords(updated);
    },
    []
  );

  const markAll = useCallback((eventId: string) => {
    const updated = markAllRegisteredAsParticipated(eventId);
    setRecords(updated);
  }, []);

  const reset = useCallback(() => {
    resetDemoData();
    reload();
  }, [reload]);

  const getEventStats = useCallback(
    (eventId: string) => {
      const evRecords = records.filter((r) => r.eventId === eventId);
      const registered = evRecords.filter((r) => r.status === "registered").length;
      const participated = evRecords.filter((r) => r.status === "participated").length;
      const noShow = evRecords.filter((r) => r.status === "no-show").length;
      const total = evRecords.length;
      const rate = total > 0 ? Math.round((participated / total) * 100) : 0;
      return { registered, participated, noShow, total, rate, records: evRecords };
    },
    [records]
  );

  const getCouncilStats = useCallback(
    (councilId: string) => {
      const cRecords = records.filter((r) => r.councilId === councilId);
      const registered = cRecords.filter((r) => r.status === "registered").length;
      const participated = cRecords.filter((r) => r.status === "participated").length;
      const noShow = cRecords.filter((r) => r.status === "no-show").length;
      const total = cRecords.length;
      const rate = total > 0 ? Math.round((participated / total) * 100) : 0;
      return { registered, participated, noShow, total, rate, records: cRecords };
    },
    [records]
  );

  const getStudentRecords = useCallback(
    (studentId: string) => {
      return records.filter((r) => r.studentId === studentId);
    },
    [records]
  );

  return {
    records,
    demoStudents,
    getStudentById,
    mark,
    markAll,
    reset,
    reload,
    getEventStats,
    getCouncilStats,
    getStudentRecords,
  };
}

"use client";

import { StudentHead } from "@/components/shell/student-shell";
import { NotificationFeed } from "@/components/notification-feed";

export default function StudentNotifications() {
  return (
    <>
      <StudentHead title="Notifications" sub="Reminders and changes" />
      <div className="relative -mt-6 lg:mt-6 px-4 lg:px-8"><NotificationFeed accent="purple" /></div>
    </>
  );
}

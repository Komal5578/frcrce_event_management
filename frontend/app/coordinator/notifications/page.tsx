"use client";

import { NotificationFeed } from "@/components/notification-feed";
import { PageHeader } from "@/components/shell/app-shell";

export default function Notifications() {
  return (
    <>
      <PageHeader title="Notifications" sub="What changed, without checking." />
      <NotificationFeed withAlerts />
    </>
  );
}

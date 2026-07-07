export async function POST(request: Request) {
  const restApiKey = process.env.ONESIGNAL_REST_API_KEY;
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

  if (!restApiKey || !appId) {
    return Response.json({ sent: false, reason: "OneSignal not configured" });
  }

  // Verify Vercel cron secret to prevent unauthorized calls.
  // Fail closed if CRON_SECRET is unset — otherwise "Bearer undefined" would match.
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = {
      app_id: appId,
      included_segments: ["Subscribed Users"],
      headings: { en: "Time to check your maintenance schedule" },
      contents: {
        en: "Open Carlos to see what's due or overdue on your car. Takes 30 seconds.",
      },
      url: `${process.env.NEXT_PUBLIC_APP_URL || ""}/diagnose`,
      chrome_web_icon: `${process.env.NEXT_PUBLIC_APP_URL || ""}/icon-192.png`,
    };

    const res = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${restApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return Response.json({ sent: true, recipients: data.recipients ?? 0 });
  } catch (err) {
    console.error("[send-reminders]", err);
    return Response.json({ sent: false, error: "Failed to send" }, { status: 500 });
  }
}

import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

const clerk = clerkMiddleware();

export async function proxy(request: NextRequest) {
  return clerk(request, {} as never);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};

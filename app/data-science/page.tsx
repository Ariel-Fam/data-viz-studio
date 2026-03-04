"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignInPage } from "../components/SignInPage";
import { DataSciencePage } from "../pages/DataSciencePage";

export default function DataScienceRoutePage() {
  return (
    <>
      <Authenticated>
        <DataSciencePage />
      </Authenticated>

      <Unauthenticated>
        <SignInPage />
      </Unauthenticated>
    </>
  );
}

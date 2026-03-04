
"use client";
import { DashboardPage } from "../pages/DashboardPage";
import { SignInPage } from "../components/SignInPage";

import { Authenticated, Unauthenticated } from 'convex/react'


export default function DashboardRoutePage() {

  return (
    <>
      <Authenticated>
        <Content />
      </Authenticated>

      <Unauthenticated>
        <SignInPage />
      </Unauthenticated>
    </>
  )
}


function Content() {
  
  return <DashboardPage />
}



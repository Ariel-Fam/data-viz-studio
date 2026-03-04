"use client";
import { SignInPage } from "./components/SignInPage";
import { LandingPage } from "./pages/LandingPage";
import { Authenticated, Unauthenticated } from 'convex/react'


export default function HomePage() {

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
  
  return <LandingPage />
}